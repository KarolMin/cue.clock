import { useCallback, useEffect, useRef, useState } from 'react';
import { Settings } from '../types/settings';

export type PlayerId = 1 | 2;

export interface GameLogEntry {
  gameNumber: number;
  winner: PlayerId;
  extensionsUsed: Record<PlayerId, number>;
}

export interface ShotRecord {
  player: PlayerId;
  durationMs: number;
}

export interface MatchState {
  currentPlayer: PlayerId;
  gameNumber: number;
  shotRemainingMs: number;
  shotElapsedMs: number;
  totalRemainingMs: number | null;
  matchElapsedMs: number;
  extensionsUsed: Record<PlayerId, number>;
  totalExtensionsUsed: Record<PlayerId, number>;
  totalFouls: Record<PlayerId, number>;
  score: Record<PlayerId, number>;
  gamesLog: GameLogEntry[];
  shotLog: ShotRecord[];
  isRunning: boolean;
  isExpired: boolean;
  isMatchTimeExpired: boolean;
}

interface Callbacks {
  onWarning?: () => void;
  onTick?: () => void;
  onBuzzer?: () => void;
}

const TICK_MS = 100;
const WARNING_THRESHOLD_MS = 10_000;
const FINAL_COUNTDOWN_SECONDS = 5;

function initialState(settings: Settings): MatchState {
  return {
    currentPlayer: 1,
    gameNumber: 1,
    shotRemainingMs: settings.shotSeconds * 1000,
    shotElapsedMs: 0,
    totalRemainingMs: settings.totalMatchEnabled ? settings.totalMatchMinutes * 60 * 1000 : null,
    matchElapsedMs: 0,
    extensionsUsed: { 1: 0, 2: 0 },
    totalExtensionsUsed: { 1: 0, 2: 0 },
    totalFouls: { 1: 0, 2: 0 },
    score: { 1: 0, 2: 0 },
    gamesLog: [],
    shotLog: [],
    isRunning: false,
    isExpired: false,
    isMatchTimeExpired: false,
  };
}

// Ends the in-progress shot for the current player and logs its duration,
// unless it already ended via a time-out (recorded by the tick effect instead).
function logShotIfNeeded(prev: MatchState): ShotRecord[] {
  if (prev.isExpired || prev.shotElapsedMs <= 0) return prev.shotLog;
  return [...prev.shotLog, { player: prev.currentPlayer, durationMs: prev.shotElapsedMs }];
}

export function useMatchTimer(settings: Settings, callbacks: Callbacks = {}) {
  const [state, setState] = useState<MatchState>(() => initialState(settings));
  const lastTsRef = useRef<number | null>(null);
  const warningFiredRef = useRef(false);
  const lastTickSecondRef = useRef<number | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  useEffect(() => {
    if (!state.isRunning) {
      lastTsRef.current = null;
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const last = lastTsRef.current ?? now;
      const deltaMs = now - last;
      lastTsRef.current = now;

      setState((prev) => {
        if (!prev.isRunning) return prev;

        const shotRemainingMs = Math.max(0, prev.shotRemainingMs - deltaMs);
        const shotElapsedMs = prev.shotElapsedMs + deltaMs;
        const totalRemainingMs =
          prev.totalRemainingMs === null ? null : Math.max(0, prev.totalRemainingMs - deltaMs);

        if (!warningFiredRef.current && shotRemainingMs <= WARNING_THRESHOLD_MS && shotRemainingMs > 0) {
          warningFiredRef.current = true;
          callbacksRef.current.onWarning?.();
        }

        const secondsLeft = Math.ceil(shotRemainingMs / 1000);
        if (
          secondsLeft <= FINAL_COUNTDOWN_SECONDS &&
          secondsLeft >= 1 &&
          secondsLeft !== lastTickSecondRef.current
        ) {
          lastTickSecondRef.current = secondsLeft;
          callbacksRef.current.onTick?.();
        }

        const shotJustExpired = shotRemainingMs === 0 && !prev.isExpired;
        const matchJustExpired =
          totalRemainingMs === 0 && prev.totalRemainingMs !== null && prev.totalRemainingMs > 0;
        if (shotJustExpired || matchJustExpired) {
          callbacksRef.current.onBuzzer?.();
        }

        return {
          ...prev,
          shotRemainingMs,
          shotElapsedMs: shotJustExpired ? 0 : shotElapsedMs,
          totalRemainingMs,
          matchElapsedMs: prev.matchElapsedMs + deltaMs,
          isExpired: prev.isExpired || shotJustExpired,
          isMatchTimeExpired: prev.isMatchTimeExpired || matchJustExpired,
          isRunning: shotJustExpired || matchJustExpired ? false : prev.isRunning,
          totalFouls: shotJustExpired
            ? { ...prev.totalFouls, [prev.currentPlayer]: prev.totalFouls[prev.currentPlayer] + 1 }
            : prev.totalFouls,
          shotLog: shotJustExpired
            ? [...prev.shotLog, { player: prev.currentPlayer, durationMs: shotElapsedMs }]
            : prev.shotLog,
        };
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [state.isRunning]);

  const toggleRunning = useCallback(() => {
    setState((prev) => {
      if (prev.isExpired || prev.isMatchTimeExpired) return prev;
      return { ...prev, isRunning: !prev.isRunning };
    });
  }, []);

  const newShot = useCallback(() => {
    warningFiredRef.current = false;
    lastTickSecondRef.current = null;
    setState((prev) => ({
      ...prev,
      shotRemainingMs: settings.shotSeconds * 1000,
      shotElapsedMs: 0,
      shotLog: logShotIfNeeded(prev),
      isExpired: false,
    }));
  }, [settings.shotSeconds]);

  const switchPlayer = useCallback(() => {
    warningFiredRef.current = false;
    lastTickSecondRef.current = null;
    setState((prev) => ({
      ...prev,
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
      shotRemainingMs: settings.shotSeconds * 1000,
      shotElapsedMs: 0,
      shotLog: logShotIfNeeded(prev),
      isExpired: false,
    }));
  }, [settings.shotSeconds]);

  const useExtension = useCallback(() => {
    setState((prev) => {
      if (prev.isExpired) return prev;
      const used = prev.extensionsUsed[prev.currentPlayer];
      if (used >= settings.extensionsPerGame) return prev;
      return {
        ...prev,
        shotRemainingMs: prev.shotRemainingMs + settings.extensionSeconds * 1000,
        extensionsUsed: { ...prev.extensionsUsed, [prev.currentPlayer]: used + 1 },
        totalExtensionsUsed: {
          ...prev.totalExtensionsUsed,
          [prev.currentPlayer]: prev.totalExtensionsUsed[prev.currentPlayer] + 1,
        },
      };
    });
  }, [settings.extensionsPerGame, settings.extensionSeconds]);

  const endGame = useCallback(
    (winner: PlayerId) => {
      warningFiredRef.current = false;
      lastTickSecondRef.current = null;
      setState((prev) => ({
        ...prev,
        score: { ...prev.score, [winner]: prev.score[winner] + 1 },
        gamesLog: [
          ...prev.gamesLog,
          { gameNumber: prev.gameNumber, winner, extensionsUsed: prev.extensionsUsed },
        ],
        shotLog: logShotIfNeeded(prev),
        gameNumber: prev.gameNumber + 1,
        shotRemainingMs: settings.shotSeconds * 1000,
        shotElapsedMs: 0,
        extensionsUsed: { 1: 0, 2: 0 },
        isExpired: false,
        isRunning: false,
      }));
    },
    [settings.shotSeconds]
  );

  return { state, toggleRunning, newShot, switchPlayer, useExtension, endGame };
}

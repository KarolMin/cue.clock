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
  totalGameRemainingMs: number | null;
  gameElapsedMs: number;
  matchStarted: boolean;
  extensionsUsed: Record<PlayerId, number>;
  totalExtensionsUsed: Record<PlayerId, number>;
  totalFouls: Record<PlayerId, number>;
  totalOtherFouls: Record<PlayerId, number>;
  score: Record<PlayerId, number>;
  gamesLog: GameLogEntry[];
  shotLog: ShotRecord[];
  isRunning: boolean;
  isExpired: boolean;
  foulReason: 'time' | 'manual' | null;
  isMatchTimeExpired: boolean;
  isGameTimeExpired: boolean;
}

interface Callbacks {
  onWarning?: () => void;
  onTick?: () => void;
  onBuzzer?: () => void;
}

const TICK_MS = 100;
const WARNING_THRESHOLD_MS = 10_000;
const FINAL_COUNTDOWN_SECONDS = 5;
// Ball-in-hand bonus: after any foul (time-out or manually called), the
// incoming player gets a few extra seconds on their next shot once they
// switch in.
const FOUL_SWITCH_BONUS_SECONDS = 5;

function initialState(settings: Settings): MatchState {
  return {
    currentPlayer: 1,
    gameNumber: 1,
    shotRemainingMs: settings.shotSeconds * 1000,
    shotElapsedMs: 0,
    totalRemainingMs: settings.totalMatchEnabled ? settings.totalMatchMinutes * 60 * 1000 : null,
    matchElapsedMs: 0,
    totalGameRemainingMs: settings.totalGameEnabled ? settings.totalGameMinutes * 60 * 1000 : null,
    gameElapsedMs: 0,
    matchStarted: false,
    extensionsUsed: { 1: 0, 2: 0 },
    totalExtensionsUsed: { 1: 0, 2: 0 },
    totalFouls: { 1: 0, 2: 0 },
    totalOtherFouls: { 1: 0, 2: 0 },
    score: { 1: 0, 2: 0 },
    gamesLog: [],
    shotLog: [],
    isRunning: false,
    isExpired: false,
    foulReason: null,
    isMatchTimeExpired: false,
    isGameTimeExpired: false,
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
  const shotTsRef = useRef<number | null>(null);
  const matchTsRef = useRef<number | null>(null);
  const warningFiredRef = useRef(false);
  const lastTickSecondRef = useRef<number | null>(null);
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Shot clock: counts down only while actively running (Start/Pauza).
  useEffect(() => {
    if (!state.isRunning) {
      shotTsRef.current = null;
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const last = shotTsRef.current ?? now;
      const deltaMs = now - last;
      shotTsRef.current = now;

      setState((prev) => {
        if (!prev.isRunning) return prev;

        const shotRemainingMs = Math.max(0, prev.shotRemainingMs - deltaMs);
        const shotElapsedMs = prev.shotElapsedMs + deltaMs;

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
        if (shotJustExpired) {
          callbacksRef.current.onBuzzer?.();
        }

        return {
          ...prev,
          shotRemainingMs,
          shotElapsedMs: shotJustExpired ? 0 : shotElapsedMs,
          isExpired: prev.isExpired || shotJustExpired,
          foulReason: shotJustExpired ? 'time' : prev.foulReason,
          isRunning: shotJustExpired ? false : prev.isRunning,
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

  // Match clock: once the match has started, keeps running continuously
  // (matchElapsedMs, and the optional total-match countdown) regardless of
  // shot-clock pauses or time-out fouls — a foul doesn't pause the match.
  useEffect(() => {
    if (!state.matchStarted || state.isMatchTimeExpired) {
      matchTsRef.current = null;
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const last = matchTsRef.current ?? now;
      const deltaMs = now - last;
      matchTsRef.current = now;

      setState((prev) => {
        if (!prev.matchStarted || prev.isMatchTimeExpired) return prev;

        const totalRemainingMs =
          prev.totalRemainingMs === null ? null : Math.max(0, prev.totalRemainingMs - deltaMs);
        const matchJustExpired =
          totalRemainingMs === 0 && prev.totalRemainingMs !== null && prev.totalRemainingMs > 0;

        const totalGameRemainingMs = prev.isGameTimeExpired
          ? prev.totalGameRemainingMs
          : prev.totalGameRemainingMs === null
            ? null
            : Math.max(0, prev.totalGameRemainingMs - deltaMs);
        const gameJustExpired =
          !prev.isGameTimeExpired &&
          totalGameRemainingMs === 0 &&
          prev.totalGameRemainingMs !== null &&
          prev.totalGameRemainingMs > 0;

        if (matchJustExpired || gameJustExpired) {
          callbacksRef.current.onBuzzer?.();
        }

        return {
          ...prev,
          matchElapsedMs: prev.matchElapsedMs + deltaMs,
          gameElapsedMs: prev.isGameTimeExpired ? prev.gameElapsedMs : prev.gameElapsedMs + deltaMs,
          totalRemainingMs,
          totalGameRemainingMs,
          isMatchTimeExpired: prev.isMatchTimeExpired || matchJustExpired,
          isGameTimeExpired: prev.isGameTimeExpired || gameJustExpired,
          isRunning: matchJustExpired || gameJustExpired ? false : prev.isRunning,
        };
      });
    }, TICK_MS);

    return () => clearInterval(interval);
  }, [state.matchStarted, state.isMatchTimeExpired]);

  const toggleRunning = useCallback(() => {
    setState((prev) => {
      if (prev.isExpired || prev.isMatchTimeExpired || prev.isGameTimeExpired) return prev;
      const isRunning = !prev.isRunning;
      return { ...prev, isRunning, matchStarted: prev.matchStarted || isRunning };
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
      foulReason: null,
      isRunning: !prev.isMatchTimeExpired && !prev.isGameTimeExpired,
      matchStarted: true,
    }));
  }, [settings.shotSeconds]);

  const switchPlayer = useCallback(() => {
    warningFiredRef.current = false;
    lastTickSecondRef.current = null;
    setState((prev) => {
      const foulBonusMs = prev.isExpired ? FOUL_SWITCH_BONUS_SECONDS * 1000 : 0;
      return {
        ...prev,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        shotRemainingMs: settings.shotSeconds * 1000 + foulBonusMs,
        shotElapsedMs: 0,
        shotLog: logShotIfNeeded(prev),
        isExpired: false,
        foulReason: null,
        isRunning: !prev.isMatchTimeExpired && !prev.isGameTimeExpired,
        matchStarted: true,
      };
    });
  }, [settings.shotSeconds]);

  // Manually calls a foul on the current player for a reason other than the
  // shot clock running out (e.g. a rules violation) — has the same effect as
  // a time-out foul (stops the clock, requires a new shot or a switch) but is
  // tallied separately so it doesn't get confused with time-out fouls.
  const callFoul = useCallback(() => {
    setState((prev) => {
      if (prev.isExpired) return prev;
      callbacksRef.current.onBuzzer?.();
      return {
        ...prev,
        isExpired: true,
        foulReason: 'manual',
        isRunning: false,
        totalOtherFouls: {
          ...prev.totalOtherFouls,
          [prev.currentPlayer]: prev.totalOtherFouls[prev.currentPlayer] + 1,
        },
        shotLog: [...prev.shotLog, { player: prev.currentPlayer, durationMs: prev.shotElapsedMs }],
      };
    });
  }, []);

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
        gameElapsedMs: 0,
        totalGameRemainingMs: settings.totalGameEnabled ? settings.totalGameMinutes * 60 * 1000 : null,
        isGameTimeExpired: false,
        extensionsUsed: { 1: 0, 2: 0 },
        isExpired: false,
        foulReason: null,
        isRunning: false,
      }));
    },
    [settings.shotSeconds, settings.totalGameEnabled, settings.totalGameMinutes]
  );

  return { state, toggleRunning, newShot, switchPlayer, useExtension, endGame, callFoul };
}

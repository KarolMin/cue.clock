import { useCallback, useEffect, useRef, useState } from 'react';
import { Settings } from '../types/settings';

export type PlayerId = 1 | 2;

export interface GameLogEntry {
  gameNumber: number;
  winner: PlayerId;
  extensionsUsed: Record<PlayerId, number>;
}

export interface MatchState {
  currentPlayer: PlayerId;
  gameNumber: number;
  shotRemainingMs: number;
  totalRemainingMs: number | null;
  extensionsUsed: Record<PlayerId, number>;
  totalExtensionsUsed: Record<PlayerId, number>;
  totalFouls: Record<PlayerId, number>;
  score: Record<PlayerId, number>;
  gamesLog: GameLogEntry[];
  isRunning: boolean;
  isExpired: boolean;
  isMatchTimeExpired: boolean;
}

interface Callbacks {
  onWarning?: () => void;
  onBuzzer?: () => void;
}

const TICK_MS = 100;
const WARNING_THRESHOLD_MS = 10_000;

function initialState(settings: Settings): MatchState {
  return {
    currentPlayer: 1,
    gameNumber: 1,
    shotRemainingMs: settings.shotSeconds * 1000,
    totalRemainingMs: settings.totalMatchEnabled ? settings.totalMatchMinutes * 60 * 1000 : null,
    extensionsUsed: { 1: 0, 2: 0 },
    totalExtensionsUsed: { 1: 0, 2: 0 },
    totalFouls: { 1: 0, 2: 0 },
    score: { 1: 0, 2: 0 },
    gamesLog: [],
    isRunning: false,
    isExpired: false,
    isMatchTimeExpired: false,
  };
}

export function useMatchTimer(settings: Settings, callbacks: Callbacks = {}) {
  const [state, setState] = useState<MatchState>(() => initialState(settings));
  const lastTsRef = useRef<number | null>(null);
  const warningFiredRef = useRef(false);
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
        const totalRemainingMs =
          prev.totalRemainingMs === null ? null : Math.max(0, prev.totalRemainingMs - deltaMs);

        if (!warningFiredRef.current && shotRemainingMs <= WARNING_THRESHOLD_MS && shotRemainingMs > 0) {
          warningFiredRef.current = true;
          callbacksRef.current.onWarning?.();
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
          totalRemainingMs,
          isExpired: prev.isExpired || shotJustExpired,
          isMatchTimeExpired: prev.isMatchTimeExpired || matchJustExpired,
          isRunning: shotJustExpired || matchJustExpired ? false : prev.isRunning,
          totalFouls: shotJustExpired
            ? { ...prev.totalFouls, [prev.currentPlayer]: prev.totalFouls[prev.currentPlayer] + 1 }
            : prev.totalFouls,
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
    setState((prev) => ({
      ...prev,
      shotRemainingMs: settings.shotSeconds * 1000,
      isExpired: false,
    }));
  }, [settings.shotSeconds]);

  const switchPlayer = useCallback(() => {
    warningFiredRef.current = false;
    setState((prev) => ({
      ...prev,
      currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
      shotRemainingMs: settings.shotSeconds * 1000,
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
      setState((prev) => ({
        ...prev,
        score: { ...prev.score, [winner]: prev.score[winner] + 1 },
        gamesLog: [
          ...prev.gamesLog,
          { gameNumber: prev.gameNumber, winner, extensionsUsed: prev.extensionsUsed },
        ],
        gameNumber: prev.gameNumber + 1,
        shotRemainingMs: settings.shotSeconds * 1000,
        extensionsUsed: { 1: 0, 2: 0 },
        isExpired: false,
        isRunning: false,
      }));
    },
    [settings.shotSeconds]
  );

  return { state, toggleRunning, newShot, switchPlayer, useExtension, endGame };
}

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
  extensionsUsed: Record<PlayerId, number>;
  totalExtensionsUsed: Record<PlayerId, number>;
  totalFouls: Record<PlayerId, number>;
  totalOtherFouls: Record<PlayerId, number>;
  score: Record<PlayerId, number>;
  gamesLog: GameLogEntry[];
  shotLog: ShotRecord[];
  isRunning: boolean;
  isMatchRunning: boolean;
  isExpired: boolean;
  isMatchTimeExpired: boolean;
  isGameTimeExpired: boolean;
}

interface Callbacks {
  onWarning?: () => void;
  onTick?: () => void;
  onBuzzer?: () => void;
  onGameTimeWarning?: () => void;
}

const TICK_MS = 100;
const WARNING_THRESHOLD_MS = 10_000;
const FINAL_COUNTDOWN_SECONDS = 5;
// Game-time-remaining warnings (only relevant when a max game time is set).
const GAME_TIME_WARNING_THRESHOLDS_MS = [120_000, 60_000];
// Ball-in-hand bonus: after any foul (time-out or manually called), the
// incoming player gets a few extra seconds on their next shot once they
// switch in.
const FOUL_SWITCH_BONUS_SECONDS = 5;
// The first shot of every game — the break — gets a few extra seconds,
// since it takes longer to line up than a regular shot.
const BREAK_SHOT_BONUS_SECONDS = 5;

function initialState(settings: Settings): MatchState {
  return {
    currentPlayer: 1,
    gameNumber: 1,
    shotRemainingMs: settings.shotSeconds * 1000 + BREAK_SHOT_BONUS_SECONDS * 1000,
    shotElapsedMs: 0,
    totalRemainingMs: settings.totalMatchEnabled ? settings.totalMatchMinutes * 60 * 1000 : null,
    matchElapsedMs: 0,
    totalGameRemainingMs: settings.totalGameEnabled ? settings.totalGameMinutes * 60 * 1000 : null,
    gameElapsedMs: 0,
    extensionsUsed: { 1: 0, 2: 0 },
    totalExtensionsUsed: { 1: 0, 2: 0 },
    totalFouls: { 1: 0, 2: 0 },
    totalOtherFouls: { 1: 0, 2: 0 },
    score: { 1: 0, 2: 0 },
    gamesLog: [],
    shotLog: [],
    isRunning: false,
    isMatchRunning: false,
    isExpired: false,
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
  const tickTsRef = useRef<number | null>(null);
  const warningFiredRef = useRef(false);
  const lastTickSecondRef = useRef<number | null>(null);
  const gameTimeWarningsFiredRef = useRef<Set<number>>(new Set());
  const callbacksRef = useRef(callbacks);
  callbacksRef.current = callbacks;

  // Single clock, driving the shot clock, the match clock, and the game
  // clock together while the match is running (isMatchRunning). The shot
  // clock itself can additionally be paused on its own — tapping a player
  // panel (newShot/switchPlayer) resets it without stopping match/game time
  // — so its per-tick updates are further gated on isRunning, while
  // match/game time keeps advancing whenever isMatchRunning is true.
  useEffect(() => {
    if (!state.isMatchRunning) {
      tickTsRef.current = null;
      return;
    }
    const interval = setInterval(() => {
      const now = Date.now();
      const last = tickTsRef.current ?? now;
      const deltaMs = now - last;
      tickTsRef.current = now;

      setState((prev) => {
        if (!prev.isMatchRunning) return prev;

        const shotRunning = prev.isRunning;

        const shotRemainingMs = shotRunning ? Math.max(0, prev.shotRemainingMs - deltaMs) : prev.shotRemainingMs;
        const shotElapsedMs = shotRunning ? prev.shotElapsedMs + deltaMs : prev.shotElapsedMs;

        if (
          shotRunning &&
          !warningFiredRef.current &&
          shotRemainingMs <= WARNING_THRESHOLD_MS &&
          shotRemainingMs > 0
        ) {
          warningFiredRef.current = true;
          callbacksRef.current.onWarning?.();
        }

        const secondsLeft = Math.ceil(shotRemainingMs / 1000);
        if (
          shotRunning &&
          secondsLeft <= FINAL_COUNTDOWN_SECONDS &&
          secondsLeft >= 1 &&
          secondsLeft !== lastTickSecondRef.current
        ) {
          lastTickSecondRef.current = secondsLeft;
          callbacksRef.current.onTick?.();
        }

        const shotJustExpired = shotRunning && shotRemainingMs === 0 && !prev.isExpired;

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

        if (shotJustExpired || matchJustExpired || gameJustExpired) {
          callbacksRef.current.onBuzzer?.();
        }

        for (const threshold of GAME_TIME_WARNING_THRESHOLDS_MS) {
          if (
            !gameTimeWarningsFiredRef.current.has(threshold) &&
            totalGameRemainingMs !== null &&
            totalGameRemainingMs <= threshold &&
            totalGameRemainingMs > 0
          ) {
            gameTimeWarningsFiredRef.current.add(threshold);
            callbacksRef.current.onGameTimeWarning?.();
          }
        }

        // A shot-clock timeout is a foul, but — unlike Pause or a manually
        // called foul — it doesn't stop the game/match clock: it instantly
        // switches to the opponent (with the usual ball-in-hand bonus) and
        // keeps their shot clock running right away. A simultaneous
        // match/game time expiry still overrides this and halts everything.
        const timeoutFoulSwitch = shotJustExpired && !matchJustExpired && !gameJustExpired;
        if (timeoutFoulSwitch) {
          warningFiredRef.current = false;
          lastTickSecondRef.current = null;
        }

        return {
          ...prev,
          currentPlayer: timeoutFoulSwitch
            ? prev.currentPlayer === 1
              ? 2
              : 1
            : prev.currentPlayer,
          shotRemainingMs: timeoutFoulSwitch
            ? settings.shotSeconds * 1000 + FOUL_SWITCH_BONUS_SECONDS * 1000
            : shotRemainingMs,
          shotElapsedMs: timeoutFoulSwitch ? 0 : shotJustExpired ? 0 : shotElapsedMs,
          isExpired: matchJustExpired || gameJustExpired ? shotJustExpired : false,
          matchElapsedMs: prev.matchElapsedMs + deltaMs,
          gameElapsedMs: prev.isGameTimeExpired ? prev.gameElapsedMs : prev.gameElapsedMs + deltaMs,
          totalRemainingMs,
          totalGameRemainingMs,
          isMatchTimeExpired: prev.isMatchTimeExpired || matchJustExpired,
          isGameTimeExpired: prev.isGameTimeExpired || gameJustExpired,
          isRunning: matchJustExpired || gameJustExpired ? false : shotJustExpired ? true : prev.isRunning,
          isMatchRunning: matchJustExpired || gameJustExpired ? false : prev.isMatchRunning,
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
  }, [state.isMatchRunning]);

  const toggleRunning = useCallback(() => {
    setState((prev) => {
      if (prev.isExpired || prev.isMatchTimeExpired || prev.isGameTimeExpired) return prev;
      const next = !prev.isMatchRunning;
      return { ...prev, isRunning: next, isMatchRunning: next };
    });
  }, []);

  // Tapping the shooting player's own panel is a two-stage action, like a
  // chess clock: while their shot clock is actively ticking, the first tap
  // only freezes it in place (no reset) so match/game time keep running
  // uninterrupted and the Start/Pause button stays untouched. Only a second
  // tap (once the shot clock is already paused) resets it for the next shot
  // and — if the match is still running — resumes it immediately, with no
  // separate Start press needed.
  //
  // If nothing has run yet on the current shot (shotElapsedMs === 0) — e.g.
  // right after a manual Foul loaded the ball-in-hand bonus time — a tap
  // just starts that already-loaded time instead of resetting it again.
  const newShot = useCallback(() => {
    setState((prev) => {
      if (prev.isRunning) {
        return { ...prev, isRunning: false };
      }
      if (prev.shotElapsedMs === 0) {
        return { ...prev, isRunning: prev.isMatchRunning };
      }
      warningFiredRef.current = false;
      lastTickSecondRef.current = null;
      return {
        ...prev,
        shotRemainingMs: settings.shotSeconds * 1000,
        shotElapsedMs: 0,
        shotLog: logShotIfNeeded(prev),
        isExpired: false,
        isRunning: prev.isMatchRunning,
      };
    });
  }, [settings.shotSeconds]);

  // Same two-stage behaviour as newShot, but for switching to the other
  // player: first tap just freezes the shot clock, second tap performs the
  // actual switch and resets/resumes it.
  const switchPlayer = useCallback(() => {
    setState((prev) => {
      if (prev.isRunning) {
        return { ...prev, isRunning: false };
      }
      warningFiredRef.current = false;
      lastTickSecondRef.current = null;
      const foulBonusMs = prev.isExpired ? FOUL_SWITCH_BONUS_SECONDS * 1000 : 0;
      return {
        ...prev,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        shotRemainingMs: settings.shotSeconds * 1000 + foulBonusMs,
        shotElapsedMs: 0,
        shotLog: logShotIfNeeded(prev),
        isExpired: false,
        isRunning: prev.isMatchRunning,
      };
    });
  }, [settings.shotSeconds]);

  // Manually calls a foul on the current player for a reason other than the
  // shot clock running out (e.g. a rules violation) — tallied separately from
  // time-out fouls. Immediately switches to the other player and loads their
  // shot clock with the ball-in-hand bonus, without pausing the game/match
  // clock — but (unlike a time-out foul) it doesn't start ticking on its
  // own: the opponent's shot only starts once their panel is tapped.
  const callFoul = useCallback(() => {
    warningFiredRef.current = false;
    lastTickSecondRef.current = null;
    setState((prev) => {
      if (prev.isExpired) return prev;
      callbacksRef.current.onBuzzer?.();
      return {
        ...prev,
        currentPlayer: prev.currentPlayer === 1 ? 2 : 1,
        shotRemainingMs: settings.shotSeconds * 1000 + FOUL_SWITCH_BONUS_SECONDS * 1000,
        shotElapsedMs: 0,
        shotLog: [...prev.shotLog, { player: prev.currentPlayer, durationMs: prev.shotElapsedMs }],
        isExpired: false,
        totalOtherFouls: {
          ...prev.totalOtherFouls,
          [prev.currentPlayer]: prev.totalOtherFouls[prev.currentPlayer] + 1,
        },
        isRunning: false,
      };
    });
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
      gameTimeWarningsFiredRef.current.clear();
      setState((prev) => ({
        ...prev,
        score: { ...prev.score, [winner]: prev.score[winner] + 1 },
        gamesLog: [
          ...prev.gamesLog,
          { gameNumber: prev.gameNumber, winner, extensionsUsed: prev.extensionsUsed },
        ],
        shotLog: logShotIfNeeded(prev),
        gameNumber: prev.gameNumber + 1,
        shotRemainingMs: settings.shotSeconds * 1000 + BREAK_SHOT_BONUS_SECONDS * 1000,
        shotElapsedMs: 0,
        gameElapsedMs: 0,
        totalGameRemainingMs: settings.totalGameEnabled ? settings.totalGameMinutes * 60 * 1000 : null,
        isGameTimeExpired: false,
        extensionsUsed: { 1: 0, 2: 0 },
        isExpired: false,
        isRunning: false,
        isMatchRunning: false,
      }));
    },
    [settings.shotSeconds, settings.totalGameEnabled, settings.totalGameMinutes]
  );

  return { state, toggleRunning, newShot, switchPlayer, useExtension, endGame, callFoul };
}

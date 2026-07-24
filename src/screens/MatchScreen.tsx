import { Ionicons } from '@expo/vector-icons';
import { useKeepAwake } from 'expo-keep-awake';
import { Fragment, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppModal } from '../components/AppModal';
import { PlayerPanel } from '../components/PlayerPanel';
import { StatsTable } from '../components/StatsTable';
import { PlayerId, ShotRecord, useMatchTimer } from '../hooks/useMatchTimer';
import { useShotClockSounds } from '../sound/useShotClockSounds';
import { ThemeColors } from '../theme/colors';
import { MAX_CONTENT_WIDTH, MAX_CONTENT_WIDTH_LANDSCAPE } from '../theme/layout';
import { useTheme } from '../theme/ThemeContext';
import { Settings } from '../types/settings';
import { formatMinutesSeconds, formatSecondsDecimal, formatShotSeconds } from '../utils/format';

interface Props {
  settings: Settings;
  onEndMatch: () => void;
}

interface GameSummary {
  gameNumber: number;
  winner: PlayerId;
  extensionsUsed: Record<PlayerId, number>;
  scoreAfter: Record<PlayerId, number>;
  matchWon: boolean;
}

const WARNING_THRESHOLD_MS = 10_000;

export function MatchScreen({ settings, onEndMatch }: Props) {
  useKeepAwake();
  const { colors } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { playWarning, playBuzzer, playTick } = useShotClockSounds();
  const { state, toggleRunning, newShot, switchPlayer, useExtension, endGame } = useMatchTimer(
    settings,
    { onWarning: playWarning, onTick: playTick, onBuzzer: playBuzzer }
  );

  const [pickingWinner, setPickingWinner] = useState(false);
  const [gameSummary, setGameSummary] = useState<GameSummary | null>(null);
  const [showMatchSummary, setShowMatchSummary] = useState(false);
  const [confirmingEndMatch, setConfirmingEndMatch] = useState(false);

  const isLow = state.shotRemainingMs <= WARNING_THRESHOLD_MS;
  const currentPlayerColor = state.currentPlayer === 1 ? colors.player1 : colors.player2;
  const clockColor = state.isExpired ? colors.danger : isLow ? colors.warning : currentPlayerColor;

  // Landscape spreads a player panel either side of the clock, so the clock's
  // own column is narrower than the full screen — and the screen is shorter,
  // so the font must also respect the available height.
  const landscapeWidth = Math.min(width, MAX_CONTENT_WIDTH_LANDSCAPE);
  const sidePanelWidth = Math.min(260, landscapeWidth * 0.28);
  const contentWidth = isLandscape
    ? landscapeWidth - sidePanelWidth * 2 - 88
    : Math.min(width, MAX_CONTENT_WIDTH) - 40;
  const clockFontSize = isLandscape
    ? Math.max(80, Math.min(220, contentWidth * 0.4, height * 0.46))
    : Math.max(100, Math.min(200, contentWidth * 0.38));

  const handlePickWinner = (winner: PlayerId) => {
    const newScore = state.score[winner] + 1;
    setGameSummary({
      gameNumber: state.gameNumber,
      winner,
      extensionsUsed: { ...state.extensionsUsed },
      scoreAfter: { ...state.score, [winner]: newScore },
      matchWon: settings.raceToGames > 0 && newScore >= settings.raceToGames,
    });
    endGame(winner);
    setPickingWinner(false);
  };

  const handleRequestEndMatch = () => {
    setShowMatchSummary(false);
    setConfirmingEndMatch(true);
  };
  const handleCancelEndMatch = () => {
    setConfirmingEndMatch(false);
    setShowMatchSummary(true);
  };
  const handleConfirmEndMatch = () => {
    setConfirmingEndMatch(false);
    onEndMatch();
  };

  const nameFor = (player: PlayerId) => (player === 1 ? settings.player1Name : settings.player2Name);
  const matchWinner: PlayerId | null =
    state.score[1] === state.score[2] ? null : state.score[1] > state.score[2] ? 1 : 2;

  const shotStats = useMemo(() => computeShotStats(state.shotLog), [state.shotLog]);
  const summaryRows = useMemo(
    () => [
      {
        label: 'Liczba uderzeń',
        p1: String(shotStats[1].count),
        p2: String(shotStats[2].count),
      },
      {
        label: 'Łączny czas gry',
        p1: formatMinutesSeconds(shotStats[1].totalMs),
        p2: formatMinutesSeconds(shotStats[2].totalMs),
      },
      {
        label: 'Średni czas uderzenia',
        p1: shotStats[1].count > 0 ? formatSecondsDecimal(shotStats[1].totalMs / shotStats[1].count) : '—',
        p2: shotStats[2].count > 0 ? formatSecondsDecimal(shotStats[2].totalMs / shotStats[2].count) : '—',
      },
      {
        label: 'Najszybsze uderzenie',
        p1: shotStats[1].fastestMs !== null ? formatSecondsDecimal(shotStats[1].fastestMs) : '—',
        p2: shotStats[2].fastestMs !== null ? formatSecondsDecimal(shotStats[2].fastestMs) : '—',
      },
      {
        label: 'Najdłuższe uderzenie',
        p1: shotStats[1].longestMs !== null ? formatSecondsDecimal(shotStats[1].longestMs) : '—',
        p2: shotStats[2].longestMs !== null ? formatSecondsDecimal(shotStats[2].longestMs) : '—',
      },
      {
        label: 'Przedłużenia łącznie',
        p1: String(state.totalExtensionsUsed[1]),
        p2: String(state.totalExtensionsUsed[2]),
      },
      {
        label: 'Przekroczenia czasu',
        p1: String(state.totalFouls[1]),
        p2: String(state.totalFouls[2]),
      },
    ],
    [shotStats, state.totalExtensionsUsed, state.totalFouls]
  );

  const headerBlock = (
    <View style={styles.header}>
      <Text style={styles.gameLabel}>Partia {state.gameNumber}</Text>
      <Pressable style={styles.endButton} onPress={() => setShowMatchSummary(true)}>
        <Ionicons name="power" size={12} color={colors.warningText} />
        <Text style={styles.endButtonText}>Zakończ mecz</Text>
      </Pressable>
    </View>
  );

  const scoreBlock = (
    <Fragment>
      <Text style={styles.scoreRow} numberOfLines={1}>
        {settings.player1Name}{' '}
        <Text style={{ color: colors.player1 }}>{state.score[1]}</Text> :{' '}
        <Text style={{ color: colors.player2 }}>{state.score[2]}</Text> {settings.player2Name}
      </Text>
      {settings.raceToGames > 0 && (
        <Text style={styles.raceHint}>Grane do {settings.raceToGames} wygranych</Text>
      )}

      <View style={styles.elapsedRow}>
        <Text style={styles.elapsedTime}>Czas partii: {formatMinutesSeconds(state.gameElapsedMs)}</Text>
        <Text style={styles.elapsedTime}>Czas meczu: {formatMinutesSeconds(state.matchElapsedMs)}</Text>
      </View>

      {(state.totalGameRemainingMs !== null || state.totalRemainingMs !== null) && (
        <View style={styles.totalRow}>
          {state.totalGameRemainingMs !== null && (
            <Text style={[styles.totalTime, state.isGameTimeExpired && styles.totalTimeExpired]}>
              Pozostały czas partii: {formatMinutesSeconds(state.totalGameRemainingMs)}
            </Text>
          )}
          {state.totalRemainingMs !== null && (
            <Text style={[styles.totalTime, state.isMatchTimeExpired && styles.totalTimeExpired]}>
              Pozostały czas meczu: {formatMinutesSeconds(state.totalRemainingMs)}
            </Text>
          )}
        </View>
      )}
    </Fragment>
  );

  const clockBlock = (
    <View style={styles.clockWrap}>
      <Text style={[styles.clock, { color: clockColor, fontSize: clockFontSize }]}>
        {formatShotSeconds(state.shotRemainingMs)}
      </Text>
      {state.isExpired && <Text style={styles.expiredLabel}>CZAS! Faul</Text>}
    </View>
  );

  const player1Panel = (
    <PlayerPanel
      name={settings.player1Name}
      accentColor={colors.player1}
      isActive={state.currentPlayer === 1}
      extensionsUsed={state.extensionsUsed[1]}
      extensionsPerGame={settings.extensionsPerGame}
      canUseExtension={
        state.currentPlayer === 1 &&
        !state.isExpired &&
        state.extensionsUsed[1] < settings.extensionsPerGame
      }
      onUseExtension={useExtension}
      onPressPlayer={() => (state.currentPlayer === 1 ? newShot() : switchPlayer())}
    />
  );

  const player2Panel = (
    <PlayerPanel
      name={settings.player2Name}
      accentColor={colors.player2}
      isActive={state.currentPlayer === 2}
      extensionsUsed={state.extensionsUsed[2]}
      extensionsPerGame={settings.extensionsPerGame}
      canUseExtension={
        state.currentPlayer === 2 &&
        !state.isExpired &&
        state.extensionsUsed[2] < settings.extensionsPerGame
      }
      onUseExtension={useExtension}
      onPressPlayer={() => (state.currentPlayer === 2 ? newShot() : switchPlayer())}
    />
  );

  const newShotButton = (
    <Pressable style={[styles.secondaryButton, styles.secondaryButtonHighlighted]} onPress={newShot}>
      <Ionicons name="refresh" size={18} color={colors.accent} />
      <Text style={[styles.secondaryButtonText, styles.secondaryButtonTextHighlighted]}>
        Nowe uderzenie
      </Text>
    </Pressable>
  );

  const switchPlayerButton = (
    <Pressable style={[styles.secondaryButton, styles.secondaryButtonHighlighted]} onPress={switchPlayer}>
      <Ionicons name="swap-horizontal" size={18} color={colors.accent} />
      <Text style={[styles.secondaryButtonText, styles.secondaryButtonTextHighlighted]}>
        Zmiana zawodnika
      </Text>
    </Pressable>
  );

  const timeExpired = state.isExpired || state.isMatchTimeExpired || state.isGameTimeExpired;
  const startPauseButton = (
    <Pressable
      style={[styles.primaryButton, timeExpired && styles.primaryButtonDisabled]}
      onPress={toggleRunning}
      disabled={timeExpired}
    >
      <Ionicons
        name={state.isRunning ? 'pause' : 'play'}
        size={18}
        color={timeExpired ? colors.disabledText : colors.accentText}
      />
      <Text style={styles.primaryButtonText}>{state.isRunning ? 'Pauza' : 'Start'}</Text>
    </Pressable>
  );

  const endGameButtonEl = (
    <Pressable style={styles.endGameButton} onPress={() => setPickingWinner(true)}>
      <Ionicons name="flag" size={16} color={colors.text} />
      <Text style={styles.endGameButtonText}>Zakończ partię</Text>
    </Pressable>
  );

  return (
    <View style={styles.outer}>
      {isLandscape ? (
        <View style={styles.landscapeContainer}>
          {headerBlock}
          <View style={styles.landscapeMiddle}>
            <View style={styles.landscapeSide}>{player1Panel}</View>
            <View style={styles.landscapeCenter}>
              {scoreBlock}
              {clockBlock}
            </View>
            <View style={styles.landscapeSide}>{player2Panel}</View>
          </View>
          <View style={styles.landscapeButtonsRow}>
            {newShotButton}
            {switchPlayerButton}
            {startPauseButton}
            {endGameButtonEl}
          </View>
        </View>
      ) : (
        <View style={styles.container}>
          {headerBlock}
          {scoreBlock}
          {clockBlock}

          <View style={styles.playersRow}>
            {player1Panel}
            <View style={styles.playersGap} />
            {player2Panel}
          </View>

          <View style={styles.secondaryRow}>
            {newShotButton}
            {switchPlayerButton}
          </View>

          <View style={styles.primaryRow}>
            {startPauseButton}
            {endGameButtonEl}
          </View>
        </View>
      )}

      <AppModal visible={pickingWinner}>
        <Text style={styles.modalTitle}>Kto wygrał partię {state.gameNumber}?</Text>
        <Pressable
          style={[styles.winnerButton, { backgroundColor: colors.player1 }]}
          onPress={() => handlePickWinner(1)}
        >
          <Text style={styles.winnerButtonText}>{settings.player1Name}</Text>
        </Pressable>
        <Pressable
          style={[styles.winnerButton, { backgroundColor: colors.player2 }]}
          onPress={() => handlePickWinner(2)}
        >
          <Text style={styles.winnerButtonText}>{settings.player2Name}</Text>
        </Pressable>
        <Pressable style={styles.modalCancel} onPress={() => setPickingWinner(false)}>
          <Text style={styles.modalCancelText}>Anuluj</Text>
        </Pressable>
      </AppModal>

      <AppModal visible={gameSummary !== null}>
        {gameSummary && (
          <>
            <Text style={styles.modalTitle}>
              {gameSummary.matchWon
                ? `${nameFor(gameSummary.winner)} wygrywa mecz!`
                : `${nameFor(gameSummary.winner)} wygrywa partię ${gameSummary.gameNumber}!`}
            </Text>
            <Text style={styles.modalScore}>
              {settings.player1Name} {gameSummary.scoreAfter[1]} : {gameSummary.scoreAfter[2]}{' '}
              {settings.player2Name}
            </Text>
            <View style={styles.statsBlock}>
              <Text style={styles.statsRow}>
                Przedłużenia w tej partii: {settings.player1Name} {gameSummary.extensionsUsed[1]} ·{' '}
                {settings.player2Name} {gameSummary.extensionsUsed[2]}
              </Text>
            </View>
            <Pressable
              style={styles.winnerButton}
              onPress={() => {
                setGameSummary(null);
                if (gameSummary.matchWon) setShowMatchSummary(true);
              }}
            >
              <Text style={styles.winnerButtonText}>
                {gameSummary.matchWon ? 'Zobacz podsumowanie meczu' : 'Kontynuuj'}
              </Text>
            </Pressable>
          </>
        )}
      </AppModal>

      <AppModal visible={showMatchSummary}>
        <Text style={styles.modalTitle}>Podsumowanie meczu</Text>
        <Text style={styles.modalScore}>
          {settings.player1Name} {state.score[1]} : {state.score[2]} {settings.player2Name}
        </Text>
        <Text style={styles.modalSubtitle}>
          {matchWinner ? `Wygrywa ${nameFor(matchWinner)}` : 'Remis'}
        </Text>
        <View style={styles.statsBlock}>
          <Text style={styles.statsRow}>Czas trwania meczu: {formatMinutesSeconds(state.matchElapsedMs)}</Text>
          <Text style={styles.statsRow}>Rozegrane partie: {state.gamesLog.length}</Text>
          <StatsTable
            player1Name={settings.player1Name}
            player2Name={settings.player2Name}
            player1Color={colors.player1}
            player2Color={colors.player2}
            rows={summaryRows}
          />
          {state.gamesLog.length > 0 && (
            <View style={styles.gamesLogWrap}>
              {state.gamesLog.map((g) => (
                <Text key={g.gameNumber} style={styles.gamesLogRow}>
                  Partia {g.gameNumber}: {nameFor(g.winner)}
                </Text>
              ))}
            </View>
          )}
        </View>
        <Pressable style={[styles.winnerButton, styles.endMatchButton]} onPress={handleRequestEndMatch}>
          <Ionicons name="power" size={16} color={colors.warningText} />
          <Text style={[styles.winnerButtonText, styles.endMatchButtonText]}>Zakończ mecz</Text>
        </Pressable>
        <Pressable style={styles.modalCancel} onPress={() => setShowMatchSummary(false)}>
          <Text style={styles.modalCancelText}>Wróć do meczu</Text>
        </Pressable>
      </AppModal>

      <AppModal visible={confirmingEndMatch}>
        <Ionicons
          name="power"
          size={28}
          color={colors.warning}
          style={{ alignSelf: 'center', marginBottom: 12 }}
        />
        <Text style={styles.modalTitle}>Zakończyć mecz?</Text>
        <Text style={styles.modalSubtitle}>
          Wynik zostanie zapisany w podsumowaniu. Tej operacji nie można cofnąć.
        </Text>
        <Pressable
          style={[styles.winnerButton, styles.endMatchButton, { marginTop: 16 }]}
          onPress={handleConfirmEndMatch}
        >
          <Ionicons name="power" size={16} color={colors.warningText} />
          <Text style={[styles.winnerButtonText, styles.endMatchButtonText]}>Tak, zakończ mecz</Text>
        </Pressable>
        <Pressable style={styles.modalCancel} onPress={handleCancelEndMatch}>
          <Text style={styles.modalCancelText}>Anuluj</Text>
        </Pressable>
      </AppModal>
    </View>
  );
}

interface PlayerShotStats {
  count: number;
  totalMs: number;
  fastestMs: number | null;
  longestMs: number | null;
}

function computeShotStats(shotLog: ShotRecord[]): Record<PlayerId, PlayerShotStats> {
  const stats: Record<PlayerId, PlayerShotStats> = {
    1: { count: 0, totalMs: 0, fastestMs: null, longestMs: null },
    2: { count: 0, totalMs: 0, fastestMs: null, longestMs: null },
  };
  for (const shot of shotLog) {
    const s = stats[shot.player];
    s.count += 1;
    s.totalMs += shot.durationMs;
    s.fastestMs = s.fastestMs === null ? shot.durationMs : Math.min(s.fastestMs, shot.durationMs);
    s.longestMs = s.longestMs === null ? shot.durationMs : Math.max(s.longestMs, shot.durationMs);
  }
  return stats;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    outer: {
      flex: 1,
      backgroundColor: colors.background,
      alignItems: 'center',
    },
    container: {
      flex: 1,
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      padding: 20,
      paddingTop: 60,
    },
    landscapeContainer: {
      flex: 1,
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH_LANDSCAPE,
      paddingHorizontal: 28,
      paddingTop: 16,
      paddingBottom: 16,
    },
    landscapeMiddle: {
      flex: 1,
      flexDirection: 'row',
      gap: 16,
    },
    landscapeSide: {
      flex: 1,
      alignSelf: 'center',
      justifyContent: 'center',
    },
    landscapeCenter: {
      flex: 1.3,
      alignItems: 'center',
      justifyContent: 'center',
    },
    landscapeButtonsRow: {
      flexDirection: 'row',
      marginHorizontal: -4,
      marginTop: 8,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    gameLabel: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
    },
    endButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.warning,
      paddingVertical: 6,
      paddingHorizontal: 14,
      borderRadius: 999,
    },
    endButtonText: {
      color: colors.warningText,
      fontSize: 13,
      fontWeight: '700',
    },
    scoreRow: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginTop: 12,
    },
    raceHint: {
      color: colors.textSecondary,
      fontSize: 12,
      textAlign: 'center',
      marginTop: 2,
    },
    elapsedRow: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 16,
      marginTop: 6,
    },
    elapsedTime: {
      color: colors.textSecondary,
      fontSize: 12,
    },
    totalRow: {
      alignItems: 'center',
      marginTop: 8,
    },
    totalTime: {
      color: colors.textSecondary,
      fontSize: 14,
    },
    totalTimeExpired: {
      color: colors.danger,
      fontWeight: '700',
    },
    clockWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    clock: {
      fontWeight: '800',
      fontVariant: ['tabular-nums'],
    },
    expiredLabel: {
      color: colors.danger,
      fontSize: 20,
      fontWeight: '700',
      marginTop: -10,
    },
    playersRow: {
      flexDirection: 'row',
      marginBottom: 20,
    },
    playersGap: {
      width: 12,
    },
    primaryRow: {
      flexDirection: 'row',
      marginHorizontal: -4,
    },
    primaryButton: {
      flex: 1,
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
    },
    primaryButtonDisabled: {
      backgroundColor: colors.disabledSurface,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontSize: 20,
      fontWeight: '700',
    },
    endGameButton: {
      flex: 1,
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
    },
    endGameButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryRow: {
      flexDirection: 'row',
      marginTop: 12,
      marginBottom: 24,
    },
    secondaryButton: {
      flex: 1,
      flexDirection: 'row',
      gap: 8,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      justifyContent: 'center',
      marginHorizontal: 4,
      borderWidth: 2,
      borderColor: 'transparent',
    },
    secondaryButtonHighlighted: {
      borderColor: colors.accent,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryButtonTextHighlighted: {
      color: colors.accent,
      fontWeight: '700',
    },
    modalTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 16,
    },
    modalSubtitle: {
      color: colors.textSecondary,
      fontSize: 15,
      fontWeight: '600',
      textAlign: 'center',
      marginTop: 4,
    },
    modalScore: {
      color: colors.accent,
      fontSize: 22,
      fontWeight: '800',
      textAlign: 'center',
    },
    statsBlock: {
      marginTop: 16,
      marginBottom: 16,
    },
    statsRow: {
      color: colors.textSecondary,
      fontSize: 14,
      marginBottom: 6,
      textAlign: 'center',
    },
    gamesLogWrap: {
      marginTop: 8,
    },
    gamesLogRow: {
      color: colors.textSecondary,
      fontSize: 13,
      textAlign: 'center',
    },
    winnerButton: {
      backgroundColor: colors.accent,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginTop: 8,
    },
    winnerButtonText: {
      color: colors.accentText,
      fontSize: 16,
      fontWeight: '700',
    },
    endMatchButton: {
      flexDirection: 'row',
      gap: 8,
      justifyContent: 'center',
      backgroundColor: colors.warning,
    },
    endMatchButtonText: {
      color: colors.warningText,
    },
    modalCancel: {
      alignItems: 'center',
      paddingVertical: 12,
      marginTop: 4,
    },
    modalCancelText: {
      color: colors.textSecondary,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}

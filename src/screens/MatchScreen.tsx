import { useKeepAwake } from 'expo-keep-awake';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { AppModal } from '../components/AppModal';
import { PlayerPanel } from '../components/PlayerPanel';
import { PlayerId, useMatchTimer } from '../hooks/useMatchTimer';
import { useShotClockSounds } from '../sound/useShotClockSounds';
import { ThemeColors } from '../theme/colors';
import { MAX_CONTENT_WIDTH } from '../theme/layout';
import { useTheme } from '../theme/ThemeContext';
import { Settings } from '../types/settings';
import { formatMinutesSeconds, formatShotSeconds } from '../utils/format';

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
  const { width } = useWindowDimensions();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { playWarning, playBuzzer, playTick } = useShotClockSounds();
  const { state, toggleRunning, newShot, switchPlayer, useExtension, endGame } = useMatchTimer(
    settings,
    { onWarning: playWarning, onTick: playTick, onBuzzer: playBuzzer }
  );

  const [pickingWinner, setPickingWinner] = useState(false);
  const [gameSummary, setGameSummary] = useState<GameSummary | null>(null);
  const [showMatchSummary, setShowMatchSummary] = useState(false);

  const isLow = state.shotRemainingMs <= WARNING_THRESHOLD_MS;
  const currentPlayerColor = state.currentPlayer === 1 ? colors.player1 : colors.player2;
  const clockColor = state.isExpired ? colors.danger : isLow ? colors.warning : currentPlayerColor;
  const contentWidth = Math.min(width, MAX_CONTENT_WIDTH) - 40;
  const clockFontSize = Math.max(100, Math.min(200, contentWidth * 0.38));

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

  const nameFor = (player: PlayerId) => (player === 1 ? settings.player1Name : settings.player2Name);
  const matchWinner: PlayerId | null =
    state.score[1] === state.score[2] ? null : state.score[1] > state.score[2] ? 1 : 2;

  return (
    <View style={styles.outer}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.gameLabel}>Partia {state.gameNumber}</Text>
          <Pressable onPress={() => setShowMatchSummary(true)} hitSlop={10}>
            <Text style={styles.endLink}>Zakończ mecz</Text>
          </Pressable>
        </View>

        <Text style={styles.scoreRow} numberOfLines={1}>
          {settings.player1Name}{' '}
          <Text style={{ color: colors.player1 }}>{state.score[1]}</Text> :{' '}
          <Text style={{ color: colors.player2 }}>{state.score[2]}</Text> {settings.player2Name}
        </Text>
        {settings.raceToGames > 0 && (
          <Text style={styles.raceHint}>Grane do {settings.raceToGames} wygranych</Text>
        )}

        {state.totalRemainingMs !== null && (
          <View style={styles.totalRow}>
            <Text style={[styles.totalTime, state.isMatchTimeExpired && styles.totalTimeExpired]}>
              Czas meczu: {formatMinutesSeconds(state.totalRemainingMs)}
            </Text>
          </View>
        )}

        <View style={styles.clockWrap}>
          <Text style={[styles.clock, { color: clockColor, fontSize: clockFontSize }]}>
            {formatShotSeconds(state.shotRemainingMs)}
          </Text>
          {state.isExpired && <Text style={styles.expiredLabel}>CZAS! Faul</Text>}
        </View>

        <View style={styles.playersRow}>
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
          />
          <View style={styles.playersGap} />
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
          />
        </View>

        <View style={styles.primaryRow}>
          <Pressable
            style={[styles.primaryButton, state.isExpired && styles.primaryButtonDisabled]}
            onPress={toggleRunning}
            disabled={state.isExpired || state.isMatchTimeExpired}
          >
            <Text style={styles.primaryButtonText}>{state.isRunning ? 'Pauza' : 'Start'}</Text>
          </Pressable>
          <Pressable style={styles.shotButton} onPress={newShot}>
            <Text style={styles.shotButtonText}>Nowe uderzenie</Text>
          </Pressable>
        </View>

        <View style={styles.secondaryRow}>
          <Pressable style={styles.secondaryButton} onPress={switchPlayer}>
            <Text style={styles.secondaryButtonText}>Zmiana zawodnika</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => setPickingWinner(true)}>
            <Text style={styles.secondaryButtonText}>Zakończ partię</Text>
          </Pressable>
        </View>
      </View>

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
          <Text style={styles.statsRow}>
            Przedłużenia łącznie: {settings.player1Name} {state.totalExtensionsUsed[1]} ·{' '}
            {settings.player2Name} {state.totalExtensionsUsed[2]}
          </Text>
          <Text style={styles.statsRow}>
            Przekroczenia czasu: {settings.player1Name} {state.totalFouls[1]} · {settings.player2Name}{' '}
            {state.totalFouls[2]}
          </Text>
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
        <Pressable style={styles.winnerButton} onPress={onEndMatch}>
          <Text style={styles.winnerButtonText}>Powrót do ustawień</Text>
        </Pressable>
        <Pressable style={styles.modalCancel} onPress={() => setShowMatchSummary(false)}>
          <Text style={styles.modalCancelText}>Wróć do meczu</Text>
        </Pressable>
      </AppModal>
    </View>
  );
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
    endLink: {
      color: colors.warning,
      fontSize: 14,
      fontWeight: '600',
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
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
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
    shotButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginHorizontal: 4,
      borderWidth: 2,
      borderColor: colors.accent,
    },
    shotButtonText: {
      color: colors.accent,
      fontSize: 16,
      fontWeight: '700',
    },
    secondaryRow: {
      flexDirection: 'row',
      marginTop: 12,
      marginBottom: 12,
    },
    secondaryButton: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 14,
      paddingVertical: 14,
      alignItems: 'center',
      marginHorizontal: 4,
    },
    secondaryButtonText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
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

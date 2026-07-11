import { useKeepAwake } from 'expo-keep-awake';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { PlayerPanel } from '../components/PlayerPanel';
import { useMatchTimer } from '../hooks/useMatchTimer';
import { useShotClockSounds } from '../sound/useShotClockSounds';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { Settings } from '../types/settings';
import { formatMinutesSeconds, formatShotSeconds } from '../utils/format';

interface Props {
  settings: Settings;
  onEndMatch: () => void;
}

const WARNING_THRESHOLD_MS = 10_000;

export function MatchScreen({ settings, onEndMatch }: Props) {
  useKeepAwake();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { playWarning, playBuzzer } = useShotClockSounds();
  const { state, toggleRunning, switchPlayer, useExtension, newGame } = useMatchTimer(settings, {
    onWarning: playWarning,
    onBuzzer: playBuzzer,
  });

  const isLow = state.shotRemainingMs <= WARNING_THRESHOLD_MS;
  const clockColor = state.isExpired ? colors.danger : isLow ? colors.warning : colors.accent;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.gameLabel}>Partia {state.gameNumber}</Text>
        <Pressable onPress={onEndMatch} hitSlop={10}>
          <Text style={styles.endLink}>Zakończ mecz</Text>
        </Pressable>
      </View>

      {state.totalRemainingMs !== null && (
        <View style={styles.totalRow}>
          <Text style={[styles.totalTime, state.isMatchTimeExpired && styles.totalTimeExpired]}>
            Czas meczu: {formatMinutesSeconds(state.totalRemainingMs)}
          </Text>
        </View>
      )}

      <View style={styles.clockWrap}>
        <Text style={[styles.clock, { color: clockColor }]}>
          {formatShotSeconds(state.shotRemainingMs)}
        </Text>
        {state.isExpired && <Text style={styles.expiredLabel}>CZAS! Faul</Text>}
      </View>

      <View style={styles.playersRow}>
        <PlayerPanel
          name={settings.player1Name}
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

      <Pressable
        style={[styles.primaryButton, state.isExpired && styles.primaryButtonDisabled]}
        onPress={toggleRunning}
        disabled={state.isExpired || state.isMatchTimeExpired}
      >
        <Text style={styles.primaryButtonText}>{state.isRunning ? 'Pauza' : 'Start'}</Text>
      </Pressable>

      <View style={styles.secondaryRow}>
        <Pressable style={styles.secondaryButton} onPress={switchPlayer}>
          <Text style={styles.secondaryButtonText}>Zmiana zawodnika</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={newGame}>
          <Text style={styles.secondaryButtonText}>Nowa partia</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
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
      fontSize: 140,
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
    primaryButton: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
    },
    primaryButtonDisabled: {
      backgroundColor: colors.disabledSurface,
    },
    primaryButtonText: {
      color: colors.accentText,
      fontSize: 20,
      fontWeight: '700',
    },
    secondaryRow: {
      flexDirection: 'row',
      marginTop: 12,
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
  });
}

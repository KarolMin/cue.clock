import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { NumberStepper } from '../components/NumberStepper';
import { PlayerNameField } from '../components/PlayerNameField';
import { loadRecentNames, rememberName } from '../storage/recentNamesStorage';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
import { MAX_CONTENT_WIDTH } from '../theme/layout';
import { LIMITS, Settings } from '../types/settings';

interface Props {
  settings: Settings;
  onChange: (settings: Settings) => void;
  onStart: () => void;
}

export function SettingsScreen({ settings, onChange, onStart }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [player1Name, setPlayer1Name] = useState(settings.player1Name);
  const [player2Name, setPlayer2Name] = useState(settings.player2Name);
  const [recentNames, setRecentNames] = useState<string[]>([]);

  useEffect(() => {
    loadRecentNames().then(setRecentNames);
  }, []);

  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  const commitNames = async () => {
    const p1 = player1Name.trim() || 'Gracz 1';
    const p2 = player2Name.trim() || 'Gracz 2';
    update({ player1Name: p1, player2Name: p2 });
    await rememberName(p1);
    setRecentNames(await rememberName(p2));
  };

  const pickName = (which: 1 | 2, name: string) => {
    if (which === 1) {
      setPlayer1Name(name);
      update({ player1Name: name });
    } else {
      setPlayer2Name(name);
      update({ player2Name: name });
    }
    rememberName(name).then(setRecentNames);
  };

  const suggestionsFor = (currentValue: string, otherValue: string) =>
    recentNames.filter((n) => n !== currentValue && n !== otherValue);

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>cue.clock</Text>
          <Text style={styles.subtitle}>Zegar 4 fun.</Text>
          <Pressable
            style={styles.tutorialLink}
            onPress={() => Linking.openURL('https://cueclock.online/tutorial.mp4')}
          >
            <Ionicons name="play-circle" size={16} color={colors.accent} />
            <Text style={styles.tutorialLinkText}>Zobacz samouczek (wideo)</Text>
          </Pressable>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zawodnicy</Text>
            <PlayerNameField
              value={player1Name}
              onChangeText={setPlayer1Name}
              onCommit={commitNames}
              placeholder="Gracz 1"
              suggestions={suggestionsFor(player1Name, player2Name)}
              onPickSuggestion={(name) => pickName(1, name)}
            />
            <PlayerNameField
              value={player2Name}
              onChangeText={setPlayer2Name}
              onCommit={commitNames}
              placeholder="Gracz 2"
              suggestions={suggestionsFor(player2Name, player1Name)}
              onPickSuggestion={(name) => pickName(2, name)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Zegar uderzenia</Text>
            <NumberStepper
              label="Czas na uderzenie"
              value={settings.shotSeconds}
              onChange={(v) => update({ shotSeconds: v })}
              min={LIMITS.shotSeconds.min}
              max={LIMITS.shotSeconds.max}
              step={5}
              unit="s"
            />
            <NumberStepper
              label="Czas przedłużenia"
              value={settings.extensionSeconds}
              onChange={(v) => update({ extensionSeconds: v })}
              min={LIMITS.extensionSeconds.min}
              max={LIMITS.extensionSeconds.max}
              step={5}
              unit="s"
            />
            <NumberStepper
              label="Przedłużeń na partię (gracz)"
              value={settings.extensionsPerGame}
              onChange={(v) => update({ extensionsPerGame: v })}
              min={LIMITS.extensionsPerGame.min}
              max={LIMITS.extensionsPerGame.max}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Format meczu</Text>
            <NumberStepper
              label="Mecz do X wygranych partii"
              value={settings.raceToGames}
              onChange={(v) => update({ raceToGames: v })}
              min={LIMITS.raceToGames.min}
              max={LIMITS.raceToGames.max}
            />
            <Text style={styles.helperText}>
              {settings.raceToGames === 0
                ? 'Bez limitu — mecz kończysz ręcznie w dowolnym momencie.'
                : `Po ${settings.raceToGames} wygranych partiach zobaczysz podsumowanie meczu.`}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>Łączny czas meczu</Text>
              <Switch
                value={settings.totalMatchEnabled}
                onValueChange={(v) => update({ totalMatchEnabled: v })}
                trackColor={{ false: colors.disabledSurface, true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>
            {settings.totalMatchEnabled && (
              <NumberStepper
                label="Czas meczu"
                value={settings.totalMatchMinutes}
                onChange={(v) => update({ totalMatchMinutes: v })}
                min={LIMITS.totalMatchMinutes.min}
                max={LIMITS.totalMatchMinutes.max}
                step={5}
                unit="min"
              />
            )}
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>Maksymalny czas partii</Text>
              <Switch
                value={settings.totalGameEnabled}
                onValueChange={(v) => update({ totalGameEnabled: v })}
                trackColor={{ false: colors.disabledSurface, true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>
            {settings.totalGameEnabled && (
              <NumberStepper
                label="Czas partii"
                value={settings.totalGameMinutes}
                onChange={(v) => update({ totalGameMinutes: v })}
                min={LIMITS.totalGameMinutes.min}
                max={LIMITS.totalGameMinutes.max}
                step={1}
                unit="min"
              />
            )}
          </View>

          <Pressable style={styles.startButton} onPress={onStart}>
            <Text style={styles.startButtonText}>Rozpocznij mecz</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    scrollContent: {
      backgroundColor: colors.background,
      flexGrow: 1,
      alignItems: 'center',
    },
    content: {
      width: '100%',
      maxWidth: MAX_CONTENT_WIDTH,
      padding: 20,
      paddingTop: 60,
      paddingBottom: 40,
    },
    title: {
      color: colors.text,
      fontSize: 32,
      fontWeight: '700',
      textAlign: 'center',
    },
    subtitle: {
      color: colors.textSecondary,
      fontSize: 14,
      textAlign: 'center',
      marginBottom: 12,
    },
    tutorialLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      marginBottom: 28,
    },
    tutorialLinkText: {
      color: colors.accent,
      fontSize: 14,
      fontWeight: '700',
    },
    section: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 16,
      marginBottom: 16,
    },
    sectionTitle: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '700',
      marginBottom: 4,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
    startButton: {
      backgroundColor: colors.accent,
      borderRadius: 16,
      paddingVertical: 18,
      alignItems: 'center',
      marginTop: 8,
    },
    startButtonText: {
      color: colors.accentText,
      fontSize: 18,
      fontWeight: '700',
    },
  });
}

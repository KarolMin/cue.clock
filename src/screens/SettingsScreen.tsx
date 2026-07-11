import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NumberStepper } from '../components/NumberStepper';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';
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

  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  const commitNames = () => {
    update({
      player1Name: player1Name.trim() || 'Gracz 1',
      player2Name: player2Name.trim() || 'Gracz 2',
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>cue.clock</Text>
        <Text style={styles.subtitle}>Zegar strzałowy do bilarda</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Zawodnicy</Text>
          <TextInput
            style={styles.input}
            value={player1Name}
            onChangeText={setPlayer1Name}
            onEndEditing={commitNames}
            onBlur={commitNames}
            placeholder="Gracz 1"
            placeholderTextColor={colors.placeholder}
          />
          <TextInput
            style={styles.input}
            value={player2Name}
            onChangeText={setPlayer2Name}
            onEndEditing={commitNames}
            onBlur={commitNames}
            placeholder="Gracz 2"
            placeholderTextColor={colors.placeholder}
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

        <Pressable style={styles.startButton} onPress={onStart}>
          <Text style={styles.startButtonText}>Rozpocznij mecz</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    flex: { flex: 1 },
    content: {
      padding: 20,
      paddingTop: 60,
      paddingBottom: 40,
      backgroundColor: colors.background,
      flexGrow: 1,
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
      marginBottom: 28,
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
    input: {
      backgroundColor: colors.inputBackground,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 10,
      fontSize: 15,
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

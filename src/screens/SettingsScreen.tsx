import { Ionicons } from '@expo/vector-icons';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
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
import { AppModal } from '../components/AppModal';
import { NumberStepper } from '../components/NumberStepper';
import { PlayerNameField } from '../components/PlayerNameField';
import { useTranslation } from '../i18n/LanguageContext';
import { LANGUAGE_LABELS, SUPPORTED_LANGUAGES } from '../i18n/languages';
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
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [player1Name, setPlayer1Name] = useState(settings.player1Name);
  const [player2Name, setPlayer2Name] = useState(settings.player2Name);
  const [recentNames, setRecentNames] = useState<string[]>([]);
  const [languagePickerOpen, setLanguagePickerOpen] = useState(false);

  useEffect(() => {
    loadRecentNames().then(setRecentNames);
  }, []);

  const update = (patch: Partial<Settings>) => onChange({ ...settings, ...patch });

  const defaultNames = [t('settingsPlayer1Placeholder'), t('settingsPlayer2Placeholder')];

  const commitNames = async () => {
    const p1 = player1Name.trim() || t('settingsPlayer1Placeholder');
    const p2 = player2Name.trim() || t('settingsPlayer2Placeholder');
    update({ player1Name: p1, player2Name: p2 });
    await rememberName(p1, defaultNames);
    setRecentNames(await rememberName(p2, defaultNames));
  };

  const pickName = (which: 1 | 2, name: string) => {
    if (which === 1) {
      setPlayer1Name(name);
      update({ player1Name: name });
    } else {
      setPlayer2Name(name);
      update({ player2Name: name });
    }
    rememberName(name, defaultNames).then(setRecentNames);
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
          <View style={styles.titleRow}>
            <Image source={require('../../assets/app-logo.png')} style={styles.titleLogo} />
            <Text style={styles.title}>cue.clock</Text>
          </View>
          <Text style={styles.subtitle}>{t('settingsSubtitle')}</Text>
          <Pressable
            style={styles.tutorialLink}
            onPress={() => Linking.openURL('https://cueclock.online/tutorial.mp4')}
          >
            <Ionicons name="play-circle" size={16} color={colors.accent} />
            <Text style={styles.tutorialLinkText}>{t('settingsTutorialLink')}</Text>
          </Pressable>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settingsPlayersSectionTitle')}</Text>
            <Text style={styles.sectionHint}>{t('settingsPlayersHint')}</Text>
            <PlayerNameField
              value={player1Name}
              onChangeText={setPlayer1Name}
              onCommit={commitNames}
              placeholder={t('settingsPlayer1Placeholder')}
              suggestions={suggestionsFor(player1Name, player2Name)}
              onPickSuggestion={(name) => pickName(1, name)}
            />
            <PlayerNameField
              value={player2Name}
              onChangeText={setPlayer2Name}
              onCommit={commitNames}
              placeholder={t('settingsPlayer2Placeholder')}
              suggestions={suggestionsFor(player2Name, player1Name)}
              onPickSuggestion={(name) => pickName(2, name)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settingsShotClockSectionTitle')}</Text>
            <NumberStepper
              label={t('settingsShotSecondsLabel')}
              value={settings.shotSeconds}
              onChange={(v) => update({ shotSeconds: v })}
              min={LIMITS.shotSeconds.min}
              max={LIMITS.shotSeconds.max}
              step={5}
              unit="s"
            />
            <NumberStepper
              label={t('settingsExtensionSecondsLabel')}
              value={settings.extensionSeconds}
              onChange={(v) => update({ extensionSeconds: v })}
              min={LIMITS.extensionSeconds.min}
              max={LIMITS.extensionSeconds.max}
              step={5}
              unit="s"
            />
            <NumberStepper
              label={t('settingsExtensionsPerGameLabel')}
              value={settings.extensionsPerGame}
              onChange={(v) => update({ extensionsPerGame: v })}
              min={LIMITS.extensionsPerGame.min}
              max={LIMITS.extensionsPerGame.max}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settingsMatchFormatSectionTitle')}</Text>
            <NumberStepper
              label={t('settingsRaceToGamesLabel')}
              value={settings.raceToGames}
              onChange={(v) => update({ raceToGames: v })}
              min={LIMITS.raceToGames.min}
              max={LIMITS.raceToGames.max}
            />
            <Text style={styles.helperText}>
              {settings.raceToGames === 0
                ? t('settingsRaceHintUnlimited')
                : t('settingsRaceHintLimited', { n: settings.raceToGames })}
            </Text>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>{t('settingsTotalMatchSectionTitle')}</Text>
              <Switch
                value={settings.totalMatchEnabled}
                onValueChange={(v) => update({ totalMatchEnabled: v })}
                trackColor={{ false: colors.disabledSurface, true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>
            {settings.totalMatchEnabled && (
              <NumberStepper
                label={t('settingsTotalMatchTimeLabel')}
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
              <Text style={styles.sectionTitle}>{t('settingsTotalGameSectionTitle')}</Text>
              <Switch
                value={settings.totalGameEnabled}
                onValueChange={(v) => update({ totalGameEnabled: v })}
                trackColor={{ false: colors.disabledSurface, true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>
            {settings.totalGameEnabled && (
              <NumberStepper
                label={t('settingsTotalGameTimeLabel')}
                value={settings.totalGameMinutes}
                onChange={(v) => update({ totalGameMinutes: v })}
                min={LIMITS.totalGameMinutes.min}
                max={LIMITS.totalGameMinutes.max}
                step={1}
                unit="min"
              />
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('settingsSoundSectionTitle')}</Text>
            <View style={styles.switchRow}>
              <Text style={styles.soundLabel}>{t('settingsShotClockSoundLabel')}</Text>
              <Switch
                value={settings.shotClockSoundEnabled}
                onValueChange={(v) => update({ shotClockSoundEnabled: v })}
                trackColor={{ false: colors.disabledSurface, true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>
            <View style={[styles.switchRow, { marginTop: 12 }]}>
              <Text style={styles.soundLabel}>{t('settingsGameTimeWarningSoundLabel')}</Text>
              <Switch
                value={settings.gameTimeWarningSoundEnabled}
                onValueChange={(v) => update({ gameTimeWarningSoundEnabled: v })}
                trackColor={{ false: colors.disabledSurface, true: colors.accent }}
                thumbColor="#ffffff"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.switchRow}>
              <Text style={styles.sectionTitle}>{t('settingsLanguageSectionTitle')}</Text>
              <Pressable style={styles.languageDropdown} onPress={() => setLanguagePickerOpen(true)}>
                <Text style={styles.languageDropdownText}>{LANGUAGE_LABELS[settings.language]}</Text>
                <Ionicons name="chevron-down" size={14} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          <Pressable style={styles.startButton} onPress={onStart}>
            <Text style={styles.startButtonText}>{t('settingsStartButton')}</Text>
          </Pressable>
        </View>
      </ScrollView>

      <AppModal visible={languagePickerOpen}>
        <Text style={styles.modalTitle}>{t('settingsLanguageSectionTitle')}</Text>
        {SUPPORTED_LANGUAGES.map((code) => {
          const active = settings.language === code;
          return (
            <Pressable
              key={code}
              style={[styles.languageOption, active && styles.languageOptionActive]}
              onPress={() => {
                update({ language: code });
                setLanguagePickerOpen(false);
              }}
            >
              <Text style={[styles.languageOptionText, active && styles.languageOptionTextActive]}>
                {LANGUAGE_LABELS[code]}
              </Text>
              {active && <Ionicons name="checkmark" size={18} color={colors.accent} />}
            </Pressable>
          );
        })}
        <Pressable style={styles.modalCancel} onPress={() => setLanguagePickerOpen(false)}>
          <Text style={styles.modalCancelText}>{t('matchCancel')}</Text>
        </Pressable>
      </AppModal>
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
    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 10,
    },
    titleLogo: {
      width: 40,
      height: 40,
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
    sectionHint: {
      color: colors.textSecondary,
      fontSize: 12,
      marginBottom: 4,
    },
    switchRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    soundLabel: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
      flexShrink: 1,
      marginRight: 12,
    },
    helperText: {
      color: colors.textSecondary,
      fontSize: 12,
      marginTop: 4,
    },
    languageDropdown: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.controlSurface,
      borderRadius: 999,
      paddingHorizontal: 14,
      paddingVertical: 8,
    },
    languageDropdownText: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '600',
    },
    modalTitle: {
      color: colors.text,
      fontSize: 18,
      fontWeight: '700',
      textAlign: 'center',
      marginBottom: 16,
    },
    languageOption: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 14,
      paddingHorizontal: 16,
      borderRadius: 12,
      marginBottom: 6,
    },
    languageOptionActive: {
      backgroundColor: `${colors.accent}22`,
    },
    languageOptionText: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '600',
    },
    languageOptionTextActive: {
      color: colors.accent,
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

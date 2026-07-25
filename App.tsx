import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { LanguageProvider } from './src/i18n/LanguageContext';
import { LanguageCode } from './src/i18n/languages';
import { MatchScreen } from './src/screens/MatchScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { loadSettings, saveSettings } from './src/storage/settingsStorage';
import { ThemeProvider, useTheme } from './src/theme/ThemeContext';
import { DEFAULT_SETTINGS, Settings } from './src/types/settings';

function AppInner() {
  const { colors, scheme } = useTheme();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [screen, setScreen] = useState<'settings' | 'match'>('settings');
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    loadSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };

  const setLanguage = (language: LanguageCode) => updateSettings({ ...settings, language });

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
    <LanguageProvider language={settings.language} onChangeLanguage={setLanguage}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {screen === 'settings' ? (
          <SettingsScreen
            settings={settings}
            onChange={updateSettings}
            onStart={() => setScreen('match')}
          />
        ) : (
          <MatchScreen settings={settings} onEndMatch={() => setScreen('settings')} />
        )}
        <StatusBar style={scheme === 'dark' ? 'light' : 'dark'} />
      </View>
    </LanguageProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppInner />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

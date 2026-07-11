import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
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

  if (!loaded) {
    return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  }

  return (
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

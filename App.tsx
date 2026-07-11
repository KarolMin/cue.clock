import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import { MatchScreen } from './src/screens/MatchScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { loadSettings, saveSettings } from './src/storage/settingsStorage';
import { DEFAULT_SETTINGS, Settings } from './src/types/settings';

export default function App() {
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
    return <View style={styles.container} />;
  }

  return (
    <View style={styles.container}>
      {screen === 'settings' ? (
        <SettingsScreen
          settings={settings}
          onChange={updateSettings}
          onStart={() => setScreen('match')}
        />
      ) : (
        <MatchScreen settings={settings} onEndMatch={() => setScreen('settings')} />
      )}
      <StatusBar style="light" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f1216',
  },
});

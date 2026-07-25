import AsyncStorage from '@react-native-async-storage/async-storage';
import { detectLanguage } from '../i18n/detectLanguage';
import { isSupportedLanguage } from '../i18n/languages';
import { translations } from '../i18n/translations';
import { DEFAULT_SETTINGS, Settings } from '../types/settings';

const STORAGE_KEY = 'cue.clock/settings';

// First run (nothing saved yet): seed the language and default player names
// from the device's own locale instead of the static Polish fallback.
function freshDefaults(): Settings {
  const language = detectLanguage();
  return {
    ...DEFAULT_SETTINGS,
    language,
    player1Name: translations[language].settingsPlayer1Placeholder,
    player2Name: translations[language].settingsPlayer2Placeholder,
  };
}

export async function loadSettings(): Promise<Settings> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return freshDefaults();
    const parsed = JSON.parse(raw);
    const language = isSupportedLanguage(parsed.language) ? parsed.language : detectLanguage();
    return { ...DEFAULT_SETTINGS, ...parsed, language };
  } catch {
    return freshDefaults();
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

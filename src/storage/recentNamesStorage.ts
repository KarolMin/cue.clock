import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'cue.clock/recentPlayerNames';
const MAX_NAMES = 8;

export async function loadRecentNames(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'string') : [];
  } catch {
    return [];
  }
}

export async function rememberName(name: string): Promise<string[]> {
  const trimmed = name.trim();
  const existing = await loadRecentNames();
  if (!trimmed || ['Gracz 1', 'Gracz 2'].includes(trimmed)) return existing;

  const next = [trimmed, ...existing.filter((n) => n.toLowerCase() !== trimmed.toLowerCase())].slice(
    0,
    MAX_NAMES
  );
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

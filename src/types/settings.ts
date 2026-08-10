import { DEFAULT_LANGUAGE, LanguageCode } from '../i18n/languages';

export interface Settings {
  language: LanguageCode;
  shotSeconds: number;
  extensionSeconds: number;
  extensionsPerGame: number;
  totalMatchEnabled: boolean;
  totalMatchMinutes: number;
  totalGameEnabled: boolean;
  totalGameMinutes: number;
  raceToGames: number;
  player1Name: string;
  player2Name: string;
  shotClockSoundEnabled: boolean;
  gameTimeWarningSoundEnabled: boolean;
  vibrationEnabled: boolean;
}

// Defaults based on professional 9-ball / pool shot-clock rules
// (Matchroom World Nineball Tour, WPA-sanctioned events). See SPEC.md.
export const DEFAULT_SETTINGS: Settings = {
  language: DEFAULT_LANGUAGE,
  shotSeconds: 30,
  extensionSeconds: 30,
  extensionsPerGame: 1,
  totalMatchEnabled: false,
  totalMatchMinutes: 60,
  totalGameEnabled: false,
  totalGameMinutes: 15,
  raceToGames: 0,
  player1Name: 'Gracz 1',
  player2Name: 'Gracz 2',
  shotClockSoundEnabled: true,
  gameTimeWarningSoundEnabled: true,
  vibrationEnabled: true,
};

export const LIMITS = {
  shotSeconds: { min: 5, max: 120 },
  extensionSeconds: { min: 0, max: 120 },
  extensionsPerGame: { min: 0, max: 5 },
  // Both steppers move in 5-minute increments (see SettingsScreen), so their
  // bounds are kept 5-minute-aligned too — otherwise the last step before a
  // limit lands off the grid (e.g. clamping down to 1 instead of stopping at 5).
  totalMatchMinutes: { min: 5, max: 995 },
  totalGameMinutes: { min: 5, max: 120 },
  raceToGames: { min: 0, max: 21 },
} as const;

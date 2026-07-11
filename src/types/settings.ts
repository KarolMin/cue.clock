export interface Settings {
  shotSeconds: number;
  extensionSeconds: number;
  extensionsPerGame: number;
  totalMatchEnabled: boolean;
  totalMatchMinutes: number;
  player1Name: string;
  player2Name: string;
}

// Defaults based on professional 9-ball / pool shot-clock rules
// (Matchroom World Nineball Tour, WPA-sanctioned events). See SPEC.md.
export const DEFAULT_SETTINGS: Settings = {
  shotSeconds: 30,
  extensionSeconds: 30,
  extensionsPerGame: 1,
  totalMatchEnabled: false,
  totalMatchMinutes: 60,
  player1Name: 'Gracz 1',
  player2Name: 'Gracz 2',
};

export const LIMITS = {
  shotSeconds: { min: 5, max: 120 },
  extensionSeconds: { min: 0, max: 120 },
  extensionsPerGame: { min: 0, max: 5 },
  totalMatchMinutes: { min: 1, max: 999 },
} as const;

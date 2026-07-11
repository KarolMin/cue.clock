export interface ThemeColors {
  background: string;
  surface: string;
  controlSurface: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentText: string;
  danger: string;
  warning: string;
  inputBackground: string;
  placeholder: string;
  disabledSurface: string;
  disabledText: string;
  player1: string;
  player2: string;
}

// Accent (active/enabled state) is a classic billiard cloth green.
// Player identity colors (red / blue) mark whose panel is active.
export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#121212',
  controlSurface: '#2a2f3a',
  text: '#ffffff',
  textSecondary: '#9aa0aa',
  accent: '#22c55e',
  accentText: '#ffffff',
  danger: '#ff4d4f',
  warning: '#f5a623',
  inputBackground: '#161616',
  placeholder: '#5a6070',
  disabledSurface: '#2a2f3a',
  disabledText: '#5a6070',
  player1: '#f24141',
  player2: '#3b82f6',
};

export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f2f3f5',
  controlSurface: '#e2e4e8',
  text: '#14171a',
  textSecondary: '#5b6270',
  accent: '#0f7a3d',
  accentText: '#ffffff',
  danger: '#d92d2f',
  warning: '#a15c00',
  inputBackground: '#eaecef',
  placeholder: '#9098a3',
  disabledSurface: '#dde0e4',
  disabledText: '#9aa0aa',
  player1: '#dc2626',
  player2: '#2563eb',
};

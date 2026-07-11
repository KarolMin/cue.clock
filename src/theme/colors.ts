export interface ThemeColors {
  background: string;
  surface: string;
  surfaceActive: string;
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
}

// Accent is a classic billiard cloth green, tuned separately per theme for contrast.
export const darkColors: ThemeColors = {
  background: '#000000',
  surface: '#121212',
  surfaceActive: '#0d2018',
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
};

export const lightColors: ThemeColors = {
  background: '#ffffff',
  surface: '#f2f3f5',
  surfaceActive: '#e5f6ea',
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
};

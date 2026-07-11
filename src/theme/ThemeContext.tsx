import { createContext, ReactNode, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { darkColors, lightColors, ThemeColors } from './colors';

export type ColorScheme = 'light' | 'dark';

interface ThemeContextValue {
  colors: ThemeColors;
  scheme: ColorScheme;
}

const ThemeContext = createContext<ThemeContextValue>({ colors: darkColors, scheme: 'dark' });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const scheme: ColorScheme = systemScheme === 'light' ? 'light' : 'dark';
  const value = useMemo<ThemeContextValue>(
    () => ({ colors: scheme === 'dark' ? darkColors : lightColors, scheme }),
    [scheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}

import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  name: string;
  accentColor: string;
  isActive: boolean;
  extensionsUsed: number;
  extensionsPerGame: number;
  onPressPlayer: () => void;
}

export function PlayerPanel({
  name,
  accentColor,
  isActive,
  extensionsUsed,
  extensionsPerGame,
  onPressPlayer,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const extensionsLeft = extensionsPerGame - extensionsUsed;

  return (
    <Pressable
      onPress={onPressPlayer}
      style={[
        styles.panel,
        isActive && { borderColor: accentColor, backgroundColor: `${accentColor}1a` },
      ]}
    >
      <Text
        style={[styles.name, isActive && { color: accentColor, fontWeight: '700' }]}
        numberOfLines={1}
      >
        {name}
      </Text>
      {extensionsPerGame > 0 && (
        <View style={styles.dotsRow}>
          {Array.from({ length: extensionsPerGame }).map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i < extensionsLeft ? styles.dotAvailable : styles.dotUsed]}
            />
          ))}
        </View>
      )}
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    panel: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 28,
      paddingVertical: 34,
      paddingHorizontal: 14,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 3,
      borderColor: colors.panelInactiveBorder,
    },
    name: {
      color: colors.textSecondary,
      fontSize: 24,
      fontWeight: '600',
    },
    dotsRow: {
      flexDirection: 'row',
      marginTop: 14,
    },
    dot: {
      width: 16,
      height: 16,
      borderRadius: 8,
      marginHorizontal: 4,
    },
    dotAvailable: {
      backgroundColor: colors.accent,
    },
    dotUsed: {
      backgroundColor: colors.disabledSurface,
    },
  });
}

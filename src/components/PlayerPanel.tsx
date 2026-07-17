import { Ionicons } from '@expo/vector-icons';
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
  canUseExtension: boolean;
  onUseExtension: () => void;
}

export function PlayerPanel({
  name,
  accentColor,
  isActive,
  extensionsUsed,
  extensionsPerGame,
  canUseExtension,
  onUseExtension,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const extensionsLeft = extensionsPerGame - extensionsUsed;

  return (
    <View
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
      <Pressable
        style={[styles.extButton, !canUseExtension && styles.extButtonDisabled]}
        onPress={onUseExtension}
        disabled={!canUseExtension}
      >
        <Ionicons
          name="hourglass"
          size={13}
          color={canUseExtension ? colors.accentText : colors.disabledText}
        />
        <Text style={[styles.extButtonText, !canUseExtension && styles.extButtonTextDisabled]}>
          Przedłużenie
        </Text>
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    panel: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 16,
      padding: 14,
      alignItems: 'center',
      borderWidth: 2,
      borderColor: 'transparent',
    },
    name: {
      color: colors.textSecondary,
      fontSize: 16,
      fontWeight: '600',
      marginBottom: 8,
    },
    dotsRow: {
      flexDirection: 'row',
      marginBottom: 10,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
      marginHorizontal: 3,
    },
    dotAvailable: {
      backgroundColor: colors.accent,
    },
    dotUsed: {
      backgroundColor: colors.disabledSurface,
    },
    extButton: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: colors.accent,
      paddingVertical: 8,
      paddingHorizontal: 14,
      borderRadius: 10,
    },
    extButtonDisabled: {
      backgroundColor: colors.disabledSurface,
    },
    extButtonText: {
      color: colors.accentText,
      fontWeight: '700',
      fontSize: 13,
    },
    extButtonTextDisabled: {
      color: colors.disabledText,
    },
  });
}

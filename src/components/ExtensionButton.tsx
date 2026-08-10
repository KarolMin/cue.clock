import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  canUseExtension: boolean;
  onUseExtension: () => void;
  style?: StyleProp<ViewStyle>;
}

// The "use extension" action, kept as its own touch target separate from the
// player panel (sits above it) so tapping one never risks triggering the other.
export function ExtensionButton({ canUseExtension, onUseExtension, style }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      style={[styles.extButton, !canUseExtension && styles.extButtonDisabled, style]}
      onPress={onUseExtension}
      disabled={!canUseExtension}
    >
      <Ionicons
        name="hourglass"
        size={16}
        color={canUseExtension ? colors.accentText : colors.disabledText}
      />
      <Text style={[styles.extButtonText, !canUseExtension && styles.extButtonTextDisabled]}>EXT</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    extButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 7,
      backgroundColor: colors.accent,
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 14,
    },
    extButtonDisabled: {
      backgroundColor: colors.disabledSurface,
    },
    extButtonText: {
      color: colors.accentText,
      fontWeight: '700',
      fontSize: 14,
    },
    extButtonTextDisabled: {
      color: colors.disabledText,
    },
  });
}

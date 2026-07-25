import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from '../i18n/LanguageContext';
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
  onPressPlayer: () => void;
}

export function PlayerPanel({
  name,
  accentColor,
  isActive,
  extensionsUsed,
  extensionsPerGame,
  canUseExtension,
  onUseExtension,
  onPressPlayer,
}: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
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
      <Pressable
        style={[styles.extButton, !canUseExtension && styles.extButtonDisabled]}
        onPress={onUseExtension}
        disabled={!canUseExtension}
      >
        <Ionicons
          name="hourglass"
          size={15}
          color={canUseExtension ? colors.accentText : colors.disabledText}
        />
        <Text style={[styles.extButtonText, !canUseExtension && styles.extButtonTextDisabled]}>
          {t('playerExtensionButton')}
        </Text>
      </Pressable>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    panel: {
      flex: 1,
      backgroundColor: colors.surface,
      borderRadius: 24,
      padding: 28,
      alignItems: 'center',
      borderWidth: 3,
      borderColor: colors.panelInactiveBorder,
    },
    name: {
      color: colors.textSecondary,
      fontSize: 26,
      fontWeight: '600',
      marginBottom: 12,
    },
    dotsRow: {
      flexDirection: 'row',
      marginBottom: 14,
    },
    dot: {
      width: 14,
      height: 14,
      borderRadius: 7,
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
      gap: 6,
      backgroundColor: colors.accent,
      paddingVertical: 12,
      paddingHorizontal: 20,
      borderRadius: 14,
    },
    extButtonDisabled: {
      backgroundColor: colors.disabledSurface,
    },
    extButtonText: {
      color: colors.accentText,
      fontWeight: '700',
      fontSize: 15,
    },
    extButtonTextDisabled: {
      color: colors.disabledText,
    },
  });
}

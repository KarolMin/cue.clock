import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface Props {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
}

export function NumberStepper({ label, value, onChange, min, max, step = 1, unit }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          style={[styles.button, value <= min && styles.buttonDisabled]}
          onPress={() => onChange(clamp(value - step))}
          disabled={value <= min}
        >
          <Text style={[styles.buttonText, value <= min && styles.buttonTextDisabled]}>−</Text>
        </Pressable>
        <Text style={styles.value}>
          {value}
          {unit ? ` ${unit}` : ''}
        </Text>
        <Pressable
          style={[styles.button, value >= max && styles.buttonDisabled]}
          onPress={() => onChange(clamp(value + step))}
          disabled={value >= max}
        >
          <Text style={[styles.buttonText, value >= max && styles.buttonTextDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 12,
    },
    label: {
      fontSize: 16,
      color: colors.text,
      flexShrink: 1,
      marginRight: 12,
    },
    controls: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    button: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.controlSurface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonDisabled: {
      backgroundColor: colors.disabledSurface,
    },
    buttonText: {
      color: colors.accent,
      fontSize: 20,
      fontWeight: '600',
    },
    buttonTextDisabled: {
      color: colors.disabledText,
    },
    value: {
      color: colors.text,
      fontSize: 16,
      fontWeight: '600',
      minWidth: 64,
      textAlign: 'center',
    },
  });
}

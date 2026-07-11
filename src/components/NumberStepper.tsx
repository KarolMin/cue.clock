import { Pressable, StyleSheet, Text, View } from 'react-native';

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
  const clamp = (v: number) => Math.min(max, Math.max(min, v));

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.controls}>
        <Pressable
          style={styles.button}
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
          style={styles.button}
          onPress={() => onChange(clamp(value + step))}
          disabled={value >= max}
        >
          <Text style={[styles.buttonText, value >= max && styles.buttonTextDisabled]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    fontSize: 16,
    color: '#e6e6e6',
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
    backgroundColor: '#2a2f3a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: '#4fd1c5',
    fontSize: 20,
    fontWeight: '600',
  },
  buttonTextDisabled: {
    color: '#4a4f58',
  },
  value: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    minWidth: 64,
    textAlign: 'center',
  },
});

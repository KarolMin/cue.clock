import { Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
  name: string;
  isActive: boolean;
  extensionsUsed: number;
  extensionsPerGame: number;
  canUseExtension: boolean;
  onUseExtension: () => void;
}

export function PlayerPanel({
  name,
  isActive,
  extensionsUsed,
  extensionsPerGame,
  canUseExtension,
  onUseExtension,
}: Props) {
  const extensionsLeft = extensionsPerGame - extensionsUsed;

  return (
    <View style={[styles.panel, isActive && styles.panelActive]}>
      <Text style={[styles.name, isActive && styles.nameActive]} numberOfLines={1}>
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
        <Text style={[styles.extButtonText, !canUseExtension && styles.extButtonTextDisabled]}>
          Przedłużenie
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flex: 1,
    backgroundColor: '#1b1f27',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  panelActive: {
    borderColor: '#4fd1c5',
    backgroundColor: '#1f2a2b',
  },
  name: {
    color: '#9aa0aa',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  nameActive: {
    color: '#fff',
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
    backgroundColor: '#4fd1c5',
  },
  dotUsed: {
    backgroundColor: '#3a3f48',
  },
  extButton: {
    backgroundColor: '#4fd1c5',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  extButtonDisabled: {
    backgroundColor: '#2a2f3a',
  },
  extButtonText: {
    color: '#0b1f1e',
    fontWeight: '700',
    fontSize: 13,
  },
  extButtonTextDisabled: {
    color: '#565c66',
  },
});

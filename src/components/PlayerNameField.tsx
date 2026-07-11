import { useMemo } from 'react';
import { FocusEvent, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

// react-native-web doesn't implement `selectTextOnFocus`, so select the
// underlying DOM input's text manually there; native platforms get it for free.
function handleWebFocus(e: FocusEvent) {
  if (Platform.OS === 'web') {
    (e.target as unknown as { select?: () => void }).select?.();
  }
}

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onCommit: () => void;
  placeholder: string;
  suggestions: string[];
  onPickSuggestion: (name: string) => void;
}

export function PlayerNameField({
  value,
  onChangeText,
  onCommit,
  placeholder,
  suggestions,
  onPickSuggestion,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        onEndEditing={onCommit}
        onBlur={onCommit}
        onFocus={handleWebFocus}
        selectTextOnFocus
        placeholder={placeholder}
        placeholderTextColor={colors.placeholder}
      />
      {suggestions.length > 0 && (
        <View style={styles.chipsRow}>
          {suggestions.map((name) => (
            <Pressable key={name} style={styles.chip} onPress={() => onPickSuggestion(name)}>
              <Text style={styles.chipText} numberOfLines={1}>
                {name}
              </Text>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    input: {
      backgroundColor: colors.inputBackground,
      color: colors.text,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 10,
      marginTop: 10,
      fontSize: 15,
    },
    chipsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginTop: 8,
      gap: 8,
    },
    chip: {
      backgroundColor: colors.disabledSurface,
      borderRadius: 999,
      paddingHorizontal: 12,
      paddingVertical: 6,
      maxWidth: 160,
    },
    chipText: {
      color: colors.textSecondary,
      fontSize: 13,
      fontWeight: '600',
    },
  });
}

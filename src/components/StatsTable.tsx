import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors } from '../theme/colors';
import { useTheme } from '../theme/ThemeContext';

interface StatRow {
  label: string;
  p1: string;
  p2: string;
}

interface Props {
  player1Name: string;
  player2Name: string;
  player1Color: string;
  player2Color: string;
  rows: StatRow[];
}

export function StatsTable({ player1Name, player2Name, player1Color, player2Color, rows }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.table}>
      <View style={[styles.row, styles.headerRow]}>
        <View style={styles.labelCell} />
        <Text style={[styles.valueCell, styles.headerText, { color: player1Color }]} numberOfLines={1}>
          {player1Name}
        </Text>
        <Text style={[styles.valueCell, styles.headerText, { color: player2Color }]} numberOfLines={1}>
          {player2Name}
        </Text>
      </View>
      {rows.map((row, i) => (
        <View key={row.label} style={[styles.row, i % 2 === 1 && styles.rowAlt]}>
          <Text style={styles.labelCell}>{row.label}</Text>
          <Text style={styles.valueCell}>{row.p1}</Text>
          <Text style={styles.valueCell}>{row.p2}</Text>
        </View>
      ))}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    table: {
      borderRadius: 12,
      overflow: 'hidden',
      marginTop: 4,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 8,
      paddingHorizontal: 10,
    },
    rowAlt: {
      backgroundColor: colors.controlSurface + '55',
    },
    headerRow: {
      borderBottomWidth: 1,
      borderBottomColor: colors.controlSurface,
      paddingBottom: 10,
      marginBottom: 2,
    },
    headerText: {
      fontWeight: '700',
    },
    labelCell: {
      flex: 1.3,
      color: colors.textSecondary,
      fontSize: 12,
    },
    valueCell: {
      flex: 1,
      color: colors.text,
      fontSize: 12,
      textAlign: 'center',
    },
  });
}

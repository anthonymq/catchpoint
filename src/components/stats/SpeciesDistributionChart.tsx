import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { CatchStatistics } from '../../utils/statistics';
import { Pie, PolarChart } from 'victory-native';
import { useMemo } from 'react';

interface SpeciesDistributionChartProps {
  stats: CatchStatistics;
}

const CHART_SIZE = 180;

// Color palette for pie slices
const COLORS = [
  '#4CAF50', // Green
  '#2196F3', // Blue
  '#FF9800', // Orange
  '#9C27B0', // Purple
  '#F44336', // Red
  '#00BCD4', // Cyan
  '#FFEB3B', // Yellow
  '#795548', // Brown
];

export default function SpeciesDistributionChart({ stats }: SpeciesDistributionChartProps) {
  const colors = useColors();

  const chartData = useMemo(() => {
    if (stats.topSpecies.length === 0) return [];

    // Take top 6 species, group rest as "Other"
    const top = stats.topSpecies.slice(0, 6);
    const other = stats.topSpecies.slice(6);
    const otherCount = other.reduce((sum, s) => sum + s.count, 0);

    const data = top.map((s, i) => ({
      label: s.species,
      value: s.count,
      color: COLORS[i % COLORS.length],
    }));

    if (otherCount > 0) {
      data.push({
        label: 'Other',
        value: otherCount,
        color: colors.textSecondary,
      });
    }

    return data;
  }, [stats.topSpecies, colors.textSecondary]);

  if (chartData.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          No species data available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.chartContainer}>
        <PolarChart
          data={chartData}
          labelKey="label"
          valueKey="value"
          colorKey="color"
        >
          <Pie.Chart innerRadius="40%">
            {({ slice }) => (
              <Pie.Slice>
                <Pie.SliceAngularInset
                  angularInset={{
                    angularStrokeWidth: 2,
                    angularStrokeColor: colors.surface,
                  }}
                />
              </Pie.Slice>
            )}
          </Pie.Chart>
        </PolarChart>
      </View>

      {/* Legend */}
      <View style={styles.legend}>
        {chartData.map((item, index) => (
          <View key={item.label} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text style={[styles.legendLabel, { color: colors.text }]} numberOfLines={1}>
              {item.label}
            </Text>
            <Text style={[styles.legendValue, { color: colors.textSecondary }]}>
              {item.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chartContainer: {
    width: CHART_SIZE,
    height: CHART_SIZE,
  },
  emptyContainer: {
    height: CHART_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  legend: {
    flex: 1,
    marginLeft: 16,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  legendLabel: {
    flex: 1,
    fontSize: 13,
  },
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
});

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { CatchStatistics, formatHourLabel, GoldenHourInsight } from '../../utils/statistics';
import { useMemo, useState } from 'react';

interface GoldenHourHeatmapProps {
  stats: CatchStatistics;
}

const CHART_HEIGHT = 80;

/**
 * Interpolate between two colors based on intensity (0-1)
 * Cold (blue) -> Warm (yellow) -> Hot (red)
 */
function getHeatColor(intensity: number): string {
  // Color stops: blue -> cyan -> yellow -> orange -> red
  if (intensity === 0) return '#1a1a2e'; // Dark background for zero
  
  if (intensity <= 0.25) {
    // Blue to cyan
    const t = intensity / 0.25;
    return `rgb(${Math.round(30 + t * 70)}, ${Math.round(60 + t * 140)}, ${Math.round(180 + t * 75)})`;
  } else if (intensity <= 0.5) {
    // Cyan to yellow
    const t = (intensity - 0.25) / 0.25;
    return `rgb(${Math.round(100 + t * 155)}, ${Math.round(200 - t * 50)}, ${Math.round(255 - t * 200)})`;
  } else if (intensity <= 0.75) {
    // Yellow to orange
    const t = (intensity - 0.5) / 0.25;
    return `rgb(255, ${Math.round(150 - t * 80)}, ${Math.round(55 - t * 55)})`;
  } else {
    // Orange to red
    const t = (intensity - 0.75) / 0.25;
    return `rgb(255, ${Math.round(70 - t * 50)}, ${Math.round(0 + t * 20)})`;
  }
}

export default function GoldenHourHeatmap({ stats }: GoldenHourHeatmapProps) {
  const colors = useColors();
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const maxCount = useMemo(() => {
    return Math.max(...stats.catchesByHour.map((h) => h.count), 1);
  }, [stats.catchesByHour]);

  const hourData = useMemo(() => {
    return stats.catchesByHour.map((h) => ({
      hour: h.hour,
      count: h.count,
      intensity: h.count / maxCount,
      color: getHeatColor(h.count / maxCount),
    }));
  }, [stats.catchesByHour, maxCount]);

  if (stats.totalCatches === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Log catches to unlock insights
        </Text>
      </View>
    );
  }

  const selectedData = selectedHour !== null ? hourData.find((h) => h.hour === selectedHour) : null;

  return (
    <View style={styles.container}>
      {/* Hour labels */}
      <View style={styles.labelRow}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>12AM</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>6AM</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>12PM</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>6PM</Text>
        <Text style={[styles.label, { color: colors.textSecondary }]}>12AM</Text>
      </View>

      {/* Heatmap bars */}
      <View style={styles.heatmapContainer}>
        {hourData.map((h) => (
          <TouchableOpacity
            key={h.hour}
            style={[
              styles.hourBar,
              {
                backgroundColor: h.color,
                height: CHART_HEIGHT,
              },
            ]}
            onPress={() => setSelectedHour(selectedHour === h.hour ? null : h.hour)}
            activeOpacity={0.8}
          >
            {selectedHour === h.hour && (
              <View style={[styles.selectedIndicator, { backgroundColor: colors.text }]} />
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Tooltip */}
      {selectedData && (
        <View style={[styles.tooltip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.tooltipText, { color: colors.text }]}>
            {formatHourLabel(selectedData.hour)}: {selectedData.count} catches
          </Text>
        </View>
      )}

      {/* Golden hour insight */}
      {stats.goldenHourInsight && (
        <View style={styles.insightContainer}>
          <Text style={[styles.insightIcon]}>✨</Text>
          <Text style={[styles.insightText, { color: colors.primary }]}>
            {stats.goldenHourInsight.insightText}
          </Text>
        </View>
      )}

      {/* Legend */}
      <View style={styles.legendContainer}>
        <View style={styles.legendGradient}>
          <View style={[styles.legendStop, { backgroundColor: '#1e4d7b' }]} />
          <View style={[styles.legendStop, { backgroundColor: '#64c8ff' }]} />
          <View style={[styles.legendStop, { backgroundColor: '#ffeb3b' }]} />
          <View style={[styles.legendStop, { backgroundColor: '#ff9800' }]} />
          <View style={[styles.legendStop, { backgroundColor: '#f44336' }]} />
        </View>
        <View style={styles.legendLabels}>
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>Low</Text>
          <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>High</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    height: CHART_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  label: {
    fontSize: 10,
  },
  heatmapContainer: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  hourBar: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 4,
  },
  selectedIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginBottom: 4,
  },
  tooltip: {
    marginTop: 8,
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  tooltipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 4,
  },
  insightIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  insightText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  legendContainer: {
    marginTop: 16,
    alignItems: 'center',
  },
  legendGradient: {
    flexDirection: 'row',
    width: 150,
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  legendStop: {
    flex: 1,
  },
  legendLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: 150,
    marginTop: 4,
  },
  legendLabel: {
    fontSize: 10,
  },
});

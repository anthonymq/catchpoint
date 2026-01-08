import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { CatchStatistics, PressureTrend } from '../../utils/statistics';
import { useMemo } from 'react';

interface PressurePerformanceChartProps {
  stats: CatchStatistics;
}

const TREND_CONFIG: Record<PressureTrend, { icon: string; color: string; label: string }> = {
  Rising: { icon: '📈', color: '#4caf50', label: 'Rising' },
  Stable: { icon: '➡️', color: '#2196f3', label: 'Stable' },
  Falling: { icon: '📉', color: '#ff9800', label: 'Falling' },
  Unknown: { icon: '❓', color: '#9e9e9e', label: 'Unknown' },
};

/**
 * Pressure Performance Chart - Shows catch success by barometric pressure trend
 */
export default function PressurePerformanceChart({ stats }: PressurePerformanceChartProps) {
  const colors = useColors();

  const { trendData, maxCount, hasData } = useMemo(() => {
    // Filter out Unknown for display, unless it's the only data
    const filteredTrends = stats.catchesByPressureTrend.filter(
      (t) => t.trend !== 'Unknown' || stats.catchesByPressureTrend.length === 1
    );
    
    const max = Math.max(...filteredTrends.map((t) => t.count), 1);
    const total = filteredTrends.reduce((sum, t) => sum + t.count, 0);
    
    const data = filteredTrends.map((t) => ({
      trend: t.trend,
      count: t.count,
      percentage: total > 0 ? Math.round((t.count / total) * 100) : 0,
      barWidth: max > 0 ? (t.count / max) * 100 : 0,
      config: TREND_CONFIG[t.trend],
    }));
    
    return { 
      trendData: data, 
      maxCount: max,
      hasData: filteredTrends.some(t => t.count > 0),
    };
  }, [stats.catchesByPressureTrend]);

  if (stats.totalCatches === 0 || !hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Pressure data requires weather information
        </Text>
      </View>
    );
  }

  // Find best trend
  const bestTrend = trendData.reduce(
    (best, t) => (t.count > best.count ? t : best),
    trendData[0]
  );

  return (
    <View style={styles.container}>
      {/* Trend bars */}
      {trendData.map((trend) => (
        <View key={trend.trend} style={styles.trendRow}>
          {/* Icon and label */}
          <View style={styles.trendLabel}>
            <Text style={styles.trendIcon}>{trend.config.icon}</Text>
            <Text style={[styles.trendName, { color: colors.text }]}>
              {trend.config.label}
            </Text>
          </View>

          {/* Bar */}
          <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.bar,
                {
                  width: `${trend.barWidth}%`,
                  backgroundColor: trend.config.color,
                },
              ]}
            />
          </View>

          {/* Count */}
          <View style={styles.statsContainer}>
            <Text style={[styles.countText, { color: colors.text }]}>
              {trend.count}
            </Text>
            <Text style={[styles.percentText, { color: colors.textSecondary }]}>
              ({trend.percentage}%)
            </Text>
          </View>
        </View>
      ))}

      {/* Best trend insight */}
      {bestTrend && bestTrend.count > 0 && (
        <View style={[styles.insightContainer, { backgroundColor: colors.background }]}>
          <Text style={styles.insightIcon}>{bestTrend.config.icon}</Text>
          <Text style={[styles.insightText, { color: colors.textSecondary }]}>
            Most catches when pressure is{' '}
            <Text style={{ color: bestTrend.config.color, fontWeight: '600' }}>
              {bestTrend.config.label.toLowerCase()}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 8,
  },
  emptyContainer: {
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trendLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  trendIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  trendName: {
    fontSize: 13,
    fontWeight: '500',
  },
  barContainer: {
    flex: 1,
    height: 20,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 10,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    justifyContent: 'flex-end',
  },
  countText: {
    fontSize: 13,
    fontWeight: '600',
    marginRight: 4,
  },
  percentText: {
    fontSize: 11,
  },
  insightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
  insightIcon: {
    fontSize: 18,
    marginRight: 10,
  },
  insightText: {
    fontSize: 13,
    flex: 1,
  },
});

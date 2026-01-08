import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { CatchStatistics, SkyCondition } from '../../utils/statistics';
import { useMemo } from 'react';

interface SkyConditionsChartProps {
  stats: CatchStatistics;
}

/**
 * Sky Conditions Chart - Shows catch distribution by weather conditions
 * Horizontal bar chart with weather icons
 */
export default function SkyConditionsChart({ stats }: SkyConditionsChartProps) {
  const colors = useColors();

  const { conditionData, maxCount, hasData } = useMemo(() => {
    // Filter out Unknown
    const filtered = stats.catchesBySkyCondition.filter((c) => c.condition !== 'Unknown');
    
    const max = Math.max(...filtered.map((c) => c.count), 1);
    const total = filtered.reduce((sum, c) => sum + c.count, 0);
    
    const data = filtered.map((c) => ({
      condition: c.condition,
      count: c.count,
      icon: c.icon,
      percentage: total > 0 ? Math.round((c.count / total) * 100) : 0,
      barWidth: max > 0 ? (c.count / max) * 100 : 0,
      color: getConditionColor(c.condition),
    }));
    
    return { 
      conditionData: data, 
      maxCount: max,
      hasData: filtered.some(c => c.count > 0),
    };
  }, [stats.catchesBySkyCondition]);

  if (stats.totalCatches === 0 || !hasData) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Weather data requires network connection
        </Text>
      </View>
    );
  }

  // Find best condition
  const bestCondition = conditionData.reduce(
    (best, c) => (c.count > best.count ? c : best),
    conditionData[0]
  );

  return (
    <View style={styles.container}>
      {/* Condition bars */}
      {conditionData.map((condition) => (
        <View key={condition.condition} style={styles.conditionRow}>
          {/* Icon and label */}
          <View style={styles.conditionLabel}>
            <Text style={styles.conditionIcon}>{condition.icon}</Text>
            <Text style={[styles.conditionName, { color: colors.text }]}>
              {condition.condition}
            </Text>
          </View>

          {/* Bar */}
          <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.bar,
                {
                  width: `${condition.barWidth}%`,
                  backgroundColor: condition.color,
                },
              ]}
            />
          </View>

          {/* Count */}
          <View style={styles.statsContainer}>
            <Text style={[styles.countText, { color: colors.text }]}>
              {condition.count}
            </Text>
            <Text style={[styles.percentText, { color: colors.textSecondary }]}>
              ({condition.percentage}%)
            </Text>
          </View>
        </View>
      ))}

      {/* Best condition insight */}
      {bestCondition && bestCondition.count > 0 && (
        <View style={[styles.insightContainer, { backgroundColor: colors.background }]}>
          <Text style={styles.insightIcon}>{bestCondition.icon}</Text>
          <Text style={[styles.insightText, { color: colors.textSecondary }]}>
            Best fishing when skies are{' '}
            <Text style={{ color: bestCondition.color, fontWeight: '600' }}>
              {bestCondition.condition.toLowerCase()}
            </Text>
          </Text>
        </View>
      )}
    </View>
  );
}

function getConditionColor(condition: SkyCondition): string {
  const colors: Record<SkyCondition, string> = {
    Clear: '#ffc107',    // Sunny yellow
    Clouds: '#90a4ae',   // Gray
    Rain: '#42a5f5',     // Blue
    Snow: '#b3e5fc',     // Light blue
    Other: '#78909c',    // Blue-gray
    Unknown: '#9e9e9e',  // Gray
  };
  return colors[condition];
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
  conditionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  conditionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 90,
  },
  conditionIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  conditionName: {
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
    fontSize: 20,
    marginRight: 10,
  },
  insightText: {
    fontSize: 13,
    flex: 1,
  },
});

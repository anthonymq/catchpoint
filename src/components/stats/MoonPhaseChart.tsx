import { View, Text, StyleSheet } from 'react-native';
import { useColors } from '../../context/ThemeContext';
import { CatchStatistics } from '../../utils/statistics';
import { getMoonPhaseIcon, MoonPhaseName, MOON_PHASES, getMoonPhaseColor } from '../../utils/moonPhase';
import { useMemo } from 'react';

interface MoonPhaseChartProps {
  stats: CatchStatistics;
}

/**
 * Moon Phase Dashboard - Shows catch distribution across lunar phases
 * Displays as a horizontal bar chart with moon phase icons
 */
export default function MoonPhaseChart({ stats }: MoonPhaseChartProps) {
  const colors = useColors();

  const { totalWithPhase, maxCount, phaseData } = useMemo(() => {
    const total = stats.catchesByMoonPhase.reduce((sum, p) => sum + p.count, 0);
    const max = Math.max(...stats.catchesByMoonPhase.map((p) => p.count), 1);
    
    const data = stats.catchesByMoonPhase.map((p) => ({
      phase: p.phase,
      count: p.count,
      percentage: total > 0 ? Math.round((p.count / total) * 100) : 0,
      icon: getMoonPhaseIcon(p.phase),
      color: getMoonPhaseColor(p.phase),
      barWidth: max > 0 ? (p.count / max) * 100 : 0,
    }));
    
    return { totalWithPhase: total, maxCount: max, phaseData: data };
  }, [stats.catchesByMoonPhase]);

  if (stats.totalCatches === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Log catches to see moon phase patterns
        </Text>
      </View>
    );
  }

  // Find best phase
  const bestPhase = phaseData.reduce((best, p) => 
    p.count > best.count ? p : best, 
    phaseData[0]
  );

  return (
    <View style={styles.container}>
      {/* Phase bars */}
      {phaseData.map((phase) => (
        <View key={phase.phase} style={styles.phaseRow}>
          {/* Icon and label */}
          <View style={styles.phaseLabel}>
            <Text style={styles.phaseIcon}>{phase.icon}</Text>
            <Text 
              style={[
                styles.phaseName, 
                { color: phase.phase === bestPhase.phase ? colors.primary : colors.text }
              ]}
              numberOfLines={1}
            >
              {phase.phase}
            </Text>
          </View>

          {/* Bar */}
          <View style={[styles.barContainer, { backgroundColor: colors.border }]}>
            <View
              style={[
                styles.bar,
                {
                  width: `${phase.barWidth}%`,
                  backgroundColor: phase.color,
                },
              ]}
            />
          </View>

          {/* Count and percentage */}
          <View style={styles.statsContainer}>
            <Text style={[styles.countText, { color: colors.text }]}>
              {phase.count}
            </Text>
            <Text style={[styles.percentText, { color: colors.textSecondary }]}>
              ({phase.percentage}%)
            </Text>
          </View>
        </View>
      ))}

      {/* Best phase insight */}
      {bestPhase.count > 0 && (
        <View style={[styles.insightContainer, { backgroundColor: colors.background }]}>
          <Text style={styles.insightIcon}>{bestPhase.icon}</Text>
          <Text style={[styles.insightText, { color: colors.textSecondary }]}>
            Best catches during{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>
              {bestPhase.phase}
            </Text>
            {' '}({bestPhase.percentage}% of catches)
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
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
  },
  phaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  phaseLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 110,
  },
  phaseIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  phaseName: {
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  barContainer: {
    flex: 1,
    height: 16,
    borderRadius: 8,
    overflow: 'hidden',
    marginHorizontal: 8,
  },
  bar: {
    height: '100%',
    borderRadius: 8,
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

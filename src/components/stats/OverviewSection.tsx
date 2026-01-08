import { View, StyleSheet } from 'react-native';
import { CatchStatistics } from '../../utils/statistics';
import { useSettingsStore } from '../../stores/settingsStore';
import StatCard from './StatCard';

interface OverviewSectionProps {
  stats: CatchStatistics;
}

export default function OverviewSection({ stats }: OverviewSectionProps) {
  const { weightUnit } = useSettingsStore();

  // Convert weight if needed
  const displayWeight = (weight: number): string => {
    if (weightUnit === 'lb') {
      return (weight * 2.20462).toFixed(1);
    }
    return weight.toFixed(1);
  };

  const formatBiggestCatch = (): string => {
    if (!stats.biggestCatch) return '-';
    const weight = displayWeight(stats.biggestCatch.weight);
    return `${weight} ${weightUnit}`;
  };

  const formatBestDay = (): string => {
    if (!stats.bestDay) return '-';
    const date = new Date(stats.bestDay.date);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <StatCard
          title="Total Catches"
          value={stats.totalCatches}
          icon="fish"
          color="#4CAF50"
        />
        <View style={styles.gap} />
        <StatCard
          title="Avg Weight"
          value={stats.averageWeight > 0 ? `${displayWeight(stats.averageWeight)} ${weightUnit}` : '-'}
          icon="scale"
          color="#2196F3"
        />
      </View>
      <View style={styles.row}>
        <StatCard
          title="Biggest Catch"
          value={formatBiggestCatch()}
          subtitle={stats.biggestCatch?.species || undefined}
          icon="trophy"
          color="#FF9800"
        />
        <View style={styles.gap} />
        <StatCard
          title="Best Day"
          value={stats.bestDay ? `${stats.bestDay.count} catches` : '-'}
          subtitle={formatBestDay()}
          icon="calendar"
          color="#9C27B0"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  gap: {
    width: 12,
  },
});

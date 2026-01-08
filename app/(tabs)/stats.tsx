import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '../../src/context/ThemeContext';
import { useCatchStore } from '../../src/stores/catchStore';
import { useState, useMemo } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { calculateStatistics, getDateRangeForFilter, getCatchesForDateRange } from '../../src/utils/statistics';
import { TEST_CATCHES } from '../../src/data/testCatches';
import OverviewSection from '../../src/components/stats/OverviewSection';
import CatchesByTimeChart from '../../src/components/stats/CatchesByTimeChart';
import SpeciesDistributionChart from '../../src/components/stats/SpeciesDistributionChart';
import GoldenHourHeatmap from '../../src/components/stats/GoldenHourHeatmap';
import MoonPhaseChart from '../../src/components/stats/MoonPhaseChart';
import PressurePerformanceChart from '../../src/components/stats/PressurePerformanceChart';
import SkyConditionsChart from '../../src/components/stats/SkyConditionsChart';

type TimeFilter = 'week' | 'month' | 'year' | 'all';

export default function StatsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { catches: realCatches, loading } = useCatchStore();
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [useTestData, setUseTestData] = useState(false);

  // Use test data or real catches
  const allCatches = useTestData ? TEST_CATCHES : realCatches;

  // Filter catches by time range
  const filteredCatches = useMemo(() => {
    if (timeFilter === 'all') return allCatches;
    const { start, end } = getDateRangeForFilter(timeFilter);
    return getCatchesForDateRange(allCatches, start, end);
  }, [allCatches, timeFilter]);

  // Calculate statistics
  const stats = useMemo(() => calculateStatistics(filteredCatches), [filteredCatches]);

  const timeFilters: { label: string; value: TimeFilter }[] = [
    { label: '7D', value: 'week' },
    { label: '30D', value: 'month' },
    { label: '1Y', value: 'year' },
    { label: 'All', value: 'all' },
  ];

  // Low data warning threshold
  const showLowDataWarning = stats.totalCatches > 0 && stats.totalCatches < 5;

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Empty state
  if (allCatches.length === 0 && !useTestData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.emptyState, { paddingTop: insets.top + 60 }]}>
          <Ionicons name="stats-chart-outline" size={80} color={colors.textSecondary} />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>No Statistics Yet</Text>
          <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
            Log catches to unlock insights
          </Text>
          <TouchableOpacity
            style={[styles.testDataButton, { backgroundColor: colors.primary }]}
            onPress={() => setUseTestData(true)}
          >
            <Text style={styles.testDataButtonText}>Load Test Data</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Statistics</Text>
          {realCatches.length === 0 && useTestData && (
            <TouchableOpacity onPress={() => setUseTestData(false)}>
              <Text style={[styles.testDataLabel, { color: colors.primary }]}>Using Test Data</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Time Filter */}
        <View style={[styles.filterContainer, { backgroundColor: colors.surface }]}>
          {timeFilters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterButton,
                timeFilter === filter.value && [styles.filterButtonActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setTimeFilter(filter.value)}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  { color: timeFilter === filter.value ? 'white' : colors.text },
                ]}
              >
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Low Data Warning */}
        {showLowDataWarning && (
          <View style={[styles.warningContainer, { backgroundColor: colors.surface, borderColor: colors.warning }]}>
            <Ionicons name="warning-outline" size={18} color={colors.warning} />
            <Text style={[styles.warningText, { color: colors.textSecondary }]}>
              Not enough data for accurate patterns. Log more catches!
            </Text>
          </View>
        )}

        {/* Overview Stats */}
        <OverviewSection stats={stats} />

        {/* ============================================= */}
        {/* SECTION: My Patterns */}
        {/* ============================================= */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>My Patterns</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Discover your fishing sweet spots
          </Text>
        </View>

        {/* Golden Hour Heatmap */}
        <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>🌅 Golden Hour</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            When do you catch the most fish?
          </Text>
          <GoldenHourHeatmap stats={stats} />
        </View>

        {/* Moon Phase */}
        <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>🌙 Moon Phase (Solunar)</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            Lunar patterns in your catches
          </Text>
          <MoonPhaseChart stats={stats} />
        </View>

        {/* ============================================= */}
        {/* SECTION: Weather Impact */}
        {/* ============================================= */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Weather Impact</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            How weather affects your success
          </Text>
        </View>

        {/* Pressure Performance */}
        <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>📊 Pressure Performance</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            Barometric pressure trends
          </Text>
          <PressurePerformanceChart stats={stats} />
        </View>

        {/* Sky Conditions */}
        <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>🌤️ Sky Conditions</Text>
          <Text style={[styles.chartSubtitle, { color: colors.textSecondary }]}>
            Your best weather for fishing
          </Text>
          <SkyConditionsChart stats={stats} />
        </View>

        {/* ============================================= */}
        {/* SECTION: Catch Analytics */}
        {/* ============================================= */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Catch Analytics</Text>
          <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
            Your catch history breakdown
          </Text>
        </View>

        {/* Catches Over Time Chart */}
        <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>📈 Catches Over Time</Text>
          <CatchesByTimeChart catches={filteredCatches} />
        </View>

        {/* Species Distribution */}
        <View style={[styles.chartSection, { backgroundColor: colors.surface }]}>
          <Text style={[styles.chartTitle, { color: colors.text }]}>🐟 Top Species</Text>
          <SpeciesDistributionChart stats={stats} />
        </View>

        {/* Spacer for tab bar */}
        <View style={{ height: insets.bottom + 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  testDataLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  filterContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  filterButtonActive: {
    // backgroundColor set inline
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 16,
    gap: 8,
  },
  warningText: {
    fontSize: 13,
    flex: 1,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
  },
  chartSection: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  chartSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  testDataButton: {
    marginTop: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  testDataButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

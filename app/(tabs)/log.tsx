import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCatchStore } from '../../src/stores/catchStore';
import { useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useColors, useIsDark } from '../../src/context/ThemeContext';
import { SwipeableCatchRow } from '../../src/components/SwipeableCatchRow';
import { FilterModal, FilterOptions } from '../../src/components/FilterModal';

export default function LogScreen() {
  const { catches, loading, fetchCatches, deleteCatch } = useCatchStore();
  const [refreshing, setRefreshing] = useState(false);
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    species: null,
    dateRange: 'all',
  });
  const colors = useColors();
  const isDark = useIsDark();
  const insets = useSafeAreaInsets();

  // Fetch catches when screen is focused
  useFocusEffect(
    useCallback(() => {
      fetchCatches();
    }, [fetchCatches])
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCatches();
    setRefreshing(false);
  }, [fetchCatches]);

  const formatDate = useCallback((timestamp: number | null) => {
    if (!timestamp) return 'Unknown';
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const handleCatchPress = useCallback((catchId: string) => {
    router.push(`/catch/${catchId}`);
  }, []);

  const handleDeleteCatch = useCallback(async (catchId: string) => {
    await deleteCatch(catchId);
  }, [deleteCatch]);

  const handleApplyFilters = useCallback((newFilters: FilterOptions) => {
    setFilters(newFilters);
  }, []);

  // Filter catches based on current filters
  const filteredCatches = useMemo(() => {
    let result = [...catches];

    // Apply species filter
    if (filters.species) {
      result = result.filter((c) => c.species === filters.species);
    }

    // Apply date range filter
    if (filters.dateRange !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const monthAgo = new Date(today);
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      const yearAgo = new Date(today);
      yearAgo.setFullYear(yearAgo.getFullYear() - 1);

      result = result.filter((c) => {
        if (!c.createdAt) return false;
        const catchDate = new Date(c.createdAt);

        switch (filters.dateRange) {
          case 'today':
            return catchDate >= today;
          case 'week':
            return catchDate >= weekAgo;
          case 'month':
            return catchDate >= monthAgo;
          case 'year':
            return catchDate >= yearAgo;
          default:
            return true;
        }
      });
    }

    return result;
  }, [catches, filters]);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return filters.species !== null || filters.dateRange !== 'all';
  }, [filters]);

  const getFilterCount = useCallback(() => {
    let count = 0;
    if (filters.species) count++;
    if (filters.dateRange !== 'all') count++;
    return count;
  }, [filters]);

  const renderCatchItem = useCallback(
    ({ item }: { item: typeof filteredCatches[0] }) => (
      <SwipeableCatchRow
        catchData={item}
        onPress={() => handleCatchPress(item.id)}
        onDelete={() => handleDeleteCatch(item.id)}
      >
        <View style={styles.catchContent}>
          <View style={styles.catchHeader}>
            <Ionicons name="location" size={16} color={colors.textSecondary} />
            <Text style={[styles.catchLocation, { color: colors.textSecondary }]}>
              {item.latitude.toFixed(4)}, {item.longitude.toFixed(4)}
            </Text>
            <View
              style={[
                styles.weatherBadge,
                item.pendingWeatherFetch && styles.pendingBadge,
                { backgroundColor: item.pendingWeatherFetch ? colors.warning + '20' : colors.success + '20' },
              ]}
            >
              <Text
                style={[
                  styles.weatherBadgeText,
                  { color: item.pendingWeatherFetch ? colors.warning : colors.success },
                ]}
              >
                {item.pendingWeatherFetch ? '⏳' : '✓'}
              </Text>
            </View>
          </View>

          <Text style={[styles.catchDate, { color: colors.text }]}>
            {formatDate(item.createdAt?.getTime() ?? null)}
          </Text>

          {item.weatherCondition && (
            <Text style={[styles.catchWeather, { color: colors.textSecondary }]}>
              🌡️ {item.temperature}°C • {item.weatherCondition}
            </Text>
          )}

          {item.species && (
            <View style={styles.catchSpeciesRow}>
              <View style={styles.speciesIconContainer}>
                <Ionicons name="fish" size={16} color={colors.primary} />
              </View>
              <Text style={[styles.catchSpecies, { color: colors.text }]}>
                {item.species}
              </Text>
              {item.weight && (
                <Text style={[styles.catchWeight, { color: colors.textSecondary }]}>
                  • {item.weight} {item.weightUnit}
                </Text>
              )}
            </View>
          )}

          {item.photoUri && (
            <View style={styles.photoIndicator}>
              <Ionicons name="camera" size={14} color={colors.textTertiary} />
              <Text style={[styles.photoText, { color: colors.textTertiary }]}>Photo</Text>
            </View>
          )}
        </View>
      </SwipeableCatchRow>
    ),
    [colors, formatDate, handleCatchPress, handleDeleteCatch]
  );

  const renderEmptyList = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <Ionicons name="fish" size={64} color={colors.textTertiary} />
        <Text style={[styles.emptyTitle, { color: colors.text }]}>
          {hasActiveFilters ? 'No matching catches' : 'No catches yet'}
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
          {hasActiveFilters
            ? 'Try adjusting your filters'
            : 'Start fishing and tap the Fish On! button'}
        </Text>
        {hasActiveFilters && (
          <TouchableOpacity
            style={[styles.clearFiltersButton, { backgroundColor: colors.primary }]}
            onPress={() => setFilters({ species: null, dateRange: 'all' })}
            activeOpacity={0.7}
          >
            <Text style={[styles.clearFiltersText, { color: colors.onPrimary }]}>
              Clear Filters
            </Text>
          </TouchableOpacity>
        )}
      </View>
    ),
    [colors, hasActiveFilters]
  );

  const renderFilterBadge = useCallback(() => {
    if (!hasActiveFilters) return null;
    return (
      <View style={[styles.filterBadge, { backgroundColor: colors.primary }]}>
        <Text style={[styles.filterBadgeText, { color: colors.onPrimary }]}>
          {getFilterCount()}
        </Text>
      </View>
    );
  }, [hasActiveFilters, colors, getFilterCount]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, paddingTop: insets.top }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.title, { color: colors.text }]}>Catch Log</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {filteredCatches.length} of {catches.length} catches
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={() => setFilterModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons
            name="options"
            size={22}
            color={hasActiveFilters ? colors.primary : colors.textSecondary}
          />
          {renderFilterBadge()}
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      {hasActiveFilters && (
        <View style={[styles.filterChipsContainer, { backgroundColor: colors.surfaceSecondary }]}>
          <ScrollableFilterChips
            filters={filters}
            onRemoveSpecies={() => setFilters((prev) => ({ ...prev, species: null }))}
            onRemoveDateRange={() => setFilters((prev) => ({ ...prev, dateRange: 'all' }))}
            colors={colors}
          />
        </View>
      )}

      {/* Content */}
      {loading && !refreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filteredCatches}
          renderItem={renderCatchItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
          ListEmptyComponent={renderEmptyList}
          onRefresh={handleRefresh}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        onApplyFilters={handleApplyFilters}
        currentFilters={filters}
      />
    </View>
  );
}

// Helper component for filter chips
function ScrollableFilterChips({
  filters,
  onRemoveSpecies,
  onRemoveDateRange,
  colors,
}: {
  filters: FilterOptions;
  onRemoveSpecies: () => void;
  onRemoveDateRange: () => void;
  colors: any;
}) {
  const chips = useMemo(() => {
    const result: { label: string; onRemove: () => void }[] = [];
    if (filters.species) {
      result.push({ label: `Species: ${filters.species}`, onRemove: onRemoveSpecies });
    }
    if (filters.dateRange !== 'all') {
      const labels: Record<string, string> = {
        today: 'Today',
        week: 'This Week',
        month: 'This Month',
        year: 'This Year',
      };
      result.push({ label: labels[filters.dateRange], onRemove: onRemoveDateRange });
    }
    return result;
  }, [filters, onRemoveSpecies, onRemoveDateRange]);

  if (chips.length === 0) return null;

  return (
    <FlatList
      data={chips}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={(_, index) => index.toString()}
      renderItem={({ item }) => (
        <TouchableOpacity
          style={[styles.filterChip, { backgroundColor: colors.surface }]}
          onPress={item.onRemove}
          activeOpacity={0.7}
        >
          <Text style={[styles.filterChipText, { color: colors.text }]}>{item.label}</Text>
          <Ionicons name="close" size={14} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      contentContainerStyle={styles.filterChipsContent}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerLeft: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  filterChipsContainer: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  filterChipsContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    padding: 16,
  },
  catchContent: {
    padding: 16,
  },
  catchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  catchLocation: {
    flex: 1,
    fontSize: 12,
    marginLeft: 4,
  },
  weatherBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  weatherBadgeText: {
    fontSize: 12,
  },
  pendingBadge: {},
  catchDate: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  catchWeather: {
    fontSize: 14,
    marginBottom: 4,
  },
  catchSpeciesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  speciesIconContainer: {
    marginRight: 6,
  },
  catchSpecies: {
    fontSize: 14,
    fontWeight: '500',
  },
  catchWeight: {
    fontSize: 14,
    marginLeft: 4,
  },
  photoIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  photoText: {
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  clearFiltersButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  clearFiltersText: {
    fontSize: 14,
    fontWeight: '600',
  },
});

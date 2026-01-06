import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpeciesData, getAllSpecies } from '../data/species';
import { useColors } from '../context/ThemeContext';

export interface FilterOptions {
  species: string | null;
  dateRange: 'all' | 'today' | 'week' | 'month' | 'year';
}

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApplyFilters: (filters: FilterOptions) => void;
  currentFilters: FilterOptions;
}

const DATE_RANGE_OPTIONS = [
  { key: 'all', label: 'All Time', icon: 'calendar-outline' },
  { key: 'today', label: 'Today', icon: 'today-outline' },
  { key: 'week', label: 'This Week', icon: 'calendar-week-outline' },
  { key: 'month', label: 'This Month', icon: 'calendar-outline' },
  { key: 'year', label: 'This Year', icon: 'calendar-outline' },
] as const;

export function FilterModal({
  visible,
  onClose,
  onApplyFilters,
  currentFilters,
}: FilterModalProps) {
  const colors = useColors();
  const [filters, setFilters] = useState<FilterOptions>(currentFilters);
  const [searchQuery, setSearchQuery] = useState('');

  const allSpecies = useMemo(() => getAllSpecies(), []);

  const filteredSpecies = useMemo(() => {
    if (searchQuery.length < 2) {
      return allSpecies;
    }
    return allSpecies.filter(
      (s) =>
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.commonNames.some((n) => n.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [allSpecies, searchQuery]);

  const handleApply = useCallback(() => {
    onApplyFilters(filters);
    onClose();
  }, [filters, onApplyFilters, onClose]);

  const handleReset = useCallback(() => {
    setFilters({ species: null, dateRange: 'all' });
  }, []);

  const handleSpeciesSelect = useCallback((speciesName: string) => {
    setFilters((prev) => ({
      ...prev,
      species: prev.species === speciesName ? null : speciesName,
    }));
  }, []);

  const handleDateRangeSelect = useCallback(
    (range: FilterOptions['dateRange']) => {
      setFilters((prev) => ({
        ...prev,
        dateRange: prev.dateRange === range ? 'all' : range,
      }));
    },
    []
  );

  const renderSpeciesItem = useCallback(
    ({ item }: { item: SpeciesData }) => {
      const isSelected = filters.species === item.name;
      return (
        <TouchableOpacity
          style={[
            styles.speciesItem,
            { borderBottomColor: colors.borderLight },
            isSelected && { backgroundColor: colors.primaryLight + '20' },
          ]}
          onPress={() => handleSpeciesSelect(item.name)}
          activeOpacity={0.7}
        >
          <View style={styles.speciesInfo}>
            <Text style={[styles.speciesName, { color: colors.text }]}>
              {item.name}
            </Text>
            {item.commonNames.length > 0 && (
              <Text style={[styles.speciesAlias, { color: colors.textSecondary }]} numberOfLines={1}>
                {item.commonNames.slice(0, 3).join(', ')}
              </Text>
            )}
          </View>
          {isSelected && (
            <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>
      );
    },
    [filters.species, handleSpeciesSelect, colors]
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={[styles.modalContent, { backgroundColor: colors.surface }]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Filter Catches
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Date Range Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              DATE RANGE
            </Text>
            <View style={styles.dateRangeGrid}>
              {DATE_RANGE_OPTIONS.map((option) => {
                const isSelected = filters.dateRange === option.key;
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.dateRangeChip,
                      {
                        backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleDateRangeSelect(option.key)}
                    activeOpacity={0.7}
                  >
                    <Ionicons
                      name={option.icon as any}
                      size={16}
                      color={isSelected ? colors.onPrimary : colors.textSecondary}
                      style={styles.chipIcon}
                    />
                    <Text
                      style={[
                        styles.chipText,
                        { color: isSelected ? colors.onPrimary : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Species Section */}
          <View style={[styles.section, { flex: 1 }]}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              SPECIES
            </Text>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons
                name="search"
                size={20}
                color={colors.textSecondary}
                style={styles.searchIcon}
              />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder="Search species..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>

            {/* Species List */}
            <FlatList
              data={filteredSpecies.slice(0, 50)}
              keyExtractor={(item) => item.id}
              renderItem={renderSpeciesItem}
              style={styles.speciesList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          </View>

          {/* Footer */}
          <View
            style={[
              styles.footer,
              { borderTopColor: colors.border, backgroundColor: colors.surface },
            ]}
          >
            <TouchableOpacity
              style={[
                styles.resetButton,
                { borderColor: colors.border },
              ]}
              onPress={handleReset}
              activeOpacity={0.7}
            >
              <Text style={[styles.resetText, { color: colors.textSecondary }]}>
                Reset
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.applyButton, { backgroundColor: colors.primary }]}
              onPress={handleApply}
              activeOpacity={0.7}
            >
              <Text style={[styles.applyText, { color: colors.onPrimary }]}>
                Apply Filters
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    height: '80%',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20, // Increased from 16
    borderBottomWidth: 1,
    minHeight: 64,
  },
  modalTitle: {
    fontSize: 20, // Increased from 18
    fontWeight: '600',
  },
  closeButton: {
    padding: 12, // Increased from 4
    marginRight: -8,
  },
  section: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  dateRangeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateRangeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // Increased from 12
    paddingVertical: 12, // Increased from 8
    borderRadius: 12, // Increased from 8
    borderWidth: 1,
    minHeight: 44,
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16, // Increased from 12
    marginBottom: 16, // Increased from 12
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 16, // Increased from 12
    fontSize: 16,
  },
  speciesList: {
    flex: 1,
  },
  speciesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // Increased from 12
    borderBottomWidth: 1,
    minHeight: 60,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: '500',
  },
  speciesAlias: {
    fontSize: 13,
    marginTop: 2,
  },
  footer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
  },
  resetText: {
    fontSize: 16,
    fontWeight: '600',
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    alignItems: 'center',
    borderRadius: 12,
  },
  applyText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

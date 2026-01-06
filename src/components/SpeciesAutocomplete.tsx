import { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SpeciesData, searchSpecies, getPopularSpecies, FISHING_SPECIES } from '../data/species';

interface SpeciesAutocompleteProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  showCategory?: boolean;
}

export function SpeciesAutocomplete({
  value,
  onValueChange,
  placeholder = 'Search species...',
  showCategory = true,
}: SpeciesAutocompleteProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState(value);

  const filteredSpecies = useMemo(() => {
    if (searchQuery.length < 2) {
      // Show popular species when query is short
      return getPopularSpecies().slice(0, 10);
    }
    return searchSpecies(searchQuery);
  }, [searchQuery]);

  const handleSelect = useCallback(
    (species: SpeciesData) => {
      onValueChange(species.name);
      setSearchQuery(species.name);
      setIsModalVisible(false);
    },
    [onValueChange]
  );

  const handleClear = useCallback(() => {
    onValueChange('');
    setSearchQuery('');
  }, [onValueChange]);

  const openModal = useCallback(() => {
    setSearchQuery(value);
    setIsModalVisible(true);
  }, [value]);

  const renderSpeciesItem = useCallback(
    ({ item }: { item: SpeciesData }) => (
      <TouchableOpacity
        style={styles.speciesItem}
        onPress={() => handleSelect(item)}
        activeOpacity={0.7}
      >
        <View style={styles.speciesInfo}>
          <Text style={styles.speciesName}>{item.name}</Text>
          {item.commonNames.length > 0 && (
            <Text style={styles.speciesAlias} numberOfLines={1}>
              {item.commonNames.slice(0, 3).join(', ')}
            </Text>
          )}
        </View>
        {showCategory && (
          <View
            style={[
              styles.categoryBadge,
              item.category === 'freshwater' && styles.categoryFreshwater,
              item.category === 'saltwater' && styles.categorySaltwater,
              item.category === 'both' && styles.categoryBoth,
            ]}
          >
            <Text style={styles.categoryText}>{item.category}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
      </TouchableOpacity>
    ),
    [handleSelect, showCategory]
  );

  const renderEmptyResults = useCallback(() => (
    <View style={styles.emptyContainer}>
      <Ionicons name="fish" size={48} color="#BDC3C7" />
      <Text style={styles.emptyText}>No species found</Text>
      <Text style={styles.emptySubtext}>Try a different search term</Text>
    </View>
  ), []);

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.inputContainer} onPress={openModal} activeOpacity={0.7}>
        <Ionicons name="search" size={20} color="#7F8C8D" style={styles.inputIcon} />
        <Text style={[styles.inputText, { color: value ? '#2C3E50' : '#BDC3C7' }]} numberOfLines={1}>
          {value || placeholder}
        </Text>
        {value ? (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#BDC3C7" />
          </TouchableOpacity>
        ) : (
          <Ionicons name="chevron-down" size={20} color="#BDC3C7" />
        )}
      </TouchableOpacity>

      <Modal
        visible={isModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsModalVisible(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Species</Text>
              <TouchableOpacity
                onPress={() => setIsModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#2C3E50" />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search species..."
                placeholderTextColor="#BDC3C7"
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 8 }}>
                  <Ionicons name="close-circle" size={20} color="#BDC3C7" />
                </TouchableOpacity>
              )}
            </View>

            {/* Results List */}
            <FlatList
              data={filteredSpecies}
              keyExtractor={(item) => item.id}
              renderItem={renderSpeciesItem}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={renderEmptyResults}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />

            {/* Quick Access */}
            {searchQuery.length < 2 && (
              <View style={styles.quickAccess}>
                <Text style={styles.quickAccessTitle}>All Species</Text>
                <View style={styles.quickAccessGrid}>
                  {FISHING_SPECIES.slice(0, 8).map((species) => (
                    <TouchableOpacity
                      key={species.id}
                      style={styles.quickAccessChip}
                      onPress={() => handleSelect(species)}
                    >
                      <Text style={styles.quickAccessChipText}>{species.name}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16, // Increased from 14
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  inputText: {
    flex: 1,
    fontSize: 16,
  },
  clearButton: {
    padding: 12, // Increased from 4
    marginRight: -8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 20, // Increased from 16
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: 64,
  },
  modalTitle: {
    fontSize: 20, // Increased from 18
    fontWeight: '600',
    color: '#2C3E50',
  },
  closeButton: {
    padding: 12, // Increased from 4
    marginRight: -8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 56,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#2C3E50',
    padding: 0,
  },
  listContent: {
    paddingHorizontal: 16,
  },
  speciesItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16, // Increased from 14
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    minHeight: 60,
  },
  speciesInfo: {
    flex: 1,
  },
  speciesName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2C3E50',
  },
  speciesAlias: {
    fontSize: 13,
    color: '#7F8C8D',
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryFreshwater: {
    backgroundColor: '#E8F5E9',
  },
  categorySaltwater: {
    backgroundColor: '#E3F2FD',
  },
  categoryBoth: {
    backgroundColor: '#FFF3E0',
  },
  categoryText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    color: '#7F8C8D',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7F8C8D',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 4,
  },
  quickAccess: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  quickAccessTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAccessChip: {
    backgroundColor: 'white',
    paddingHorizontal: 16, // Increased from 12
    paddingVertical: 12, // Increased from 8
    borderRadius: 12, // Increased from 8
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minHeight: 44,
    justifyContent: 'center',
  },
  quickAccessChipText: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
  },
});

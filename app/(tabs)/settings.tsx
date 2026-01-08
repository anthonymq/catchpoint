import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useTheme, useColors } from '../../src/context/ThemeContext';
import { ThemeMode } from '../../src/theme/colors';
import { useState } from 'react';
import { useCatchStore } from '../../src/stores/catchStore';
import { exportCatchesToCSV } from '../../src/services/export';

type SettingItemProps = {
  icon: string;
  title: string;
  subtitle?: string;
  rightElement?: React.ReactNode;
  onPress?: () => void;
};

function SettingItem({ icon, title, subtitle, rightElement, onPress }: SettingItemProps) {
  const colors = useColors();
  
  return (
    <TouchableOpacity
      style={[styles.settingItem, { backgroundColor: colors.surface }]}
      onPress={onPress}
      disabled={!onPress && !rightElement}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>
          )}
        </View>
      </View>
      {rightElement}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { themeMode, setThemeMode, weightUnit, setWeightUnit, lengthUnit, setLengthUnit } = useSettingsStore();
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isLoadingTestData, setIsLoadingTestData] = useState(false);
  const [isWiping, setIsWiping] = useState(false);
  const { catches, loadTestData, wipeAllData } = useCatchStore();

  const handleExport = async () => {
    if (catches.length === 0) {
      Alert.alert('No Data', 'You have no catches to export yet.');
      return;
    }

    setIsExporting(true);
    try {
      const result = await exportCatchesToCSV(catches);
      if (!result.success) {
        Alert.alert('Export Failed', result.error || 'Unknown error');
      }
    } catch (error) {
      Alert.alert('Export Failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLoadTestData = async () => {
    Alert.alert(
      'Load Test Data',
      'This will add 60 sample catches to your database. This is useful for testing the stats and map features.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Load',
          onPress: async () => {
            setIsLoadingTestData(true);
            try {
              const count = await loadTestData();
              Alert.alert('Success', `Loaded ${count} test catches!`);
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to load test data');
            } finally {
              setIsLoadingTestData(false);
            }
          },
        },
      ]
    );
  };

  const handleWipeData = async () => {
    if (catches.length === 0) {
      Alert.alert('No Data', 'There is no data to delete.');
      return;
    }

    Alert.alert(
      'Delete All Data',
      `Are you sure you want to delete all ${catches.length} catches? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: async () => {
            setIsWiping(true);
            try {
              await wipeAllData();
              Alert.alert('Success', 'All data has been deleted.');
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to delete data');
            } finally {
              setIsWiping(false);
            }
          },
        },
      ]
    );
  };

  const themeOptions: { label: string; value: ThemeMode }[] = [
    { label: 'System', value: 'system' },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView style={styles.scrollView} contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top }]}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>

        {/* Appearance Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
        
        <SettingItem
          icon="moon"
          title="Theme"
          subtitle={themeOptions.find(o => o.value === themeMode)?.label}
          onPress={() => setShowThemePicker(!showThemePicker)}
        />

        {showThemePicker && (
          <View style={[styles.pickerContainer, { backgroundColor: colors.surfaceSecondary }]}>
            {themeOptions.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.pickerItem,
                  themeMode === option.value && [styles.pickerItemSelected, { backgroundColor: colors.primaryLight + '20' }]
                ]}
                onPress={() => {
                  setThemeMode(option.value);
                  setShowThemePicker(false);
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  { color: themeMode === option.value ? colors.primary : colors.text }
                ]}>
                  {option.label}
                </Text>
                {themeMode === option.value && (
                  <Ionicons name="checkmark" size={20} color={colors.primary} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Units Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Units</Text>
        
        <View style={[styles.unitSection, { backgroundColor: colors.surface }]}>
          <View style={styles.unitRow}>
            <Text style={[styles.unitLabel, { color: colors.text }]}>Weight</Text>
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  weightUnit === 'kg' && [styles.unitOptionSelected, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setWeightUnit('kg')}
              >
                <Text style={[
                  styles.unitOptionText,
                  weightUnit === 'kg' && { color: 'white' }
                ]}>kg</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  weightUnit === 'lb' && [styles.unitOptionSelected, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setWeightUnit('lb')}
              >
                <Text style={[
                  styles.unitOptionText,
                  weightUnit === 'lb' && { color: 'white' }
                ]}>lb</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.unitDivider, { backgroundColor: colors.border }]} />

          <View style={styles.unitRow}>
            <Text style={[styles.unitLabel, { color: colors.text }]}>Length</Text>
            <View style={styles.unitToggle}>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  lengthUnit === 'cm' && [styles.unitOptionSelected, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setLengthUnit('cm')}
              >
                <Text style={[
                  styles.unitOptionText,
                  lengthUnit === 'cm' && { color: 'white' }
                ]}>cm</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.unitOption,
                  lengthUnit === 'in' && [styles.unitOptionSelected, { backgroundColor: colors.primary }]
                ]}
                onPress={() => setLengthUnit('in')}
              >
                <Text style={[
                  styles.unitOptionText,
                  lengthUnit === 'in' && { color: 'white' }
                ]}>in</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Data Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>
        
        <SettingItem
          icon="download-outline"
          title="Export to CSV"
          subtitle={`${catches.length} catches`}
          onPress={handleExport}
          rightElement={
            isExporting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
            )
          }
        />

        <SettingItem
          icon="flask-outline"
          title="Load Test Data"
          subtitle="Add 60 sample catches for testing"
          onPress={handleLoadTestData}
          rightElement={
            isLoadingTestData ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
            )
          }
        />

        <TouchableOpacity
          style={[styles.dangerButton, { backgroundColor: colors.surface }]}
          onPress={handleWipeData}
          disabled={isWiping || catches.length === 0}
          activeOpacity={0.7}
        >
          <View style={styles.settingLeft}>
            <Ionicons name="trash-outline" size={24} color={catches.length === 0 ? colors.textTertiary : colors.error} />
            <View style={styles.settingText}>
              <Text style={[styles.settingTitle, { color: catches.length === 0 ? colors.textTertiary : colors.error }]}>
                Delete All Data
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.textSecondary }]}>
                Remove all {catches.length} catches permanently
              </Text>
            </View>
          </View>
          {isWiping ? (
            <ActivityIndicator size="small" color={colors.error} />
          ) : (
            <Ionicons name="chevron-forward" size={20} color={catches.length === 0 ? colors.textTertiary : colors.error} />
          )}
        </TouchableOpacity>

        {/* About Section */}
        <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
        
        <SettingItem
          icon="information-circle"
          title="CatchPoint"
          subtitle="Version 1.0.0"
        />

        <SettingItem
          icon="fish"
          title="Fishing Log App"
          subtitle="Track your catches with GPS & weather"
        />

        {/* Spacer */}
        <View style={[styles.spacer, { height: insets.bottom + 20 }]} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20, // Increased from 16
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 16,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    marginLeft: 12,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  pickerContainer: {
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
  },
  pickerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  pickerItemSelected: {
    // Background set inline
  },
  pickerItemText: {
    fontSize: 16,
  },
  unitSection: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 8,
  },
  unitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  unitDivider: {
    height: 1,
    marginHorizontal: 16,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  unitToggle: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
  },
  unitOption: {
    paddingHorizontal: 20, // Increased from 16
    paddingVertical: 12, // Increased from 8
    borderRadius: 6,
    minHeight: 44, // Added minHeight
    justifyContent: 'center',
  },
  unitOptionSelected: {
    // Background set inline
  },
  unitOptionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
});

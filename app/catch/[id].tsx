import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCatchStore } from '../../src/stores/catchStore';
import { useSettingsStore } from '../../src/stores/settingsStore';
import { useColors } from '../../src/context/ThemeContext';
import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState, useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import type { Catch } from '../../src/db/schema';
import { SpeciesAutocomplete } from '../../src/components/SpeciesAutocomplete';
import { UnitToggle, NumericInput, FormTextInput, PhotoCaptureButton } from '../../src/components/FormInputs';
import { pickImage, takePhoto, savePhotoToLocal, deletePhoto } from '../../src/services/photo';

export default function CatchDetailsScreen() {
  const params = useLocalSearchParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0] || '';
  const { getCatchById, updateCatch } = useCatchStore();
  const { weightUnit, lengthUnit, setWeightUnit, setLengthUnit } = useSettingsStore();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const headerHeight = 60 + insets.top; // Approximate header height for offset

  const [catchData, setCatchData] = useState<Catch | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    species: '',
    weight: '',
    length: '',
    lure: '',
    notes: '',
    photoUri: '',
  });

  useEffect(() => {
    async function loadCatch() {
      if (!id) return;
      const data = await getCatchById(id);
      if (data) {
        setCatchData(data);
        setFormData({
          species: data.species || '',
          weight: data.weight ? String(data.weight) : '',
          length: data.length ? String(data.length) : '',
          lure: data.lure || '',
          notes: data.notes || '',
          photoUri: data.photoUri || '',
        });
        if (data.weightUnit) setWeightUnit(data.weightUnit as 'kg' | 'lb');
        if (data.lengthUnit) setLengthUnit(data.lengthUnit as 'cm' | 'in');
      }
      setLoading(false);
    }
    loadCatch();
  }, [id, getCatchById, setWeightUnit, setLengthUnit]);

  const formatDate = useCallback((timestamp: Date | null) => {
    if (!timestamp) return 'Unknown';
    return timestamp.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!catchData || !id) return;
    
    setSaving(true);
    try {
      const updates = {
        species: formData.species || null,
        weight: formData.weight ? parseFloat(formData.weight) : null,
        weightUnit,
        length: formData.length ? parseFloat(formData.length) : null,
        lengthUnit,
        lure: formData.lure || null,
        notes: formData.notes || null,
        photoUri: formData.photoUri || null,
        isDraft: !(formData.species || formData.weight || formData.length || formData.notes),
      };

      await updateCatch(id, updates);
      setCatchData({ ...catchData, ...updates });
      setIsEditing(false);
      
      // Show success feedback
      Alert.alert('Success', 'Catch details saved successfully');
    } catch (error) {
      console.error('[CatchDetails] Failed to save:', error);
      Alert.alert('Error', 'Failed to save catch details');
    } finally {
      setSaving(false);
    }
  }, [catchData, id, formData, weightUnit, lengthUnit, updateCatch]);

  const handleCancel = useCallback(() => {
    if (catchData) {
      setFormData({
        species: catchData.species || '',
        weight: catchData.weight ? String(catchData.weight) : '',
        length: catchData.length ? String(catchData.length) : '',
        lure: catchData.lure || '',
        notes: catchData.notes || '',
        photoUri: catchData.photoUri || '',
      });
    }
    setIsEditing(false);
  }, [catchData]);

  const handlePhotoCapture = useCallback(async () => {
    Alert.alert(
      'Add Photo',
      'Choose a method',
      [
        { text: 'Take Photo', onPress: async () => {
          const result = await takePhoto();
          if (result) {
            const localUri = await savePhotoToLocal(result.uri, id as string);
            if (localUri) {
              setFormData(prev => ({ ...prev, photoUri: localUri }));
            }
          }
        }},
        { text: 'Choose from Library', onPress: async () => {
          const result = await pickImage();
          if (result) {
            const localUri = await savePhotoToLocal(result.uri, id as string);
            if (localUri) {
              setFormData(prev => ({ ...prev, photoUri: localUri }));
            }
          }
        }},
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, [id]);

  const handlePhotoRemove = useCallback(async () => {
    if (formData.photoUri) {
      await deletePhoto(formData.photoUri);
      setFormData(prev => ({ ...prev, photoUri: '' }));
    }
  }, [formData.photoUri]);

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!catchData) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Catch Details</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={colors.error} />
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>Catch not found</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          {isEditing ? 'Edit Catch' : 'Catch Details'}
        </Text>
        {isEditing ? (
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
              <Text style={[styles.headerButtonText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.headerButton, styles.saveButton]}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color={colors.onPrimary} />
              ) : (
                <Text style={[styles.headerButtonText, { color: colors.onPrimary }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButton}>
            <Ionicons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight : 0}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Date & Time */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="calendar" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>When</Text>
            </View>
            <Text style={[styles.sectionValue, { color: colors.text }]}>{formatDate(catchData.createdAt)}</Text>
          </View>

          {/* Location */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="location" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Where</Text>
            </View>
            <Text style={[styles.sectionValue, { color: colors.text }]}>
              {catchData.latitude.toFixed(6)}, {catchData.longitude.toFixed(6)}
            </Text>
          </View>

          {/* Weather (if available) */}
          {catchData.weatherCondition && (
            <View style={[styles.section, { backgroundColor: colors.surface }]}>
              <View style={styles.sectionHeader}>
                <Ionicons name="cloud" size={20} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Weather</Text>
              </View>
              <View style={styles.weatherRow}>
                <Text style={[styles.weatherItem, { color: colors.text }]}>
                  🌡️ {catchData.temperature}°{catchData.temperatureUnit}
                </Text>
                <Text style={[styles.weatherItem, { color: colors.text }]}>💧 {catchData.humidity}%</Text>
                <Text style={[styles.weatherItem, { color: colors.text }]}>💨 {catchData.windSpeed} m/s</Text>
              </View>
              {catchData.weatherCondition && (
                <Text style={[styles.weatherCondition, { color: colors.textSecondary }]}>
                  {catchData.weatherCondition}
                </Text>
              )}
            </View>
          )}

          {/* Species */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="fish" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Species</Text>
            </View>
            {isEditing ? (
              <SpeciesAutocomplete
                value={formData.species}
                onValueChange={(value) => setFormData(prev => ({ ...prev, species: value }))}
                placeholder="Select or search species..."
              />
            ) : (
              <Text style={[styles.sectionValue, { color: colors.text }]}>
                {catchData.species || 'Not specified'}
              </Text>
            )}
          </View>

          {/* Size */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="resize" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Size</Text>
            </View>
            {isEditing ? (
              <View style={styles.sizeInputsContainer}>
                <View style={styles.sizeInputRow}>
                  <View style={styles.sizeInput}>
                    <NumericInput
                      value={formData.weight}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, weight: value }))}
                      placeholder="0"
                      unit={weightUnit}
                    />
                  </View>
                  <UnitToggle
                    value={weightUnit}
                    onValueChange={(value) => setWeightUnit(value as 'kg' | 'lb')}
                    options={['kg', 'lb']}
                    size="large"
                  />
                </View>
                <View style={styles.sizeInputRow}>
                  <View style={styles.sizeInput}>
                    <NumericInput
                      value={formData.length}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, length: value }))}
                      placeholder="0"
                      unit={lengthUnit}
                    />
                  </View>
                  <UnitToggle
                    value={lengthUnit}
                    onValueChange={(value) => setLengthUnit(value as 'cm' | 'in')}
                    options={['cm', 'in']}
                    size="large"
                  />
                </View>
              </View>
            ) : (
              <View style={styles.sizeRow}>
                {catchData.weight && (
                  <View style={styles.sizeItem}>
                    <Text style={[styles.sizeLabel, { color: colors.textSecondary }]}>Weight</Text>
                    <Text style={[styles.sizeValue, { color: colors.text }]}>
                      {catchData.weight} {catchData.weightUnit}
                    </Text>
                  </View>
                )}
                {catchData.length && (
                  <View style={styles.sizeItem}>
                    <Text style={[styles.sizeLabel, { color: colors.textSecondary }]}>Length</Text>
                    <Text style={[styles.sizeValue, { color: colors.text }]}>
                      {catchData.length} {catchData.lengthUnit}
                    </Text>
                  </View>
                )}
                {!catchData.weight && !catchData.length && (
                  <Text style={[styles.sectionValue, { color: colors.textSecondary }]}>Not specified</Text>
                )}
              </View>
            )}
          </View>

          {/* Lure */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="bonfire" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Lure / Bait</Text>
            </View>
            {isEditing ? (
              <FormTextInput
                value={formData.lure}
                onValueChange={(value) => setFormData(prev => ({ ...prev, lure: value }))}
                placeholder="What were you using?"
              />
            ) : (
              <Text style={[styles.sectionValue, { color: colors.text }]}>
                {catchData.lure || 'Not specified'}
              </Text>
            )}
          </View>

          {/* Notes */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document-text" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Notes</Text>
            </View>
            {isEditing ? (
              <FormTextInput
                value={formData.notes}
                onValueChange={(value) => setFormData(prev => ({ ...prev, notes: value }))}
                placeholder="Any additional notes..."
                multiline
                maxLength={500}
              />
            ) : (
              <Text style={[styles.notesValue, { color: colors.text }]}>
                {catchData.notes || 'No notes'}
              </Text>
            )}
          </View>

          {/* Photo */}
          <View style={[styles.section, { backgroundColor: colors.surface }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="camera" size={20} color={colors.primary} />
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Photo</Text>
            </View>
            {isEditing ? (
              <PhotoCaptureButton
                photoUri={formData.photoUri}
                onCapture={handlePhotoCapture}
                onRemove={handlePhotoRemove}
              />
            ) : catchData.photoUri ? (
              <View style={[styles.photoPlaceholder, { backgroundColor: colors.backgroundSecondary }]}>
                <Ionicons name="image" size={48} color={colors.textTertiary} />
                <Text style={[styles.photoText, { color: colors.textSecondary }]}>Photo captured</Text>
              </View>
            ) : (
              <Text style={[styles.sectionValue, { color: colors.textSecondary }]}>No photo</Text>
            )}
          </View>

          {/* Add Details CTA - only in view mode when no details */}
          {!isEditing && !catchData.species && !catchData.weight && !catchData.notes && (
            <TouchableOpacity 
              style={[styles.addDetailsButton, { backgroundColor: colors.primary }]}
              onPress={() => setIsEditing(true)}
            >
              <Ionicons name="add-circle" size={24} color={colors.onPrimary} />
              <Text style={[styles.addDetailsText, { color: colors.onPrimary }]}>Add Details</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
    minHeight: 60,
  },
  backButton: {
    padding: 12,
    marginLeft: -8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginRight: 40,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 44,
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editButton: {
    padding: 12,
    marginRight: -8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    fontSize: 16,
    marginTop: 16,
  },
  section: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionValue: {
    fontSize: 16,
    marginLeft: 28,
  },
  weatherRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginLeft: 28,
    gap: 16,
  },
  weatherItem: {
    fontSize: 16,
  },
  weatherCondition: {
    marginTop: 4,
    marginLeft: 28,
  },
  sizeRow: {
    flexDirection: 'row',
    marginLeft: 28,
    gap: 32,
  },
  sizeInputsContainer: {
    gap: 16,
    marginLeft: 28,
  },
  sizeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  sizeInput: {
    flex: 1,
    // maxWidth removed to allow full width
  },
  sizeItem: {
    flexDirection: 'column',
  },
  sizeLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  sizeValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  notesValue: {
    fontSize: 16,
    marginLeft: 28,
    lineHeight: 24,
  },
  photoPlaceholder: {
    marginLeft: 28,
    height: 150,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
  },
  photoText: {
    fontSize: 14,
    marginTop: 8,
  },
  addDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  addDetailsText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

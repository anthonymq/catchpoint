import { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface UnitToggleProps {
  value: string;
  onValueChange: (value: string) => void;
  options: readonly string[];
  label?: string;
  size?: 'small' | 'medium' | 'large';
}

export function UnitToggle({
  value,
  onValueChange,
  options,
  label,
  size = 'medium',
}: UnitToggleProps) {
  const handleToggle = useCallback(() => {
    const currentIndex = options.indexOf(value);
    const nextIndex = (currentIndex + 1) % options.length;
    onValueChange(options[nextIndex]);
  }, [value, options, onValueChange]);

  const getFontSize = () => {
    switch (size) {
      case 'small':
        return 12;
      case 'large':
        return 18;
      default:
        return 14;
    }
  };

  const getPadding = () => {
    switch (size) {
      case 'small':
        return 6;
      case 'large':
        return 14;
      default:
        return 10;
    }
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={[
          styles.toggleContainer,
          { paddingVertical: getPadding(), paddingHorizontal: getPadding() + 8 },
        ]}
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <Text style={[styles.unitText, { fontSize: getFontSize() }]}>
          {options[0]}
        </Text>
        <Ionicons
          name="swap-horizontal"
          size={getFontSize() + 2}
          color="#FF6B35"
          style={styles.icon}
        />
        <Text style={[styles.unitText, { fontSize: getFontSize() }]}>
          {options[1]}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

interface NumericInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  unit: string;
  keyboardType?: 'numeric' | 'decimal-pad';
  maxLength?: number;
}

export function NumericInput({
  value,
  onValueChange,
  placeholder = '0',
  unit,
  keyboardType = 'decimal-pad',
  maxLength,
}: NumericInputProps) {
  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#BDC3C7"
        value={value}
        onChangeText={onValueChange}
        keyboardType={keyboardType}
        maxLength={maxLength}
      />
      <Text style={styles.unitLabel}>{unit}</Text>
    </View>
  );
}

interface TextInputProps {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  multiline?: boolean;
  maxLength?: number;
}

export function FormTextInput({
  value,
  onValueChange,
  placeholder = 'Enter text...',
  label,
  multiline = false,
  maxLength,
}: TextInputProps) {
  return (
    <View style={styles.formInputContainer}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[styles.formInput, multiline && styles.formInputMultiline]}
        placeholder={placeholder}
        placeholderTextColor="#BDC3C7"
        value={value}
        onChangeText={onValueChange}
        multiline={multiline}
        maxLength={maxLength}
        textAlignVertical={multiline ? 'top' : 'center'}
      />
    </View>
  );
}

interface PhotoCaptureProps {
  photoUri: string | null;
  onCapture: () => void;
  onRemove: () => void;
}

export function PhotoCaptureButton({
  photoUri,
  onCapture,
  onRemove,
}: PhotoCaptureProps) {
  if (photoUri) {
    return (
      <View style={styles.photoContainer}>
        <TouchableOpacity
          style={styles.photoButton}
          onPress={onCapture}
          activeOpacity={0.7}
        >
          <Ionicons name="camera-reverse" size={24} color="#FF6B35" />
          <Text style={styles.photoButtonText}>Retake Photo</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.photoButton, styles.removeButton]}
          onPress={onRemove}
          activeOpacity={0.7}
        >
          <Ionicons name="trash" size={20} color="#E74C3C" />
          <Text style={[styles.photoButtonText, styles.removeText]}>Remove</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.photoButton} onPress={onCapture} activeOpacity={0.7}>
      <Ionicons name="camera" size={32} color="#FF6B35" />
      <Text style={styles.photoButtonText}>Add Photo</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7F8C8D',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  unitText: {
    fontWeight: '600',
    color: '#2C3E50',
  },
  icon: {
    marginHorizontal: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    flex: 1,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#2C3E50',
    paddingVertical: 14,
  },
  unitLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 8,
  },
  formInputContainer: {
    width: '100%',
  },
  formInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#2C3E50',
    height: 52,
  },
  formInputMultiline: {
    height: 120,
    textAlign: 'left',
  },
  photoContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    borderStyle: 'dashed',
    paddingVertical: 20,
    paddingHorizontal: 24,
    flex: 1,
  },
  photoButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF6B35',
    marginLeft: 8,
  },
  removeButton: {
    borderColor: '#E74C3C',
    backgroundColor: '#FDF2F2',
    flex: 0,
    paddingHorizontal: 16,
  },
  removeText: {
    color: '#E74C3C',
  },
});

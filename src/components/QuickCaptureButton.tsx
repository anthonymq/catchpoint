import { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

interface QuickCaptureButtonProps {
  onPress: () => Promise<void>;
  disabled?: boolean;
  loading?: boolean;
  success?: boolean;
}

export function QuickCaptureButton({
  onPress,
  disabled = false,
  loading = false,
  success = false,
}: QuickCaptureButtonProps) {
  const [isPressed, setIsPressed] = useState(false);
  const scaleValue = new Animated.Value(1);

  const handlePress = useCallback(async () => {
    if (disabled || loading) return;

    // Animate press
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Trigger haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Call the capture handler
    await onPress();
  }, [onPress, disabled, loading]);

  const buttonStyle = [
    styles.button,
    disabled && styles.buttonDisabled,
    loading && styles.buttonLoading,
    success && styles.buttonSuccess,
  ];

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.animatedContainer, { transform: [{ scale: scaleValue }] }]}>
        <Pressable
          onPress={handlePress}
          onPressIn={() => setIsPressed(true)}
          onPressOut={() => setIsPressed(false)}
          disabled={disabled || loading}
          style={({ pressed }) => [
            buttonStyle,
            pressed && styles.buttonPressed,
          ]}
        >
          {loading ? (
            <Ionicons name="hourglass" size={48} color="white" />
          ) : success ? (
            <Ionicons name="checkmark" size={48} color="white" />
          ) : (
            <>
              <Ionicons name="fish" size={48} color="white" style={styles.icon} />
              <Text style={styles.label}>FISH ON!</Text>
            </>
          )}
        </Pressable>
      </Animated.View>
      
      {loading && (
        <View style={styles.loadingOverlay}>
          <Text style={styles.loadingText}>Getting location...</Text>
        </View>
      )}
      
      {success && (
        <View style={styles.successOverlay}>
          <Text style={styles.successText}>Catch saved!</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedContainer: {
    borderRadius: 80,
  },
  button: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 4,
    borderColor: 'white',
  },
  buttonPressed: {
    transform: [{ scale: 0.95 }],
  },
  buttonDisabled: {
    backgroundColor: '#999',
    shadowOpacity: 0.2,
  },
  buttonLoading: {
    backgroundColor: '#E67E22',
  },
  buttonSuccess: {
    backgroundColor: '#27AE60',
  },
  icon: {
    marginBottom: 4,
  },
  label: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  loadingOverlay: {
    marginTop: 16,
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  successOverlay: {
    marginTop: 16,
  },
  successText: {
    color: '#27AE60',
    fontSize: 16,
    fontWeight: '600',
  },
});

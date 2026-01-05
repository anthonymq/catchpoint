import React, { useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColors } from '../context/ThemeContext';
import { Catch } from '../db/schema';

interface SwipeableCatchRowProps {
  catchData: Catch;
  onPress: () => void;
  onDelete: () => Promise<void>;
  children: React.ReactNode;
}

const DELETE_ACTION_WIDTH = 80;
const SWIPE_THRESHOLD = -100; // Negative because we're swiping left

function RightAction({
  onPress,
}: {
  onPress: () => void;
}) {
  return (
    <View style={styles.rightAction}>
      <TouchableOpacity
        style={styles.deleteContainer}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Ionicons name="trash" size={24} color="#FFFFFF" />
        <Text style={styles.deleteText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

export function SwipeableCatchRow({
  catchData,
  onPress,
  onDelete,
  children,
}: SwipeableCatchRowProps) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;

  const handleDelete = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Catch',
      'Are you sure you want to delete this catch? This action cannot be undone.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            closeSwipe();
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            closeSwipe();
            await onDelete();
          },
        },
      ]
    );
  }, [onDelete]);

  const closeSwipe = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateX]);

  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond to horizontal gestures
        return Math.abs(gestureState.dx) > Math.abs(gestureState.dy);
      },
      onPanResponderGrant: (_, gestureState) => {
        // Stop any ongoing animations
        translateX.stopAnimation((value) => {
          translateX.setOffset(value);
          translateX.setValue(0);
        });
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping left (negative dx)
        const newTranslateX = gestureState.dx;
        const clampedTranslateX = Math.min(newTranslateX, 0);

        // Limit the maximum swipe distance
        const maxSwipe = -DELETE_ACTION_WIDTH;
        const finalTranslateX = Math.max(clampedTranslateX, maxSwipe);

        translateX.setValue(finalTranslateX);
      },
      onPanResponderRelease: (_, gestureState) => {
        // Flatten the offset
        translateX.flattenOffset();

        // Determine if swipe should snap to open or close
        const currentValue = translateX._value;
        const shouldOpen = currentValue < SWIPE_THRESHOLD;

        if (shouldOpen) {
          // Snap to open (show delete button)
          Animated.spring(translateX, {
            toValue: -DELETE_ACTION_WIDTH,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        } else {
          // Snap closed
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 0,
          }).start();
        }
      },
      onPanResponderTerminate: () => {
        // Gesture was terminated (e.g., by another component taking control)
        translateX.flattenOffset();
        closeSwipe();
      },
    })
  ).current;

  return (
    <View style={styles.container}>
      <RightAction onPress={handleDelete} />
      <Animated.View
        style={[styles.contentAnimated, { transform: [{ translateX: translateX }] }]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.contentContainer, { backgroundColor: colors.surface }]}
          onPress={onPress}
          activeOpacity={0.7}
        >
          {children}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    overflow: 'hidden',
    borderRadius: 12,
  },
  contentAnimated: {
    flex: 1,
  },
  contentContainer: {
    borderRadius: 12,
  },
  rightAction: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#E74C3C',
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    width: 80,
  },
  deleteContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: '100%',
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 4,
  },
});

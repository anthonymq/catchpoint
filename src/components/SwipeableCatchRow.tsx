import React, { useRef, useCallback, useEffect, useMemo } from 'react';
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
const SWIPE_THRESHOLD = -60; // Show delete button
const DELETE_THRESHOLD = -150; // Auto-delete threshold

export function SwipeableCatchRow({
  catchData,
  onPress,
  onDelete,
  children,
}: SwipeableCatchRowProps) {
  const colors = useColors();
  const translateX = useRef(new Animated.Value(0)).current;
  const currentTranslateX = useRef(0);

  // Track current translateX for gesture handling
  useEffect(() => {
    const listenerId = translateX.addListener(({ value }) => {
      currentTranslateX.current = value;
    });
    return () => translateX.removeListener(listenerId);
  }, [translateX]);

  // Interpolate background color directly from translateX
  const deleteBackgroundColor = translateX.interpolate({
    inputRange: [DELETE_THRESHOLD, SWIPE_THRESHOLD, 0],
    outputRange: ['#A93226', '#C0392B', '#E74C3C'],
  });

  const closeSwipe = useCallback(() => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  }, [translateX]);

  const confirmDelete = useCallback(async () => {
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
            try {
              closeSwipe();
              await onDelete();
            } catch (error) {
              console.error('[SwipeableCatchRow] Delete failed:', error);
              Alert.alert(
                'Error',
                'Failed to delete catch. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  }, [onDelete, closeSwipe]);

  const handleDelete = useCallback(async () => {
    try {
      await onDelete();
    } catch (error) {
      console.error('[SwipeableCatchRow] Delete failed:', error);
      Alert.alert(
        'Error',
        'Failed to delete catch. Please try again.',
        [{ text: 'OK' }]
      );
    }
  }, [onDelete]);

  const panResponder = useMemo(
    () =>
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
          // Allow swiping in both directions with offset applied
          const newTranslateX = gestureState.dx;

          // Allow swiping beyond delete button to trigger auto-delete (left swipe)
          const maxSwipe = DELETE_THRESHOLD - 50; // Allow a bit more for smooth gesture
          const finalTranslateX = Math.max(newTranslateX, maxSwipe);

          translateX.setValue(finalTranslateX);
        },
        onPanResponderRelease: (_, gestureState) => {
          // Flatten the offset
          translateX.flattenOffset();

          // Determine if swipe should snap to open or close
          const currentValue = currentTranslateX.current;
          const velocity = gestureState.vx;

          // Check if user swiped far enough or fast enough to trigger delete
          if (currentValue < DELETE_THRESHOLD || (currentValue < SWIPE_THRESHOLD && velocity < -0.5)) {
            // Trigger delete with haptic feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            
            // Animate off screen
            Animated.timing(translateX, {
              toValue: -400,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              // Trigger delete after animation
              confirmDelete();
            });
          } else if (currentValue < SWIPE_THRESHOLD) {
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
      }),
    [translateX, closeSwipe, confirmDelete]
  );

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.rightActionTouchable}
        onPress={confirmDelete}
        activeOpacity={0.9}
      >
        <Animated.View
          style={[
            styles.rightAction,
            {
              backgroundColor: deleteBackgroundColor,
            },
          ]}
        >
          <View style={styles.deleteContent}>
            <Ionicons name="trash" size={24} color="#FFFFFF" />
            <Text style={styles.deleteText}>Delete</Text>
          </View>
        </Animated.View>
      </TouchableOpacity>
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
    marginBottom: 12,
  },
  contentAnimated: {
    flex: 1,
  },
  contentContainer: {
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  rightActionTouchable: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 200,
  },
  rightAction: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    paddingRight: 20,
  },
  deleteContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 4,
  },
});

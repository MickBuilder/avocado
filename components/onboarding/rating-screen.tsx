import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  FadeIn,
  FadeInDown,
  withSpring,
  withSequence,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { useEffect, useState } from 'react';
import { usePostHog } from 'posthog-react-native';

// Safely import StoreReview - handle case where native module isn't available
let StoreReview: typeof import('expo-store-review') | null = null;
try {
  StoreReview = require('expo-store-review');
} catch (e) {
  console.warn('expo-store-review not available:', e);
}

export function RatingScreen() {
  const [rating, setRating] = useState(0);
  const star1 = useSharedValue(0);
  const star2 = useSharedValue(0);
  const star3 = useSharedValue(0);
  const star4 = useSharedValue(0);
  const star5 = useSharedValue(0);
  const animatedStars = [star1, star2, star3, star4, star5];
  const posthog = usePostHog();

  // Track rating screen viewed
  useEffect(() => {
    posthog?.capture('onboarding_rating_screen_viewed', {
      timestamp: new Date().toISOString(),
    });
  }, [posthog]);

  useEffect(() => {
    if (StoreReview) {
      setTimeout(() => {
        StoreReview?.requestReview().catch((error) => {
          console.warn('Failed to request store review:', error);
          posthog?.capture('store_review_request_failed', {
            error: error instanceof Error ? error.message : String(error),
          });
        });
      }, 1500);
    }
  }, [posthog]);

  // Trigger animation on mount
  useEffect(() => {
    const delay = 500; // Wait for initial animations to complete
    const animationInterval = 200; // Time between each star animation
    const timeouts: NodeJS.Timeout[] = [];

    const mainTimeout = setTimeout(() => {
      animatedStars.forEach((star, index) => {
        const timeoutId = setTimeout(() => {
          star.value = withSequence(withSpring(1.2, { damping: 8 }), withSpring(1, { damping: 8 }));
          const newRating = index + 1;
          setRating(newRating);
          
          // Track rating given
          posthog?.capture('onboarding_rating_given', {
            rating: newRating,
            max_rating: 5,
          });
        }, index * animationInterval);
        timeouts.push(timeoutId);
      });
    }, delay);

    return () => {
      clearTimeout(mainTimeout);
      timeouts.forEach(clearTimeout);
      // Reset animated values to prevent warnings
      animatedStars.forEach((star) => {
        star.value = 1;
      });
    };
  }, []);

  return (
    <View className="flex-1 justify-center items-center p-8">
      <Animated.Text entering={FadeIn.duration(600)} className="text-3xl font-bold text-center mb-10" style={{ color: '#2C3F22' }}>
        Give us a rating
      </Animated.Text>
      <Animated.View entering={FadeInDown.duration(600).delay(300)} className="flex-row justify-center items-center gap-2 mb-10">
        {[1, 2, 3, 4, 5].map((star, index) => {
          const animatedStyle = useAnimatedStyle(() => {
            return {
              transform: [{ scale: animatedStars[index].value * 0.3 + 1 }],
            };
          });

          return (
            <Animated.View key={star} entering={FadeInDown.duration(600).delay(300 + index * 100)}>
              <Animated.View className="p-2" style={animatedStyle}>
                <Ionicons
                  name={rating >= star ? 'star' : 'star-outline'}
                  size={40}
                  color={rating >= star ? '#FF9800' : '#D1D1D1'}
                />
              </Animated.View>
            </Animated.View>
          );
        })}
      </Animated.View>
      <Animated.Text entering={FadeInDown.duration(600).delay(600)} className="text-lg text-center leading-6" style={{ color: '#518E22' }}>
        Made for people like you
      </Animated.Text>
    </View>
  );
}


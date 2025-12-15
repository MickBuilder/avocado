import { Text, View } from 'react-native';
import Animated, { FadeIn, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useEffect, useState, useRef } from 'react';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { safeHaptic } from '@/lib/haptics';
import { usePostHog } from 'posthog-react-native';

interface LoadingScreenProps {
  onTimeout: () => void;
  onAnimationComplete?: () => void;
}

const safeguards = [
  { id: 'toxins', label: 'Toxins' },
  { id: 'seed_oils', label: 'Seed oils' },
  { id: 'clean_swaps', label: 'Clean swaps' },
  { id: 'allergens', label: 'Allergens' },
  { id: 'label_scanner', label: 'Label scanner' },
];

const statusMessages = [
  { progress: 14, message: "Setting up your scanner..." },
  { progress: 40, message: "Building your clean swap database..." },
  { progress: 62, message: "Building your clean swap database..." },
  { progress: 85, message: "Finalizing your setup..." },
  { progress: 100, message: "Almost there..." },
];

export function LoadingScreen({ onTimeout, onAnimationComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [currentMessage, setCurrentMessage] = useState("Setting up your scanner...");
  const [activatedSafeguards, setActivatedSafeguards] = useState<string[]>([]);
  const progressWidth = useSharedValue(0);
  const activatedSafeguardsRef = useRef<string[]>([]);
  const posthog = usePostHog();
  const startTimeRef = useRef<number>(Date.now());

  // Track loading screen started
  useEffect(() => {
    posthog?.capture('onboarding_loading_started', {
      timestamp: new Date().toISOString(),
    });
    startTimeRef.current = Date.now();
  }, [posthog]);

  useEffect(() => {
    const duration = 4000; // 4 seconds total
    const steps = 100;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const newProgress = Math.min(currentStep, 100);
      setProgress(newProgress);
      progressWidth.value = withTiming(newProgress, { duration: interval });

      // Update status message based on progress
      const statusMessage = statusMessages.find(msg => newProgress >= msg.progress);
      if (statusMessage) {
        setCurrentMessage(statusMessage.message);
      }

      // Activate safeguards at different progress points with haptic feedback
      // Use ref to check if already activated to avoid re-renders
      if (newProgress >= 20 && !activatedSafeguardsRef.current.includes('toxins')) {
        safeHaptic.impact();
        activatedSafeguardsRef.current.push('toxins');
        setActivatedSafeguards([...activatedSafeguardsRef.current]);
        posthog?.capture('onboarding_safeguard_activated', {
          safeguard: 'toxins',
          progress: newProgress,
        });
      }
      if (newProgress >= 40 && !activatedSafeguardsRef.current.includes('seed_oils')) {
        safeHaptic.impact();
        activatedSafeguardsRef.current.push('seed_oils');
        setActivatedSafeguards([...activatedSafeguardsRef.current]);
        posthog?.capture('onboarding_safeguard_activated', {
          safeguard: 'seed_oils',
          progress: newProgress,
        });
      }
      if (newProgress >= 60 && !activatedSafeguardsRef.current.includes('clean_swaps')) {
        safeHaptic.impact();
        activatedSafeguardsRef.current.push('clean_swaps');
        setActivatedSafeguards([...activatedSafeguardsRef.current]);
        posthog?.capture('onboarding_safeguard_activated', {
          safeguard: 'clean_swaps',
          progress: newProgress,
        });
      }
      if (newProgress >= 80 && !activatedSafeguardsRef.current.includes('allergens')) {
        safeHaptic.impact();
        activatedSafeguardsRef.current.push('allergens');
        setActivatedSafeguards([...activatedSafeguardsRef.current]);
        posthog?.capture('onboarding_safeguard_activated', {
          safeguard: 'allergens',
          progress: newProgress,
        });
      }
      if (newProgress >= 95 && !activatedSafeguardsRef.current.includes('label_scanner')) {
        safeHaptic.impact();
        activatedSafeguardsRef.current.push('label_scanner');
        setActivatedSafeguards([...activatedSafeguardsRef.current]);
        posthog?.capture('onboarding_safeguard_activated', {
          safeguard: 'label_scanner',
          progress: newProgress,
        });
      }

      if (currentStep >= steps) {
        clearInterval(timer);
        const duration = Date.now() - startTimeRef.current;
        
        // Track loading completed
        posthog?.capture('onboarding_loading_completed', {
          duration_ms: duration,
          duration_seconds: Math.round(duration / 1000),
          final_progress: 100,
          activated_safeguards: activatedSafeguardsRef.current,
          safeguards_count: activatedSafeguardsRef.current.length,
        });
        
        // Wait a bit for final animations to complete, then notify parent
        setTimeout(() => {
          onAnimationComplete?.();
        }, 800);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onTimeout, progressWidth, posthog]);

  const progressBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  return (
    <Animated.View entering={FadeIn.duration(600)} className="flex-1 p-8" style={{ backgroundColor: '#F5F5F0' }}>
      <View className="flex-1 justify-center">
        {/* Percentage */}
        <Text className="text-7xl font-bold text-center mb-4" style={{ color: '#2C3F22' }}>
          {progress}%
        </Text>

        {/* Main message */}
        <Text className="text-lg text-center mb-8" style={{ color: '#2C3F22' }}>
          We're setting everything up for you
        </Text>

        {/* Progress bar */}
        <View className="h-2 bg-gray-200 rounded-full mb-8 overflow-hidden">
          <Animated.View style={[progressBarStyle, { height: '100%' }]}>
            <LinearGradient
              colors={['#97C536', '#FFD700']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ height: '100%', borderRadius: 999 }}
            />
          </Animated.View>
        </View>

        {/* Status message */}
        <Text className="text-base text-center mb-8" style={{ color: '#2C3F22' }}>
          {currentMessage}
        </Text>

        {/* Safeguards list */}
        <View className="mt-8">
          <Text className="text-lg font-bold mb-4" style={{ color: '#2C3F22' }}>
            Activating your safeguards:
          </Text>
          {safeguards.map((safeguard, index) => {
            const isActivated = activatedSafeguards.includes(safeguard.id);
            return (
              <View key={safeguard.id} className="flex-row items-center mb-2">
                <Text className="text-base ml-6" style={{ color: '#2C3F22' }}>
                  • {safeguard.label}
                </Text>
                {isActivated && (
                  <Animated.View
                    entering={FadeIn.duration(300)}
                    className="ml-2"
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#97C536" />
                  </Animated.View>
                )}
              </View>
            );
          })}
        </View>

      </View>
    </Animated.View>
  );
}


import { TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { safeHaptic } from '@/lib/haptics';

interface OnboardingProgressProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
}

export function OnboardingProgress({ currentStep, totalSteps, onBack }: OnboardingProgressProps) {
  const progress = (currentStep / totalSteps) * 100;

  return (
    <View className="flex-row items-center p-4 gap-4">
      <TouchableOpacity
        onPress={() => {
          safeHaptic.impact();
          onBack();
        }}
        className="p-2 rounded-full"
        style={{ backgroundColor: '#F1F3ED' }}
      >
        <Ionicons name="arrow-back" size={20} color="#2C3F22" />
      </TouchableOpacity>
      <View className="flex-1 h-1 rounded overflow-hidden" style={{ backgroundColor: '#F1F3ED' }}>
        <View className="h-full bg-brand-primary" style={{ width: `${progress}%` }} />
      </View>
    </View>
  );
}


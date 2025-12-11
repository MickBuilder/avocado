import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { safeHaptic } from '@/lib/haptics';
import { usePostHog } from 'posthog-react-native';
import { useEffect } from 'react';

interface SummaryScreenProps {
  answers: Record<number, string>;
  onContinue: () => void;
}

// Map team IDs to display info
const teamInfo: Record<string, { title: string; subtitle: string; avatar: string }> = {
  clean_living_girlie: {
    title: 'Clean-Living Girlie',
    subtitle: 'Managing 1 health concern',
    avatar: '👩‍🦰',
  },
  holistic_health_bro: {
    title: 'Holistic Health Bro',
    subtitle: 'Managing 1 health concern',
    avatar: '🧘‍♂️',
  },
  mama_bear_protector: {
    title: 'Mama Bear Protector',
    subtitle: 'Managing 1 health concern',
    avatar: '🐻',
  },
  wellness_warrior_dad: {
    title: 'Wellness Warrior Dad',
    subtitle: 'Managing 1 health concern',
    avatar: '🛡️',
  },
};


const superpowers = [
  {
    icon: 'swap-horizontal',
    title: 'Clean Swap Finder',
    description: 'Swaps kids will eat',
  },
  {
    icon: 'shield-checkmark',
    title: 'Truth Detector',
    description: 'Cuts through misleading labels',
  },
  {
    icon: 'flask',
    title: 'Toxin Alerts',
    description: 'Flags harmful chemicals',
  },
];

export function SummaryScreen({ answers, onContinue }: SummaryScreenProps) {
  // Get team selection from onboarding steps
  const onboardingSteps = require('./onboarding-steps').ONBOARDING_STEPS;
  
  // Map step indices to question IDs
  // answers are stored by currentStep (which includes info screens)
  // We need to find which step index corresponds to which question
  const getAnswerByQuestionId = (questionId: string): string | null => {
    let stepIndex = 1; // Start at 1 (0 is welcome screen)
    for (const step of onboardingSteps) {
      if (step.type === 'question' && step.id === questionId) {
        return answers[stepIndex] || null;
      }
      stepIndex++;
    }
    return null;
  };
  
  const teamAnswer = getAnswerByQuestionId('choose_team') || 'wellness_warrior_dad';
  const team = teamInfo[teamAnswer] || teamInfo.wellness_warrior_dad;
  
  // Get triggered ingredients based on answers
  const whyCleanerAnswer = getAnswerByQuestionId('why_cleaner');
  const additivesAnswer = getAnswerByQuestionId('additives');
  const triggered: string[] = [];
  
  if (whyCleanerAnswer === 'healthier_family') {
    triggered.push('behavioral issues');
  }
  
  if (additivesAnswer === 'artificial_additives') {
    triggered.push('artificial additives');
  } else if (additivesAnswer === 'seed_oils') {
    triggered.push('seed oils');
  } else if (additivesAnswer === 'heavy_metals') {
    triggered.push('heavy metals');
  } else if (additivesAnswer === 'all_additives') {
    triggered.push('all harmful additives');
  }
  
  const triggeredIngredients = triggered.length > 0 ? triggered : ['behavioral issues'];
  const posthog = usePostHog();
  
  // Track summary screen viewed
  useEffect(() => {
    posthog?.capture('onboarding_summary_viewed', {
      team: teamAnswer,
      team_title: team.title,
      triggered_ingredients: triggeredIngredients,
      triggered_ingredients_count: triggeredIngredients.length,
    });
  }, [posthog, teamAnswer, team.title, triggeredIngredients]);
  
  const handleContinue = () => {
    safeHaptic.impact();
    
    // Track "Start My Journey" button clicked
    posthog?.capture('onboarding_summary_continue_clicked', {
      team: teamAnswer,
      triggered_ingredients: triggeredIngredients,
    });
    
    onContinue();
  };

  return (
    <ScrollView 
      className="flex-1" 
      style={{ backgroundColor: 'rgba(161, 210, 117, 0.15)' }}
      showsVerticalScrollIndicator={false}
    >
      <View className="flex-1 p-6">
        {/* Header */}
        <Animated.View entering={FadeIn.duration(600)} className="mb-6">
          <Text className="text-sm text-center mb-2" style={{ color: '#666' }}>
            Based on everything you told us...
          </Text>
          <Text className="text-3xl font-bold text-center" style={{ color: '#2C3F22' }}>
            Meet Your Family Food Guardian
          </Text>
        </Animated.View>

        {/* Profile Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(200)} className="bg-white rounded-2xl p-6 mb-6 shadow-sm">
          {/* Avatar */}
          <View className="items-center mb-4">
            <View className="w-32 h-32 rounded-full bg-gray-100 justify-center items-center mb-3">
              <Text className="text-6xl">{team.avatar}</Text>
            </View>
            <Text className="text-xl font-bold mb-1" style={{ color: '#2C3F22' }}>
              {team.title}
            </Text>
            <Text className="text-sm" style={{ color: '#666' }}>
              {team.subtitle}
            </Text>
          </View>

          {/* Health Score Section */}
          <View className="mb-6">
            <Text className="text-xs font-bold mb-4 uppercase tracking-wide" style={{ color: '#2C3F22' }}>
              Your Holistic Health Score
            </Text>
            
            {/* User Score */}
            <View className="mb-4">
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm" style={{ color: '#2C3F22' }}>Your current score</Text>
                <Text className="text-sm font-bold" style={{ color: '#E53935' }}>29/100</Text>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View className="h-full bg-red-500 rounded-full" style={{ width: '29%' }} />
              </View>
            </View>

            {/* Average Score */}
            <View>
              <View className="flex-row items-center justify-between mb-2">
                <Text className="text-sm" style={{ color: '#2C3F22' }}>Avg. Avocado User (30 days)</Text>
                <Text className="text-sm font-bold" style={{ color: '#97C536' }}>91/100</Text>
              </View>
              <View className="h-2 bg-gray-200 rounded-full overflow-hidden">
                <View className="h-full bg-brand-primary rounded-full" style={{ width: '91%' }} />
              </View>
            </View>
          </View>

          {/* Scroll Indicator */}
          <View className="items-center mb-4">
            <View className="flex-row items-center">
              <View className="h-0.5 bg-gray-300 flex-1" />
              <Ionicons name="chevron-down" size={20} color="#97C536" />
              <View className="h-0.5 bg-gray-300 flex-1" />
            </View>
          </View>

          {/* Triggered Ingredients */}
          <View>
            <Text className="text-sm font-semibold mb-3" style={{ color: '#97C536' }}>
              Watching out for ingredients that trigger:
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {triggeredIngredients.map((ingredient, index) => (
                <Animated.View
                  key={index}
                  entering={FadeInDown.duration(400).delay(300 + index * 100)}
                  className="bg-green-100 px-4 py-2 rounded-full flex-row items-center"
                >
                  <Ionicons name="checkmark-circle" size={16} color="#97C536" className="mr-1" />
                  <Text className="text-sm font-medium" style={{ color: '#2C3F22' }}>
                    {ingredient}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </Animated.View>

        {/* Superpowers Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)} className="mb-6">
          {/* Arrow separator */}
          <View className="items-center mb-4">
            <View className="flex-row items-center">
              <View className="h-0.5 bg-gray-300 flex-1" />
              <View className="w-10 h-10 rounded-full bg-brand-primary justify-center items-center mx-2">
                <Ionicons name="chevron-down" size={24} color="#FFFFFF" />
              </View>
              <View className="h-0.5 bg-gray-300 flex-1" />
            </View>
          </View>

          <Text className="text-lg font-bold text-center mb-6" style={{ color: '#2C3F22' }}>
            Your custom superpowers:
          </Text>

          {superpowers.map((power, index) => (
            <Animated.View
              key={power.title}
              entering={FadeInDown.duration(400).delay(500 + index * 100)}
              className="flex-row items-start mb-4"
            >
              <View className="w-12 h-12 rounded-full bg-green-100 justify-center items-center mr-4">
                <Ionicons name={power.icon as any} size={24} color="#97C536" />
              </View>
              <View className="flex-1">
                <Text className="text-base font-bold mb-1" style={{ color: '#2C3F22' }}>
                  {power.title}
                </Text>
                <Text className="text-sm" style={{ color: '#666' }}>
                  {power.description}
                </Text>
              </View>
            </Animated.View>
          ))}

          {/* Guardian Ready */}
          <Animated.View entering={FadeInDown.duration(400).delay(800)} className="items-center mt-6">
            <View className="w-16 h-16 rounded-full bg-brand-primary justify-center items-center mb-2">
              <Ionicons name="shield" size={32} color="#FFFFFF" />
            </View>
            <Text className="text-sm" style={{ color: '#666' }}>
              Your guardian is ready
            </Text>
          </Animated.View>
        </Animated.View>

        {/* Journey Ahead Section */}
        <Animated.View entering={FadeInDown.duration(600).delay(900)} className="bg-white rounded-t-3xl p-6 -mx-6">
          <View className="flex-row items-center mb-4">
            <Ionicons name="flag" size={20} color="#97C536" />
            <Text className="text-lg font-bold ml-2" style={{ color: '#2C3F22' }}>
              Your Journey Ahead
            </Text>
          </View>

          <View className="mb-6">
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-brand-primary mr-3" />
              <Text className="text-sm" style={{ color: '#666' }}>Today</Text>
            </View>
            <View className="flex-row items-center mb-3">
              <View className="w-2 h-2 rounded-full bg-brand-primary mr-3" />
              <Text className="text-sm" style={{ color: '#666' }}>Week 1-2</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-brand-primary mr-3" />
              <Text className="text-sm" style={{ color: '#666' }}>
                Week 2: See calmer behavior as artificial additives disappear
              </Text>
            </View>
          </View>

          <TouchableOpacity
            className="bg-brand-primary p-4 rounded-xl items-center"
            onPress={handleContinue}
          >
            <Text className="text-white text-lg font-semibold">Start My Journey</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </ScrollView>
  );
}


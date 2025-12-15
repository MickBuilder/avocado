import { useState, useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, ScrollView } from 'react-native';
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress';
import { safeHaptic } from '@/lib/haptics';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { ONBOARDING_STEPS } from '@/components/onboarding/onboarding-steps';
import { RatingScreen } from '@/components/onboarding/rating-screen';
import { LoadingScreen } from '@/components/onboarding/loading-screen';
import { SummaryScreen } from '@/components/onboarding/summary-screen';
// import { PaywallScreen } from '@/components/onboarding/paywall-screen';
import { useStore } from '@/store/store';
import { AvocadoIcon } from '@/components/avocado-icon';
import { usePostHog } from 'posthog-react-native';

const TOTAL_STEPS = ONBOARDING_STEPS.length + 4; // Steps + Welcome + Rating + Loading + Summary (Paywall commented out)

interface Option {
  id: string;
  label: string;
}

interface OnboardingScreenProps {
  onBackgroundColorChange?: (color: string) => void;
}

export function OnboardingScreen({ onBackgroundColorChange }: OnboardingScreenProps = {}) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [isLoadingAnimationComplete, setIsLoadingAnimationComplete] = useState(false);
  const router = useRouter();
  const { completeOnboarding } = useStore();
  const posthog = usePostHog();
  const startTimeRef = useRef<number>(Date.now());
  const stepStartTimeRef = useRef<number>(Date.now());

  // Track onboarding started
  useEffect(() => {
    posthog?.capture('onboarding_started', {
      timestamp: new Date().toISOString(),
    });
    startTimeRef.current = Date.now();
  }, []);

  // Reset loading animation complete state when leaving loading screen
  useEffect(() => {
    if (currentStep !== ONBOARDING_STEPS.length + 2) {
      setIsLoadingAnimationComplete(false);
    }
  }, [currentStep]);

  // Track step viewed
  useEffect(() => {
    const stepDuration = Date.now() - stepStartTimeRef.current;
    stepStartTimeRef.current = Date.now();

    if (currentStep === 0) {
      posthog?.capture('onboarding_step_viewed', {
        step: 'welcome',
        step_index: 0,
        total_steps: TOTAL_STEPS,
      });
    } else if (currentStep === ONBOARDING_STEPS.length + 1) {
      posthog?.capture('onboarding_step_viewed', {
        step: 'rating',
        step_index: currentStep,
        total_steps: TOTAL_STEPS,
      });
    } else if (currentStep === ONBOARDING_STEPS.length + 2) {
      posthog?.capture('onboarding_step_viewed', {
        step: 'loading',
        step_index: currentStep,
        total_steps: TOTAL_STEPS,
      });
    } else if (currentStep === ONBOARDING_STEPS.length + 3) {
      posthog?.capture('onboarding_step_viewed', {
        step: 'summary',
        step_index: currentStep,
        total_steps: TOTAL_STEPS,
        answers_count: Object.keys(answers).length,
      });
    } 
    // Paywall step commented out
    // else if (currentStep === ONBOARDING_STEPS.length + 4) {
    //   posthog?.capture('onboarding_step_viewed', {
    //     step: 'paywall',
    //     step_index: currentStep,
    //     total_steps: TOTAL_STEPS,
    //   });
    // } 
    else {
      const stepData = ONBOARDING_STEPS[currentStep - 1];
      if (stepData) {
        posthog?.capture('onboarding_step_viewed', {
          step: stepData.id,
          step_type: stepData.type,
          step_index: currentStep,
          total_steps: TOTAL_STEPS,
          question: stepData.question || '',
        });
      }
    }
  }, [currentStep, posthog, answers]);

  const handleOptionSelect = (optionId: string) => {
    safeHaptic.impact();
    setAnswers((prev) => ({ ...prev, [currentStep]: optionId }));
    
    // Track question answered
    const stepData = ONBOARDING_STEPS[currentStep - 1];
    if (stepData && stepData.type === 'question') {
      const selectedOption = stepData.options?.find(opt => opt.id === optionId);
      posthog?.capture('onboarding_question_answered', {
        question_id: stepData.id,
        question: stepData.question || '',
        answer_id: optionId,
        answer_label: selectedOption?.label || optionId,
        step_index: currentStep,
      });
    }
  };

  const handleContinue = () => {
    safeHaptic.impact();
    
    // Track step navigation
    posthog?.capture('onboarding_step_continued', {
      from_step: currentStep,
      to_step: currentStep + 1,
      has_answer: answers[currentStep] !== undefined,
    });
    
    if (currentStep === TOTAL_STEPS - 1) {
      // Complete onboarding
      handleCompleteOnboarding();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    safeHaptic.impact();
    
    // Track back navigation
    posthog?.capture('onboarding_step_back', {
      from_step: currentStep,
      to_step: currentStep - 1,
    });
    
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCompleteOnboarding = () => {
    const totalDuration = Date.now() - startTimeRef.current;
    
    // Track onboarding completed
    posthog?.capture('onboarding_completed', {
      total_duration_ms: totalDuration,
      total_duration_seconds: Math.round(totalDuration / 1000),
      total_steps: TOTAL_STEPS,
      answers: answers,
      answers_count: Object.keys(answers).length,
    });
    
    // Mark onboarding as complete and navigate to app
    completeOnboarding();
    router.replace('/(tabs)/history');
  };

  const renderContent = () => {
    if (currentStep === 0) {
      return (
        <Animated.View entering={FadeIn.duration(600)} className="flex-1 justify-center items-center p-8">
          <Text className="text-3xl font-bold text-center mb-6" style={{ color: '#2C3F22' }}>Welcome to Avocado</Text>
          <Text className="text-lg text-center mb-10 leading-6" style={{ color: '#518E22' }}>
            Your journey to healthier eating starts here. Let's get to know you better!
          </Text>
          <Animated.View entering={FadeInDown.duration(600).delay(300)} className="mt-5">
            <View className="w-[200px] h-[200px] rounded-full justify-center items-center" style={{ backgroundColor: 'rgba(151, 197, 54, 0.1)' }}>
              <AvocadoIcon size={120} active={true} color="#97C536" />
            </View>
          </Animated.View>
        </Animated.View>
      );
    }

    if (currentStep === ONBOARDING_STEPS.length + 1) {
      return <RatingScreen />;
    }

    if (currentStep === ONBOARDING_STEPS.length + 2) {
      return <LoadingScreen onTimeout={handleContinue} onAnimationComplete={() => setIsLoadingAnimationComplete(true)} />;
    }

    if (currentStep === ONBOARDING_STEPS.length + 3) {
      // Summary screen - navigate directly to app when continue is clicked
      return <SummaryScreen answers={answers} onContinue={handleCompleteOnboarding} />;
    }

    // Paywall screen commented out
    // if (currentStep === ONBOARDING_STEPS.length + 4) {
    //   return <PaywallScreen onComplete={handleCompleteOnboarding} onBackToSummary={() => setCurrentStep(ONBOARDING_STEPS.length + 3)} />;
    // }

    const currentStepData = ONBOARDING_STEPS[currentStep - 1];
    if (!currentStepData) return null;

    // Render info screen
    if (currentStepData.type === 'info' && currentStepData.component) {
      const InfoComponent = currentStepData.component;
      return <InfoComponent />;
    }

    // Render question screen
    if (currentStepData.type === 'question') {
      return (
        <View className="flex-1 p-5">
          <Animated.Text entering={FadeIn.duration(600)} className="text-2xl font-bold mb-3 text-center" style={{ color: '#2C3F22' }}>
            {currentStepData.question}
          </Animated.Text>
          {currentStepData.subtitle && (
            <Animated.Text entering={FadeIn.duration(600).delay(200)} className="text-base mb-6 text-center" style={{ color: '#518E22' }}>
              {currentStepData.subtitle}
            </Animated.Text>
          )}
          {currentStepData.options?.map((option, index: number) => {
            const isSelected = answers[currentStep] === option.id;
            return (
              <Animated.View entering={FadeInDown.duration(600).delay(index * 100)} key={option.id}>
                <TouchableOpacity
                  className={`p-4 rounded-xl mb-3 border-2 ${isSelected ? 'border-brand-primary' : 'border-transparent'}`}
                  style={{
                    backgroundColor: isSelected ? 'rgba(151, 197, 54, 0.1)' : '#FFFFFF',
                  }}
                  onPress={() => handleOptionSelect(option.id)}
                >
                  <Text
                    className={`text-base text-center font-medium ${isSelected ? 'font-semibold' : ''}`}
                    style={{ color: isSelected ? '#97C536' : '#2C3F22' }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>
      );
    }

    return null;
  };

  // Count only question steps for progress
  const questionSteps = ONBOARDING_STEPS.filter((step) => step.type === 'question');
  const currentQuestionIndex = ONBOARDING_STEPS.slice(0, currentStep).filter((step) => step.type === 'question').length;
  
  const shouldShowProgress = currentStep > 0 && currentStep <= ONBOARDING_STEPS.length;
  const isWelcomeScreen = currentStep === 0;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  // Disable continue for question steps without an answer, or loading screen until animation completes
  const currentStepData = currentStep > 0 ? ONBOARDING_STEPS[currentStep - 1] : null;
  const isLoadingScreen = currentStep === ONBOARDING_STEPS.length + 2;
  const isContinueDisabled =
    (currentStepData?.type === 'question' && !answers[currentStep]) ||
    (isLoadingScreen && !isLoadingAnimationComplete);

  // Check if current step has a green background (PledgeScreen or FeaturesScreen)
  const hasGreenBackground = currentStepData?.id === 'pledge' || currentStepData?.id === 'features';
  const backgroundColor = hasGreenBackground ? '#2C3F22' : 'rgba(161, 210, 117, 0.15)';

  // Notify parent of background color changes
  useEffect(() => {
    onBackgroundColorChange?.(backgroundColor);
  }, [backgroundColor, onBackgroundColorChange]);

  return (
    <View className="flex-1" style={{ backgroundColor }}>
      {shouldShowProgress && (
        <OnboardingProgress
          currentStep={currentQuestionIndex}
          totalSteps={questionSteps.length}
          onBack={handleBack}
        />
      )}
      <ScrollView 
        className="flex-1" 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {renderContent()}
      </ScrollView>
      {currentStep <= ONBOARDING_STEPS.length + 2 && currentStep !== ONBOARDING_STEPS.length + 3 && (
        // Paywall step commented out: currentStep !== ONBOARDING_STEPS.length + 4 && (
        <Animated.View entering={FadeIn.duration(600)}>
          <TouchableOpacity
            className="bg-brand-primary p-4 m-2.5 rounded-xl items-center"
            style={{ opacity: isContinueDisabled ? 0.5 : 1 }}
            onPress={handleContinue}
            disabled={isContinueDisabled}
          >
            <Text className="text-white text-lg font-semibold">
              {isWelcomeScreen ? 'Get Started' : isLastStep ? 'Get Started' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}


import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store/store';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { Redirect } from 'expo-router';
import { useSubscription } from '@/providers/RevenueCat';

export default function Index() {
  const { hasCompletedOnboarding, resetOnboarding } = useStore();
  const { isPro, isLoading } = useSubscription();
  const [backgroundColor, setBackgroundColor] = useState('rgba(161, 210, 117, 0.15)');

  // TODO: Remove this useEffect when finished testing
  useEffect(() => {
    resetOnboarding();
  }, [resetOnboarding]);

  // Show loading state while checking subscription
  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']} />
      </View>
    );
  }

  // Show onboarding if not completed
  if (!hasCompletedOnboarding) {
    return (
      <View style={{ flex: 1, backgroundColor }}>
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
          <OnboardingScreen onBackgroundColorChange={setBackgroundColor} />
        </SafeAreaView>
      </View>
    );
  }

  // If user is subscribed, allow access to app
  if (isPro) {
    return <Redirect href={'/(tabs)/history' as any} />;
  }

  // If onboarding completed but not subscribed, show paywall
  // For now, allow access but you can redirect to paywall if needed
  // return <Redirect href={'/paywall' as any} />;
  
  // Allow access for now (you can uncomment above to require subscription)
  return <Redirect href={'/(tabs)/history' as any} />;
}

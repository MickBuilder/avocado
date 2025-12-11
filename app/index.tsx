import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useStore } from '@/store/store';
import { OnboardingScreen } from '@/components/onboarding/onboarding-screen';
import { Redirect } from 'expo-router';
// import { useSuperwallSubscription } from '@/providers/Superwall';

export default function Index() {
  const { hasCompletedOnboarding, resetOnboarding } = useStore();
  // const { isPro } = useSuperwallSubscription(); // Paywall commented out
  const [backgroundColor, setBackgroundColor] = useState('rgba(161, 210, 117, 0.15)');

  // TODO: Remove this useEffect when finished testing
  useEffect(() => {
    resetOnboarding();
  }, [resetOnboarding]);

  // Paywall check commented out
  // // If user is subscribed, allow access to app
  // if (isPro) {
  //   return <Redirect href={'/(tabs)/history' as any} />;
  // }

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

  // If onboarding completed, navigate to app
  return <Redirect href={'/(tabs)/history' as any} />;
  
  // Paywall flow commented out
  // // If onboarding completed but not subscribed, show onboarding again (paywall)
  // return (
  //   <View style={{ flex: 1, backgroundColor }}>
  //     <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
  //       <OnboardingScreen onBackgroundColorChange={setBackgroundColor} />
  //     </SafeAreaView>
  //   </View>
  // );
}

import { Stack } from 'expo-router';
import { PaywallScreen } from '@/components/paywall/paywall-screen';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function PaywallPage() {
  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <PaywallScreen />
      </SafeAreaView>
    </>
  );
}


import '@/global.css';

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { PostHogProvider } from 'posthog-react-native';
import { RevenueCatProvider } from '@/providers/RevenueCat';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

const InitialLayout = () => {
  const { colorScheme } = useColorScheme();
  const posthogKey = process.env.EXPO_PUBLIC_POSTHOG_KEY;

  return (
    <RevenueCatProvider>
      <PostHogProvider
        apiKey={posthogKey || ''}
        options={{
          host: 'https://us.i.posthog.com',
          captureAppLifecycleEvents: true,
          disabled: !posthogKey, // Disable if no key
          enableSessionReplay: true,
          sessionReplayConfig: {
            maskAllTextInputs: true, // Mask sensitive text inputs
            maskAllImages: false, // Keep images visible for better context
            maskAllSandboxedViews: true, // Mask sandboxed views
            captureLog: true, // Capture console logs
            captureNetworkTelemetry: true, // Capture network requests
            throttleDelayMs: 1000, // Throttle capture to reduce overhead
          },
        }}
      >
        <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
          <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="product/[id]" options={{ presentation: 'card' }} />
            <Stack.Screen name="paywall" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>
          <PortalHost />
        </ThemeProvider>
      </PostHogProvider>
    </RevenueCatProvider>
  );
};

export default function RootLayout() {
  return <InitialLayout />;
}

import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { safeHaptic } from '@/lib/haptics';
import { AvocadoIcon } from '@/components/avocado-icon';
import { usePostHog } from 'posthog-react-native';

export default function TabLayout() {
  const posthog = usePostHog();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#745513', // Medium brown
        tabBarInactiveTintColor: '#518E22', // Medium green
        headerShown: false,
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: '#F1F3ED',
          backgroundColor: 'rgba(161, 210, 117, 0.20)',
        },
      }}
      screenListeners={{
        tabPress: (e) => {
          safeHaptic.impact();
          const tabName = e.target?.split('-')[0] || 'unknown';
          posthog?.capture('tab_changed', { tab: tabName });
        },
      }}
    >
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color, size, focused }) => (
            <AvocadoIcon size={size} active={focused} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="scan"
        options={{
          title: 'Scan',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "qr-code" : "qr-code-outline"} size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size, focused }) => (
            <Ionicons name={focused ? "search" : "search-outline"} size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}


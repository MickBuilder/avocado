import { Link, Stack } from 'expo-router';

import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <View className="flex flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(161, 210, 117, 0.15)' }}>
      <Stack.Screen options={{ title: 'Oops!' }} />
        <Text className="text-xl font-bold">{"This screen doesn't exist."}</Text>
        <Link href="/" className="mt-4 pt-4">
        <Text className="text-base" style={{ color: '#518E22' }}>Go to home screen!</Text>
      </Link>
    </View>
  );
}


import { useState } from 'react';
import { View, Text, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

// "#1 holistic health app" screen
export function NumberOneScreen() {
  return (
    <Animated.View entering={FadeIn.duration(600)} className="flex-1 justify-center items-center p-8">
      <View className="items-center mb-8">
        <View className="relative items-center justify-center mb-6">
          <View className="absolute">
            <Ionicons name="trophy" size={120} color="#FFD700" />
          </View>
          <Text className="text-6xl font-bold" style={{ color: '#2C3F22' }}>#1</Text>
        </View>
        <Text className="text-xl font-semibold text-center mb-4" style={{ color: '#2C3F22' }}>
          holistic health app
        </Text>
      </View>
      <Text className="text-lg text-center leading-7" style={{ color: '#2C3F22' }}>
        Take your health & well-being to{'\n'}the next level with Avocado
      </Text>
    </Animated.View>
  );
}

// The Avocado Pledge screen
export function PledgeScreen() {
  return (
    <Animated.View entering={FadeIn.duration(600)} className="flex-1 justify-center items-center p-6">
      <Text className="text-2xl font-bold text-center mb-8 text-white">
        Avocado goes above and beyond other apps
      </Text>
      
      <Animated.View entering={FadeInDown.duration(600).delay(300)} className="w-full bg-white rounded-xl p-6 relative">
        <View className="absolute top-0 right-0 -mt-4 -mr-4">
          <View className="w-12 h-12 rounded-full justify-center items-center" style={{ backgroundColor: '#2C3F22' }}>
            <Ionicons name="shield-checkmark" size={24} color="#FFFFFF" />
          </View>
        </View>
        
        <View className="bg-brand-primary rounded-t-xl p-4 mb-4 -mx-6 -mt-6">
          <Text className="text-white font-semibold text-lg">The Avocado Pledge:</Text>
        </View>
        
        <Text className="text-base leading-6" style={{ color: '#2C3F22' }}>
          We will <Text className="font-bold italic">NEVER</Text> take a single penny from <Text className="font-bold italic">ANY</Text> brand to alter their score.
        </Text>
      </Animated.View>
    </Animated.View>
  );
}

// Features screen - "How Avocado helps you achieve lasting change"
export function FeaturesScreen() {
  const features = [
    {
      icon: 'qr-code-outline',
      title: 'Scan Products',
      description: 'Over 1 million products scored, mapped, and analyzed.',
    },
    {
      icon: 'analytics-outline',
      title: 'Holistic Health Score™',
      description: 'Proprietary scoring model that rates oils, dyes, sweeteners & toxins',
    },
    {
      icon: 'swap-horizontal-outline',
      title: 'Smart Swaps',
      description: 'Cleaner alternatives that actually taste good.',
    },
  ];

  return (
    <Animated.View entering={FadeIn.duration(600)} className="flex-1 justify-center p-6">
      <Text className="text-2xl font-bold text-center mb-2 text-white">
        How Avocado helps you achieve lasting change
      </Text>
      <Text className="text-base text-center mb-8 text-white opacity-90">
        Inside Avocado:
      </Text>

      <View className="gap-4">
        {features.map((feature, index) => (
          <Animated.View
            key={feature.title}
            entering={FadeInDown.duration(600).delay(300 + index * 100)}
            className="bg-white rounded-xl p-4 flex-row items-start"
          >
            <View className="w-12 h-12 rounded-full justify-center items-center mr-4" style={{ backgroundColor: '#F1F3ED' }}>
              <Ionicons name={feature.icon as any} size={24} color="#2C3F22" />
            </View>
            <View className="flex-1">
              <Text className="text-lg font-bold mb-1" style={{ color: '#2C3F22' }}>
                {feature.title}
              </Text>
              <Text className="text-sm leading-5" style={{ color: '#518E22' }}>
                {feature.description}
              </Text>
            </View>
            {index < features.length - 1 && (
              <View className="absolute bottom-0 left-6 right-6 h-0.5" style={{ backgroundColor: '#2C3F22', opacity: 0.1 }} />
            )}
          </Animated.View>
        ))}
      </View>

      <Animated.Text entering={FadeInDown.duration(600).delay(600)} className="text-base text-center mt-8 text-white">
        Achieve your goals faster, naturally.
      </Animated.Text>
    </Animated.View>
  );
}

// Kid-Safe Mode screen
export function KidSafeModeScreen() {
  const [kidSafeModeEnabled, setKidSafeModeEnabled] = useState(false);

  return (
    <Animated.View entering={FadeIn.duration(600)} className="flex-1 p-6">
      <Text className="text-2xl font-bold text-center mb-6" style={{ color: '#2C3F22' }}>
        And it's destroying{'\n'}our bodies.
      </Text>

      <Animated.View entering={FadeInDown.duration(600).delay(300)} className="mb-6">
        <Text className="text-lg text-center leading-7 mb-2" style={{ color: '#2C3F22' }}>
          If a child's blood-lead{'\n'}concentration creeps up{'\n'}by just{' '}
          <Text className="font-bold" style={{ color: '#E53935' }}>0.000005 grams</Text>,
          {'\n'}studies show they lose{'\n'}about{' '}
          <Text className="font-bold" style={{ color: '#E53935' }}>5 IQ points for{'\n'}life.</Text>*
        </Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(600).delay(500)} className="bg-white rounded-xl p-4 flex-row items-center justify-between mb-4">
        <Text className="text-base font-medium flex-1" style={{ color: '#2C3F22' }}>
          Turn on Kid-Safe Mode
        </Text>
        <Switch
          value={kidSafeModeEnabled}
          onValueChange={setKidSafeModeEnabled}
          trackColor={{ false: '#E0E0E0', true: '#97C536' }}
          thumbColor="#FFFFFF"
        />
      </Animated.View>

      <Animated.Text entering={FadeInDown.duration(600).delay(700)} className="text-xs text-center" style={{ color: '#518E22' }}>
        *5 µg/dL to 10 µg/dL - Source: Jusko et al. (2008).{'\n'}Environmental Health Perspectives.
      </Animated.Text>
    </Animated.View>
  );
}

// Comparison screen - "Then" vs "Now"
export function ComparisonScreen() {
  return (
    <Animated.View entering={FadeIn.duration(600)} className="flex-1 p-6">
      <Text className="text-xl font-bold text-center mb-6" style={{ color: '#2C3F22' }}>
        Avoiding bad ingredients can be tough...
      </Text>

      <View className="flex-row gap-4 mb-4">
        {/* Then Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(300)} className="flex-1 bg-white rounded-xl p-4">
          <View className="bg-brand-primary rounded-lg px-3 py-1.5 mb-3 self-start">
            <Text className="text-white font-semibold text-sm">Then</Text>
          </View>
          <View className="h-32 bg-gray-100 rounded-lg mb-3 items-center justify-center">
            <Ionicons name="image-outline" size={40} color="#518E22" />
          </View>
          <Text className="text-xs leading-4" style={{ color: '#2C3F22' }}>
            Ripened Tomatoes,{'\n'}Pickling Vinegar,{'\n'}Cane Sugar, Salt,{'\n'}Fresh Ground{'\n'}Spices
          </Text>
        </Animated.View>

        {/* Now Card */}
        <Animated.View entering={FadeInDown.duration(600).delay(400)} className="flex-1 bg-white rounded-xl p-4">
          <View className="bg-red-600 rounded-lg px-3 py-1.5 mb-3 self-start">
            <Text className="text-white font-semibold text-sm">Now</Text>
          </View>
          <View className="h-32 bg-gray-100 rounded-lg mb-3 items-center justify-center">
            <Ionicons name="image-outline" size={40} color="#518E22" />
          </View>
          <Text className="text-xs leading-4" style={{ color: '#2C3F22' }}>
            Tomato Concentrate,{'\n'}Distilled Vinegar,{'\n'}
            <Text className="font-bold" style={{ color: '#E53935' }}>High Fructose{'\n'}Corn Syrup</Text>, Salt,{'\n'}Spice, Onion Powder
          </Text>
        </Animated.View>
      </View>

      <Animated.Text entering={FadeInDown.duration(600).delay(500)} className="text-base text-center italic" style={{ color: '#2C3F22' }}>
        because our food has changed.
      </Animated.Text>
    </Animated.View>
  );
}

// Trust screen - "Avocado is your trusted guide"
export function TrustScreen() {
  return (
    <Animated.View entering={FadeIn.duration(600)} className="flex-1 justify-center items-center p-6">
      <Text className="text-2xl font-bold text-center mb-8" style={{ color: '#2C3F22' }}>
        Avocado is your trusted guide from panic to plan.
      </Text>
      
      <Animated.View entering={FadeInDown.duration(600).delay(300)} className="w-full max-w-xs">
        <View className="bg-white rounded-2xl p-6 shadow-lg items-center">
          <View className="w-48 h-96 bg-gray-100 rounded-xl mb-4 items-center justify-center">
            <Ionicons name="phone-portrait-outline" size={80} color="#518E22" />
          </View>
          <Text className="text-sm text-center" style={{ color: '#518E22' }}>
            Scan products instantly{'\n'}Get instant health scores{'\n'}Make smarter choices
          </Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}


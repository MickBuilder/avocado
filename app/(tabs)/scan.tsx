import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, Pressable, StyleSheet, ActivityIndicator, Animated, Dimensions } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { CameraView, useCameraPermissions, BarcodeScanningResult } from 'expo-camera';
import { safeHaptic } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/store';
import { getProductByBarcode, calculateScore, getQualityLabel, parseAdditives, hasSeedOil, getCalories, getSugars, getSalt } from '@/lib/openfoodfacts';
import type { Product } from '@/store/store';
import { LinearGradient } from 'expo-linear-gradient';
import { usePostHog } from 'posthog-react-native';

export default function ScanScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(true);
  const { addProduct } = useStore();
  const scanLineAnim = useRef(new Animated.Value(0)).current;
  const isProcessingRef = useRef(false);
  const { height: screenHeight } = Dimensions.get('window');

  useEffect(() => {
    requestPermission();
  }, []);

  // Track screen focus to pause camera when not visible and reset scan state when returning
  useFocusEffect(
    useCallback(() => {
      setIsFocused(true);
      // Reset scan state when screen comes back into focus
      setScanned(false);
      setLoading(false);
      isProcessingRef.current = false;
      return () => {
        setIsFocused(false);
      };
    }, [])
  );

  // Animate scanning line from top to bottom and back to top
  useEffect(() => {
    const animateLine = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    animateLine();
    return () => {
      scanLineAnim.stopAnimation();
    };
  }, [scanLineAnim]);

  const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
    // Use ref to prevent race conditions - refs update synchronously
    if (isProcessingRef.current || scanned) return;
    
    isProcessingRef.current = true;
    setScanned(true);
    setLoading(true);
    
    // Haptic feedback when barcode is detected
    safeHaptic.impact();

    try {
      const offProduct = await getProductByBarcode(data);
      if (!offProduct) {
        safeHaptic.notification('error');
        alert('Product not found. Please try again.');
        setScanned(false);
        setLoading(false);
        isProcessingRef.current = false;
        return;
      }
      
      // Success haptic when product is found
      safeHaptic.notification('success');

      const score = calculateScore(offProduct);
      const quality = getQualityLabel(score);
      const additives = await parseAdditives(offProduct.additives_tags);
      const ingredients = offProduct.ingredients_text
        ? offProduct.ingredients_text.split(',').map((i) => i.trim())
        : [];

      const product: Product = {
        id: offProduct.code,
        barcode: offProduct.code,
        name: offProduct.product_name || 'Unknown Product',
        brand: offProduct.brands,
        imageUrl: (offProduct as any).image_front_url || (offProduct as any).image_url,
        score,
        quality,
        scannedAt: new Date(),
        isFavorite: false,
        additives,
        allergens: offProduct.allergens_tags || [],
        dietInfo: [
          ...((offProduct as any).vegan === 'yes' ? ['Vegan'] : []),
          ...((offProduct as any).vegetarian === 'yes' ? ['Vegetarian'] : []),
        ],
        ingredients,
        hasSeedOil: hasSeedOil(ingredients),
        hasPalmOil:
          (offProduct.ingredients_from_palm_oil_tags &&
            offProduct.ingredients_from_palm_oil_tags.length > 0) ||
          (offProduct.ingredients_that_may_be_from_palm_oil_tags &&
            offProduct.ingredients_that_may_be_from_palm_oil_tags.length > 0) ||
          false,
        calories: getCalories(offProduct),
        sugars: getSugars(offProduct),
        salt: getSalt(offProduct),
      };

      addProduct(product);
      
      // Track product scanned event
      posthog?.capture('product_scanned', {
        product_id: product.id,
        product_name: product.name,
        barcode: product.barcode,
        score: product.score,
        quality: product.quality,
        has_additives: (product.additives?.length || 0) > 0,
        additives_count: product.additives?.length || 0,
        has_palm_oil: product.hasPalmOil || false,
        has_seed_oil: product.hasSeedOil || false,
      });
      
      router.push(`/product/${product.id}`);
      // Don't reset scanned/loading after successful navigation
      // The screen will unmount anyway
    } catch (error) {
      console.error('Error processing product:', error);
      alert('Error processing product. Please try again.');
      setScanned(false);
      setLoading(false);
      isProcessingRef.current = false;
    }
  };


  if (!permission) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#2C3F22' }}>
        <ActivityIndicator size="large" color="#F1F3ED" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View className="flex-1 items-center justify-center p-4" style={{ backgroundColor: '#2C3F22' }}>
        <Text className="text-center mb-4" style={{ color: '#F1F3ED' }}>
          We need your permission to use the camera for scanning barcodes
        </Text>
        <Pressable
          onPress={requestPermission}
          className="bg-brand-primary px-6 py-3 rounded-lg"
        >
          <Text className="font-semibold" style={{ color: '#F1F3ED' }}>Grant Permission</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Scan',
          headerStyle: {
            backgroundColor: '#2C3F22',
          },
          headerTintColor: '#F1F3ED',
          headerTitleStyle: {
            color: '#F1F3ED',
            fontWeight: 'bold',
            fontSize: 18,
          },
          headerLeft: () => (
            <Pressable
              onPress={() => {
                safeHaptic.impact();
                router.back();
              }}
              className="ml-4"
            >
              <Ionicons name="close-circle-outline" size={24} color="#F1F3ED" />
            </Pressable>
          ),
        }}
      />
      <View className="flex-1" style={{ backgroundColor: '#2C3F22' }}>
        {/* Camera Container */}
        <View className="flex-1 m-4" style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 2, borderColor: '#518E22' }}>
          {!scanned && isFocused ? (
            <>
              <CameraView
                style={StyleSheet.absoluteFill}
                facing="back"
                onBarcodeScanned={handleBarCodeScanned}
                barcodeScannerSettings={{
                  barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'],
                }}
              />
              {/* Animated Scanning Line - positioned absolutely over camera */}
              <Animated.View
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  height: 2,
                  transform: [
                    {
                      translateY: scanLineAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [
                          screenHeight * 0.025,
                          screenHeight * 0.525,
                        ],
                      }),
                    },
                  ],
                  shadowColor: '#97C536',
                  shadowOffset: { width: 0, height: 0 },
                  shadowOpacity: 0.5,
                  shadowRadius: 4,
                  elevation: 4,
                  pointerEvents: 'none',
                }}
              >
                <LinearGradient
                  colors={['transparent', '#97C536', 'transparent']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
            </>
          ) : (
            <View className="flex-1 items-center justify-center" style={{ backgroundColor: '#2C3F22' }}>
              {loading && <ActivityIndicator size="large" color="#F1F3ED" />}
            </View>
          )}
        </View>
      </View>
    </>
  );
}


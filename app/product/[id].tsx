import { useEffect, useState } from 'react';
import { View, Text, ScrollView, Image, Pressable, StyleSheet } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { safeHaptic } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/store';
import { getQualityColor } from '@/lib/openfoodfacts';
import { ScoreBadge } from '@/components/score-badge';
import type { Product } from '@/store/store';
import { usePostHog } from 'posthog-react-native';

export default function ProductDetailsScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct, toggleFavorite, favorites } = useStore();
  const [product, setProduct] = useState(getProduct(id || ''));

  useEffect(() => {
    const p = getProduct(id || '');
    setProduct(p);
    
    // Track product viewed
    if (p) {
      const eventProperties: Record<string, any> = {
        product_id: p.id,
        product_name: p.name,
        barcode: p.barcode,
        score: p.score,
        quality: p.quality,
        is_favorite: favorites.includes(p.id),
        has_additives: (p.additives?.length || 0) > 0,
        additives_count: p.additives?.length || 0,
        has_palm_oil: p.hasPalmOil || false,
        has_seed_oil: p.hasSeedOil || false,
      };
      
      if (p.calories !== undefined && p.calories !== null) {
        eventProperties.calories = p.calories;
      }
      if (p.sugars !== undefined && p.sugars !== null) {
        eventProperties.sugars = p.sugars;
      }
      if (p.salt !== undefined && p.salt !== null) {
        eventProperties.salt = p.salt;
      }
      
      posthog?.capture('product_viewed', eventProperties);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!product) {
    return (
      <View className="flex-1 items-center justify-center">
        <Text style={{ color: '#518E22' }}>Product not found</Text>
        <Pressable
          onPress={() => {
            safeHaptic.impact();
            router.back();
          }}
          className="mt-4"
        >
          <Text className="text-brand-primary">Go back</Text>
        </Pressable>
      </View>
    );
  }

  const isFavorite = favorites.includes(product.id);
  const qualityColor = getQualityColor(product.quality);

  const getAdditiveColor = (severity: 'good' | 'caution' | 'warning') => {
    switch (severity) {
      case 'good':
        return '#97C536'; // Vibrant lime green
      case 'caution':
        return '#65AE1E'; // Bright green
      case 'warning':
        return '#745513'; // Medium brown (warning)
      default:
        return '#518E22'; // Medium green
    }
  };

  // Map allergen names to icons and determine if present or free-from
  const getAllergenInfo = (allergenTag: string): { name: string; icon: string; isPresent: boolean } | null => {
    // Only process allergens that start with "en:"
    if (!allergenTag.toLowerCase().startsWith('en:')) {
      return null;
    }

    const allergenLower = allergenTag.toLowerCase().replace(/^en:/, '');
    
    // Common allergen mappings with appropriate icons
    const allergenMap: Record<string, { name: string; icon: string }> = {
      'gluten': { name: 'Gluten', icon: 'nutrition-outline' },
      'wheat': { name: 'Gluten', icon: 'nutrition-outline' },
      'soy': { name: 'Soy', icon: 'leaf-outline' },
      'soya': { name: 'Soy', icon: 'leaf-outline' },
      'milk': { name: 'Milk', icon: 'cafe-outline' },
      'eggs': { name: 'Egg', icon: 'egg-outline' },
      'egg': { name: 'Egg', icon: 'egg-outline' },
      'nuts': { name: 'Nuts', icon: 'flower-outline' },
      'tree-nuts': { name: 'Nuts', icon: 'flower-outline' },
      'fish': { name: 'Fish', icon: 'fish-outline' },
      'peanuts': { name: 'Peanuts', icon: 'ellipse-outline' },
      'shellfish': { name: 'Shellfish', icon: 'water-outline' },
      'crustaceans': { name: 'Shellfish', icon: 'water-outline' },
      'mustard': { name: 'Mustard', icon: 'flame-outline' },
      'sesame': { name: 'Sesame', icon: 'ellipse-outline' },
      'sulphites': { name: 'Sulphites', icon: 'flask-outline' },
      'sulfites': { name: 'Sulphites', icon: 'flask-outline' },
      'lupin': { name: 'Lupin', icon: 'flower-outline' },
      'celery': { name: 'Celery', icon: 'leaf-outline' },
    };

    // Check if allergen is in the map
    for (const [key, value] of Object.entries(allergenMap)) {
      if (allergenLower.includes(key)) {
        return { ...value, isPresent: true };
      }
    }

    // If not found, return formatted name
    const formattedName = allergenTag
      .replace(/^en:/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    
    return { name: formattedName, icon: 'warning-outline', isPresent: true };
  };

  // Process allergens to separate present and free-from
  const processAllergens = (): { present: Array<{ name: string; icon: string }>; freeFrom: Array<{ name: string; icon: string }> } => {
    if (!product.allergens || product.allergens.length === 0) return { present: [], freeFrom: [] };

    const present: Array<{ name: string; icon: string }> = [];
    const seen = new Set<string>();

    // Only process allergens that start with "en:"
    product.allergens
      .filter((allergenTag) => allergenTag.toLowerCase().startsWith('en:'))
      .forEach((allergenTag) => {
        const info = getAllergenInfo(allergenTag);
        if (info && !seen.has(info.name)) {
          seen.add(info.name);
          present.push({ name: info.name, icon: info.icon });
        }
      });

    // For now, we'll only show present allergens
    // Free-from allergens would need to be determined from product data
    // which Open Food Facts may not always provide explicitly
    return { present, freeFrom: [] };
  };

  // Get additives color based on highest risk
  const getAdditivesColor = (): string => {
    if (!product.additives || product.additives.length === 0) {
      return '#97C536'; // No additives = green
    }
    const hasWarning = product.additives.some((a) => a.severity === 'warning');
    const hasCaution = product.additives.some((a) => a.severity === 'caution');
    if (hasWarning) return '#745513'; // Medium brown
    if (hasCaution) return '#65AE1E'; // Bright green
    return '#97C536'; // Vibrant lime green
  };

  // Build summary icons
  const buildSummaryIcons = () => {
    const icons: Array<{ icon: string; name: string; value: string; color: string }> = [];

    // Additives
    const additivesColor = getAdditivesColor();
    icons.push({
      icon: 'flask-outline',
      name: 'Additives',
      value: product.additives && product.additives.length > 0 ? `${product.additives.length}` : 'No additives',
      color: additivesColor,
    });

    // Seed Oil
    icons.push({
      icon: 'water-outline',
      name: 'Seed oil',
      value: product.hasSeedOil ? 'Yes' : 'No',
      color: product.hasSeedOil ? '#745513' : '#97C536',
    });

    // Palm Oil
    icons.push({
      icon: 'leaf-outline',
      name: 'Palm oil',
      value: product.hasPalmOil ? 'Yes' : 'No',
      color: product.hasPalmOil ? '#745513' : '#97C536',
    });

    // Ingredients - only show if count > 0
    const ingredientsCount = product.ingredients?.length || 0;
    if (ingredientsCount > 0) {
      icons.push({
        icon: 'list-outline',
        name: 'Ingredients',
        value: `${ingredientsCount}`,
        color: '#518E22',
      });
    }

    // Calories - only show if > 0
    if (product.calories !== undefined && product.calories !== null && product.calories > 0) {
      icons.push({
        icon: 'flame-outline',
        name: 'Calories',
        value: `${product.calories} Cal`,
        color: '#65AE1E',
      });
    }

    // Sugars - only show if > 0
    if (product.sugars !== undefined && product.sugars !== null && product.sugars > 0) {
      icons.push({
        icon: 'nutrition-outline',
        name: 'Sugar',
        value: `${product.sugars.toFixed(1)}g`,
        color: product.sugars > 10 ? '#745513' : '#65AE1E',
      });
    }

    // Salt - only show if > 0
    if (product.salt !== undefined && product.salt !== null && product.salt > 0) {
      icons.push({
        icon: 'restaurant-outline',
        name: 'Salt',
        value: `${product.salt.toFixed(1)}g`,
        color: product.salt > 1.5 ? '#745513' : '#65AE1E',
      });
    }

    return icons;
  };

  const summaryIcons = buildSummaryIcons();

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Nutrition Details',
          headerStyle: {
            backgroundColor: 'rgba(161, 210, 117, 0.20)',
          },
          headerLeft: () => (
            <Pressable
              onPress={() => {
                safeHaptic.impact();
                router.back();
              }}
              className="ml-4"
            >
              <Ionicons name="chevron-back" size={24} color="#2C3F22" />
            </Pressable>
          ),
          headerRight: () => (
            <Pressable
              onPress={() => {
                const wasFavorite = isFavorite;
                toggleFavorite(product.id);
                safeHaptic.impact();
                
                // Track favorite toggle
                posthog?.capture(wasFavorite ? 'product_unfavorited' : 'product_favorited', {
                  product_id: product.id,
                  product_name: product.name,
                  barcode: product.barcode,
                  score: product.score,
                  quality: product.quality,
                });
              }}
              className="mr-4"
            >
              <Ionicons
                name={isFavorite ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={isFavorite ? '#97C536' : '#2C3F22'}
              />
            </Pressable>
          ),
        }}
      />
      <ScrollView className="flex-1" style={{ backgroundColor: 'rgba(161, 210, 117, 0.15)' }} showsVerticalScrollIndicator={false}>
        {/* Product Summary Card */}
        <View className="rounded-lg mx-4 mt-4 p-5 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
          {/* Product Image and Name Row */}
          <View className="flex-row mb-5">
            {/* Product Image (larger, square - 100x100) */}
            <View className="w-[100px] h-[100px] rounded-xl overflow-hidden mr-4" style={{ backgroundColor: '#F1F3ED' }}>
              {product.imageUrl ? (
                <Image source={{ uri: product.imageUrl }} className="w-full h-full" resizeMode="cover" />
              ) : (
                <View className="w-full h-full items-center justify-center">
                  <Ionicons name="image-outline" size={40} color="#518E22" />
                </View>
              )}
            </View>

            {/* Product Info */}
            <View className="flex-1">
              {product.brand && (
                <Text className="text-xs mb-1.5 font-medium" style={{ color: '#518E22' }}>{product.brand}</Text>
              )}
              <Text className="text-base font-bold mb-3" style={{ color: '#2C3F22' }} numberOfLines={2}>
                {product.name}
              </Text>
              <ScoreBadge score={product.score} size="md" showLabel={true} />
            </View>
          </View>

          {/* Summary Icons Row (Scrollable) */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingRight: 16 }}
            className="mt-5"
          >
            {summaryIcons.map((item, index) => (
              <View key={index} className="items-center" style={{ width: 80, marginRight: index < summaryIcons.length - 1 ? 0 : 0 }}>
                {/* Icon Container */}
                <View
                  className="w-8 h-8 rounded-full items-center justify-center mb-1"
                  style={{ backgroundColor: `${item.color}26` }}
                >
                  <Ionicons name={item.icon as any} size={12} color={item.color} />
                </View>
                {/* Name */}
                <Text className="text-xs font-semibold text-center mb-0.5" style={{ color: '#2C3F22' }} numberOfLines={1}>
                  {item.name}
                </Text>
                {/* Value */}
                <Text className="text-xs text-center" style={{ color: '#518E22' }} numberOfLines={2}>
                  {item.value}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* Additives Section */}
        {product.additives && product.additives.length > 0 && (
          <View className="rounded-lg mx-4 mt-4 p-4 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
            <Text className="text-lg font-bold mb-3" style={{ color: '#2C3F22' }}>Additives</Text>
            {product.additives.map((additive, index) => (
              <Pressable
                key={index}
                className="flex-row items-center justify-between py-3 border-b last:border-b-0"
                style={{ borderBottomColor: '#F1F3ED' }}
              >
                <View className="flex-row items-center flex-1">
                  <View
                    className="w-3 h-3 rounded-full mr-3"
                    style={{ backgroundColor: getAdditiveColor(additive.severity) }}
                  />
                  <Text className="text-base flex-1" style={{ color: '#2C3F22' }}>
                    {additive.name} ({additive.code.toLowerCase()})
                  </Text>
                </View>
                <Ionicons name="chevron-forward-outline" size={24} color="#518E22" />
              </Pressable>
            ))}
          </View>
        )}

        {/* Allergy & Diet Info Section */}
        {(() => {
          const { present, freeFrom } = processAllergens();
          const hasContent = present.length > 0 || freeFrom.length > 0 || (product.dietInfo && product.dietInfo.length > 0);
          
          if (!hasContent) return null;

          return (
            <View className="rounded-lg mx-4 mt-4 p-4 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
              <Text className="text-lg font-bold mb-3" style={{ color: '#2C3F22' }}>Allergy & Diet info</Text>
              <View className="flex-row flex-wrap gap-2">
                {/* Present Allergens (Red) */}
                {present.map((allergen, index) => (
                  <View
                    key={`allergen-present-${index}`}
                    className="flex-row items-center px-3 py-2 rounded-lg border"
                    style={{ borderColor: '#745513', backgroundColor: '#FFF5F5' }}
                  >
                    <Ionicons name={allergen.icon as any} size={18} color="#745513" style={{ marginRight: 6 }} />
                    <Text className="text-sm font-medium" style={{ color: '#745513' }}>{allergen.name}</Text>
                  </View>
                ))}

                {/* Free From Allergens (Green) */}
                {freeFrom.map((allergen, index) => (
                  <View
                    key={`allergen-free-${index}`}
                    className="flex-row items-center px-3 py-2 rounded-lg border"
                    style={{ borderColor: '#97C536', backgroundColor: '#F0F9F0' }}
                  >
                    <Ionicons name={allergen.icon as any} size={18} color="#97C536" style={{ marginRight: 6 }} />
                    <Text className="text-sm font-medium" style={{ color: '#97C536' }}>{allergen.name}</Text>
                  </View>
                ))}

                {/* Diet Info */}
                {product.dietInfo?.map((diet, index) => (
                  <View
                    key={`diet-${index}`}
                    className="flex-row items-center px-3 py-2 rounded-lg border"
                    style={{ borderColor: '#97C536', backgroundColor: '#F0F9F0' }}
                  >
                    <Ionicons
                      name={diet === 'Vegan' ? 'leaf-outline' : 'checkmark-circle-outline'}
                      size={18}
                      color="#97C536"
                      style={{ marginRight: 6 }}
                    />
                    <Text className="text-sm font-medium" style={{ color: '#97C536' }}>{diet}</Text>
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* Ingredients Section */}
        {product.ingredients && product.ingredients.length > 0 && (
          <View className="rounded-lg mx-4 mt-4 mb-6 p-4 shadow-sm" style={{ backgroundColor: '#FFFFFF' }}>
            <Text className="text-lg font-bold mb-3" style={{ color: '#2C3F22' }}>Ingredients</Text>
            <Text className="text-base leading-6" style={{ color: '#2C3F22' }}>{product.ingredients.join(', ')}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

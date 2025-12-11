import { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { safeHaptic } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { searchProducts, calculateScore, getQualityLabel, parseAdditives, hasSeedOil, getCalories, getSugars, getSalt } from '@/lib/openfoodfacts';
import { useStore } from '@/store/store';
import { ProductCard } from '@/components/product-card';
import type { Product } from '@/store/store';
import { usePostHog } from 'posthog-react-native';

export default function SearchScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const params = useLocalSearchParams<{ q?: string }>();
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const { addProduct } = useStore();

  useEffect(() => {
    if (params.q) {
      setSearchQuery(params.q);
      handleSearch(params.q);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.q]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
    }
  }, [searchQuery]);

  const handleSearch = async (query?: string) => {
    const q = query || searchQuery;
    if (!q.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const offProducts = await searchProducts(q);
      const products: Product[] = await Promise.all(
        offProducts.map(async (offProduct) => {
          const score = calculateScore(offProduct);
          const quality = getQualityLabel(score);
          const additives = await parseAdditives(offProduct.additives_tags);
          const ingredients = offProduct.ingredients_text
            ? offProduct.ingredients_text.split(',').map((i) => i.trim())
            : [];

          return {
            id: offProduct.code,
            barcode: offProduct.code,
            name: offProduct.product_name || 'Unknown Product',
            brand: offProduct.brands,
            imageUrl: offProduct.images?.front || offProduct.image_url,
            score,
            quality,
            scannedAt: new Date(),
            isFavorite: false,
            additives,
            allergens: offProduct.allergens_tags || [],
            dietInfo: [
              ...(offProduct.ingredients?.some((i) => i.vegan === 'yes') ? ['Vegan'] : []),
              ...(offProduct.ingredients?.some((i) => i.vegetarian === 'yes') ? ['Vegetarian'] : []),
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
        })
      );

      setResults(products.slice(0, 5));
      
      // Track search event
      posthog?.capture('product_searched', {
        query: q,
        results_count: products.length,
        displayed_count: Math.min(products.length, 5),
      });
    } catch (error) {
      console.error('Error searching products:', error);
      setResults([]);
      
      // Track search error
      posthog?.capture('product_search_error', {
        query: q,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductPress = (product: Product) => {
    safeHaptic.impact();
    addProduct(product);
    
    // Track product selected from search
    posthog?.capture('product_selected_from_search', {
      product_id: product.id,
      product_name: product.name,
      barcode: product.barcode,
      search_query: searchQuery,
    });
    
    router.push(`/product/${product.id}`);
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Search',
          headerStyle: {
            backgroundColor: 'rgba(161, 210, 117, 0.20)',
          },
        }}
      />
      <View className="flex-1" style={{ backgroundColor: 'rgba(161, 210, 117, 0.15)' }}>
        {/* Search Input */}
        <View className="px-4 pt-4 pb-2">
          <View className="rounded-lg px-4 py-3 flex-row items-center" style={{ backgroundColor: '#F1F3ED' }}>
            <Ionicons name="search-outline" size={24} color="#518E22" />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={() => handleSearch()}
              placeholder="Search by name, brand, or barcode..."
              className="flex-1 ml-3"
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => {
                setSearchQuery('');
                setResults([]);
              }}>
                <Ionicons name="close-outline" size={24} color="#518E22" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Results */}
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#97C536" />
            <Text className="mt-4" style={{ color: '#518E22' }}>Searching products...</Text>
          </View>
        ) : results.length === 0 && searchQuery ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="close-circle-outline" size={64} color="#518E22" />
            <Text className="text-center mt-4" style={{ color: '#518E22' }}>
              No products found. Try a different search term.
            </Text>
          </View>
        ) : results.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="search-outline" size={64} color="#518E22" />
            <Text className="text-center mt-4" style={{ color: '#518E22' }}>
              Search for products to get started
            </Text>
          </View>
        ) : (
          <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
            {results.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onPress={() => handleProductPress(product)}
              />
            ))}
          </ScrollView>
        )}
      </View>
    </>
  );
}


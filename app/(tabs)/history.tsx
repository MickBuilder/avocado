import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Alert } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { safeHaptic } from '@/lib/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/store';
import { ProductCard } from '@/components/product-card';
import { usePostHog } from 'posthog-react-native';
import { useRevenueCat, useSubscription } from '@/providers/RevenueCat';

export default function HistoryScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const { products, favorites, getFavorites, removeProducts } = useStore();
  const { isPro } = useSubscription();
  const { presentCustomerCenter, presentPaywall } = useRevenueCat();
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const displayedProducts = filter === 'favorites' ? getFavorites() : products;

  const handleToggleSelect = (productId: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
    safeHaptic.impact();
  };

  const handleDeletePress = () => {
    if (!isSelectMode) {
      setIsSelectMode(true);
      safeHaptic.impact();
      posthog?.capture('history_delete_mode_enabled');
    } else {
      // Cancel selection mode
      setIsSelectMode(false);
      setSelectedIds(new Set());
      safeHaptic.impact();
      posthog?.capture('history_delete_mode_cancelled');
    }
  };

  const handleDeleteSelected = () => {
    const selectedArray = Array.from(selectedIds);
    if (selectedArray.length === 0) {
      Alert.alert('No items selected', 'Please select items to delete.');
      return;
    }

    Alert.alert(
      'Delete Products',
      `Are you sure you want to delete ${selectedArray.length} product${selectedArray.length > 1 ? 's' : ''}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            removeProducts(selectedArray);
            setSelectedIds(new Set());
            setIsSelectMode(false);
            safeHaptic.notification('success');
            posthog?.capture('history_products_deleted', {
              count: selectedArray.length,
              filter: filter,
            });
          },
        },
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'History',
          headerStyle: {
            backgroundColor: 'rgba(161, 210, 117, 0.20)',
          },
          headerLeft: () => (
            <Pressable
              onPress={async () => {
                try {
                  safeHaptic.impact();
                  await presentPaywall();
                  posthog?.capture('paywall_opened_from_history_header');
                } catch (error: any) {
                  if (!error.userCancelled) {
                    console.error('Paywall error:', error);
                    router.push('/paywall' as any);
                  }
                }
              }}
              className="ml-4"
            >
              <Text className="text-base font-semibold" style={{ color: '#2C3F22' }}>
                Pro
              </Text>
            </Pressable>
          ),
          headerRight: () => (
            <View className="flex-row items-center">
              {isPro && !isSelectMode && (
                <Pressable
                  onPress={async () => {
                    try {
                      safeHaptic.impact();
                      await presentCustomerCenter();
                      posthog?.capture('customer_center_opened_from_history');
                    } catch (error: any) {
                      if (!error.userCancelled) {
                        console.error('Customer center error:', error);
                        Alert.alert('Error', 'Unable to open customer center');
                      }
                    }
                  }}
                  className="mr-3"
                >
                  <Ionicons name="person-circle-outline" size={24} color="#2C3F22" />
                </Pressable>
              )}
              <Pressable onPress={handleDeletePress} className="mr-4">
                <Ionicons 
                  name={isSelectMode ? "close-outline" : "trash-outline"} 
                  size={24} 
                  color="#2C3F22" 
                />
              </Pressable>
            </View>
          ),
        }}
      />
      <View className="flex-1" style={{ backgroundColor: 'rgba(161, 210, 117, 0.15)' }}>
        {/* Filter Tabs */}
        {!isSelectMode && (
          <View className="flex-row px-4 pt-4 pb-2 gap-2">
            <Pressable
              onPress={() => {
                if (filter !== 'all') {
                  setFilter('all');
                  safeHaptic.impact();
                  posthog?.capture('history_filter_changed', { filter: 'all' });
                }
              }}
              className={filter === 'all' ? 'bg-black px-4 py-2 rounded-md' : 'px-4 py-2 rounded-md'}
              style={filter !== 'all' ? { backgroundColor: 'rgba(161, 210, 117, 0.20)' } : undefined}
            >
              <Text className={filter === 'all' ? 'text-white font-semibold' : 'font-semibold'} style={filter !== 'all' ? { color: '#2C3F22' } : undefined}>
                All
              </Text>
            </Pressable>
            <Pressable
              onPress={() => {
                if (filter !== 'favorites') {
                  setFilter('favorites');
                  safeHaptic.impact();
                  posthog?.capture('history_filter_changed', { filter: 'favorites' });
                }
              }}
              className={filter === 'favorites' ? 'bg-black px-4 py-2 rounded-md' : 'px-4 py-2 rounded-md'}
              style={filter !== 'favorites' ? { backgroundColor: 'rgba(161, 210, 117, 0.20)' } : undefined}
            >
              <Text className={filter === 'favorites' ? 'text-white font-semibold' : 'font-semibold'} style={filter !== 'favorites' ? { color: '#2C3F22' } : undefined}>
                Favorites
              </Text>
            </Pressable>
          </View>
        )}

        {/* Delete Mode Header */}
        {isSelectMode && (
          <View className="px-4 pt-4 pb-2">
            <Text className="text-lg font-semibold" style={{ color: '#2C3F22' }}>
              {selectedIds.size === 0 
                ? 'Select products to delete' 
                : `${selectedIds.size} product${selectedIds.size > 1 ? 's' : ''} selected`}
            </Text>
          </View>
        )}

        {/* Product List */}
        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {displayedProducts.length === 0 ? (
            <View className="flex-1 items-center justify-center py-20">
              <Ionicons name="time-outline" size={64} color="#518E22" />
              <Text className="text-center mt-4" style={{ color: '#518E22' }}>
                {filter === 'favorites' ? 'No favorites yet' : 'No scans yet. Start scanning products!'}
              </Text>
            </View>
          ) : (
            displayedProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                isSelectMode={isSelectMode}
                isSelected={selectedIds.has(product.id)}
                onToggleSelect={() => handleToggleSelect(product.id)}
                onPress={() => {
                  if (!isSelectMode) {
                    safeHaptic.impact();
                    posthog?.capture('product_viewed_from_history', {
                      product_id: product.id,
                      product_name: product.name,
                      filter: filter,
                    });
                    router.push(`/product/${product.id}`);
                  }
                }}
              />
            ))
          )}
        </ScrollView>

        {/* Delete Button - shown when in select mode with items selected */}
        {isSelectMode && selectedIds.size > 0 && (
          <View className="px-4 pb-4 pt-2">
            <Pressable
              onPress={handleDeleteSelected}
              className="bg-red-500 p-4 rounded-xl items-center"
            >
              <Text className="text-white text-lg font-semibold">
                Delete {selectedIds.size} Product{selectedIds.size > 1 ? 's' : ''}
              </Text>
            </Pressable>
          </View>
        )}
      </View>
    </>
  );
}


import { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useRevenueCat } from '@/providers/RevenueCat';
import { safeHaptic } from '@/lib/haptics';
import { usePostHog } from 'posthog-react-native';
import type { PurchasesPackage } from 'react-native-purchases';

export function PaywallScreen() {
  const router = useRouter();
  const posthog = usePostHog();
  const {
    availablePackages,
    currentOffering,
    purchasePackage,
    restorePurchases,
    presentPaywall,
    presentCustomerCenter,
    isLoading,
    isPro,
  } = useRevenueCat();
  const [purchasing, setPurchasing] = useState<string | null>(null);
  const [restoring, setRestoring] = useState(false);

  // Find packages by Product ID (from App Store Connect)
  const monthlyPackage = availablePackages.find((pkg) => (pkg as any).storeProduct?.identifier === '001');
  const yearlyPackage = availablePackages.find((pkg) => (pkg as any).storeProduct?.identifier === '002');

  // Sort packages: monthly, yearly
  const sortedPackages = [
    monthlyPackage,
    yearlyPackage,
  ].filter((pkg): pkg is PurchasesPackage => pkg !== undefined);

  const handlePurchase = async (pkg: PurchasesPackage) => {
    setPurchasing(pkg.identifier);
    safeHaptic.impact();

    try {
      const result = await purchasePackage(pkg);

      if (result.success) {
        safeHaptic.notification('success');
        posthog?.capture('subscription_purchased', {
          package_identifier: pkg.identifier,
          product_identifier: (pkg as any).storeProduct?.identifier || '',
          price: (pkg as any).storeProduct?.priceString || '',
        });
        router.back();
      } else {
        safeHaptic.notification('error');
        Alert.alert('Purchase Failed', result.error || 'Unable to complete purchase');
        posthog?.capture('subscription_purchase_failed', {
          package_identifier: pkg.identifier,
          error: result.error || 'Unknown error',
        });
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      safeHaptic.notification('error');
      Alert.alert('Error', error.message || 'An error occurred during purchase');
    } finally {
      setPurchasing(null);
    }
  };

  const handleRestore = async () => {
    setRestoring(true);
    safeHaptic.impact();

    try {
      const result = await restorePurchases();

      if (result.success) {
        safeHaptic.notification('success');
        Alert.alert('Success', 'Purchases restored successfully');
        posthog?.capture('subscription_restored');
        router.back();
      } else {
        safeHaptic.notification('error');
        Alert.alert('Restore Failed', result.error || 'Unable to restore purchases');
        posthog?.capture('subscription_restore_failed', {
          error: result.error || 'Unknown error',
        });
      }
    } catch (error: any) {
      console.error('Restore error:', error);
      safeHaptic.notification('error');
      Alert.alert('Error', error.message || 'An error occurred during restore');
    } finally {
      setRestoring(false);
    }
  };

  const handlePresentPaywall = async () => {
    try {
      await presentPaywall();
      posthog?.capture('revenuecat_paywall_presented');
      router.back();
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('Paywall error:', error);
        Alert.alert('Error', 'Unable to display paywall');
      }
    }
  };

  const formatPrice = (pkg: PurchasesPackage) => {
    const storeProduct = (pkg as any).storeProduct;
    if (storeProduct?.priceString) {
      return storeProduct.priceString;
    }
    if (storeProduct?.price) {
      // Format price if we have the numeric value
      const currencyCode = storeProduct.currencyCode || 'USD';
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currencyCode,
      }).format(storeProduct.price);
    }
    return 'Price unavailable';
  };

  const getPackageTitle = (pkg: PurchasesPackage) => {
    const productId = (pkg as any).storeProduct?.identifier;
    if (productId === '001') return 'Monthly';
    if (productId === '002') return 'Yearly';
    // Fallback to package identifier or product name
    return pkg.identifier || (pkg as any).storeProduct?.title || 'Subscription';
  };

  const getPackageSubtitle = (pkg: PurchasesPackage) => {
    const productId = (pkg as any).storeProduct?.identifier;
    if (productId === '001') return 'Billed monthly';
    if (productId === '002') return 'Billed annually';
    return '';
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(161, 210, 117, 0.15)' }}>
        <ActivityIndicator size="large" color="#97C536" />
        <Text className="mt-4" style={{ color: '#518E22' }}>Loading subscription options...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1" style={{ backgroundColor: 'rgba(161, 210, 117, 0.15)' }}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="px-6 pt-12 pb-8 items-center">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-4" style={{ backgroundColor: '#97C536' }}>
            <Ionicons name="star" size={40} color="#FFFFFF" />
          </View>
          <Text className="text-3xl font-bold text-center mb-2" style={{ color: '#2C3F22' }}>
            Upgrade to Avocado Pro
          </Text>
          <Text className="text-base text-center" style={{ color: '#518E22' }}>
            Unlock all premium features and make healthier choices
          </Text>
        </View>

        {/* Features List */}
        <View className="px-6 mb-6">
          <View className="mb-4">
            <FeatureItem icon="checkmark-circle" text="Unlimited product scans" />
            <FeatureItem icon="checkmark-circle" text="Advanced nutrition insights" />
            <FeatureItem icon="checkmark-circle" text="Ad-free experience" />
            <FeatureItem icon="checkmark-circle" text="Priority support" />
            <FeatureItem icon="checkmark-circle" text="Export your scan history" />
          </View>
        </View>

        {/* Packages */}
        {sortedPackages.length > 0 ? (
          <View className="px-6 mb-6">
            {sortedPackages.map((pkg) => {
              const isPurchasing = purchasing === pkg.identifier;
              const isPopular = (pkg as any).storeProduct?.identifier === '002'; // Yearly is popular

              return (
                <Pressable
                  key={pkg.identifier}
                  onPress={() => handlePurchase(pkg)}
                  disabled={isPurchasing || purchasing !== null}
                  className={`mb-3 rounded-xl p-4 border-2 ${
                    isPopular ? 'border-brand-primary' : 'border-gray-300'
                  }`}
                  style={{
                    backgroundColor: '#FFFFFF',
                    opacity: isPurchasing || purchasing !== null ? 0.6 : 1,
                  }}
                >
                  <View className="flex-row items-center justify-between">
                    <View className="flex-1">
                      <View className="flex-row items-center mb-1">
                        <Text className="text-lg font-bold" style={{ color: '#2C3F22' }}>
                          {getPackageTitle(pkg)}
                        </Text>
                        {isPopular && (
                          <View className="ml-2 px-2 py-0.5 rounded" style={{ backgroundColor: '#97C536' }}>
                            <Text className="text-xs font-semibold text-white">POPULAR</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-sm" style={{ color: '#518E22' }}>
                        {getPackageSubtitle(pkg)}
                      </Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-xl font-bold" style={{ color: '#2C3F22' }}>
                        {formatPrice(pkg)}
                      </Text>
                      {isPurchasing ? (
                        <ActivityIndicator size="small" color="#97C536" className="mt-1" />
                      ) : null}
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View className="px-6 mb-6">
            <Text className="text-center mb-4" style={{ color: '#518E22' }}>
              No subscription packages available. Using RevenueCat Paywall instead.
            </Text>
            <Pressable
              onPress={handlePresentPaywall}
              className="bg-brand-primary px-6 py-4 rounded-xl items-center"
            >
              <Text className="text-white text-lg font-semibold">Show Paywall</Text>
            </Pressable>
          </View>
        )}

        {/* Restore Purchases & Customer Center */}
        <View className="px-6 mb-6">
          <Pressable
            onPress={handleRestore}
            disabled={restoring}
            className="py-3 items-center mb-2"
            style={{ opacity: restoring ? 0.6 : 1 }}
          >
            {restoring ? (
              <ActivityIndicator size="small" color="#518E22" />
            ) : (
              <Text className="text-base font-medium" style={{ color: '#518E22' }}>
                Restore Purchases
              </Text>
            )}
          </Pressable>
          
          {isPro && (
            <Pressable
              onPress={async () => {
                try {
                  safeHaptic.impact();
                  await presentCustomerCenter();
                  posthog?.capture('customer_center_opened');
                } catch (error: any) {
                  if (!error.userCancelled) {
                    console.error('Customer center error:', error);
                    Alert.alert('Error', 'Unable to open customer center');
                  }
                }
              }}
              className="py-3 items-center"
            >
              <Text className="text-base font-medium" style={{ color: '#518E22' }}>
                Manage Subscription
              </Text>
            </Pressable>
          )}
        </View>

        {/* Terms */}
        <View className="px-6 pb-8">
          <Text className="text-xs text-center" style={{ color: '#518E22' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy.{' '}
            Subscriptions will auto-renew unless cancelled.
          </Text>
        </View>
      </ScrollView>

      {/* Close Button */}
      <View className="px-6 pb-6">
        <Pressable
          onPress={() => {
            safeHaptic.impact();
            router.back();
          }}
          className="bg-gray-200 px-6 py-3 rounded-xl items-center"
        >
          <Text className="text-base font-semibold" style={{ color: '#2C3F22' }}>
            Maybe Later
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View className="flex-row items-center mb-3">
      <Ionicons name={icon as any} size={24} color="#97C536" style={{ marginRight: 12 }} />
      <Text className="text-base flex-1" style={{ color: '#2C3F22' }}>
        {text}
      </Text>
    </View>
  );
}


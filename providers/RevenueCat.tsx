import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import Purchases, {
  CustomerInfo,
  PurchasesOffering,
  PurchasesPackage,
  PurchasesStoreProduct,
  LOG_LEVEL,
} from 'react-native-purchases';
import { Platform } from 'react-native';
import React from 'react';
import RevenueCatUI from 'react-native-purchases-ui';

// RevenueCat API Key - Load from environment variable
const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_KEY_APPLE || 'test_gsPKtlGtVerQRhfLwSeeaXJZifP';
const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_KEY_ANDROID || process.env.EXPO_PUBLIC_REVENUECAT_KEY_APPLE || 'test_gsPKtlGtVerQRhfLwSeeaXJZifP';

// Entitlement identifier
const PRO_ENTITLEMENT_ID = 'Avocado Pro';

interface RevenueCatContextType {
  // Subscription status
  isPro: boolean;
  isLoading: boolean;
  customerInfo: CustomerInfo | null;
  
  // Offerings and products
  currentOffering: PurchasesOffering | null;
  availablePackages: PurchasesPackage[];
  
  // Actions
  checkSubscriptionStatus: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ success: boolean; error?: string }>;
  restorePurchases: () => Promise<{ success: boolean; error?: string }>;
  presentPaywall: () => Promise<void>;
  presentCustomerCenter: () => Promise<void>;
  
  // Product info
  getProductInfo: (identifier: string) => PurchasesStoreProduct | null;
  refreshCustomerInfo: () => Promise<CustomerInfo>;
}

const RevenueCatContext = createContext<RevenueCatContextType | null>(null);

export const RevenueCatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [customerInfo, setCustomerInfo] = useState<CustomerInfo | null>(null);
  const [currentOffering, setCurrentOffering] = useState<PurchasesOffering | null>(null);
  const [availablePackages, setAvailablePackages] = useState<PurchasesPackage[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize RevenueCat SDK
  const initializeRevenueCat = useCallback(async () => {
    try {
      // Enable debug logs in development
      if (__DEV__) {
        await Purchases.setLogLevel(LOG_LEVEL.DEBUG);
      }

      // Configure RevenueCat with API key from environment
      const apiKey = Platform.select({
        ios: REVENUECAT_API_KEY_IOS,
        android: REVENUECAT_API_KEY_ANDROID,
      });

      if (!apiKey) {
        throw new Error('RevenueCat API key not found for platform');
      }

      await Purchases.configure({ apiKey });

      // Set user attributes (optional but recommended)
      await Purchases.setAttributes({
        // You can add custom attributes here
        // e.g., email, user_id, etc.
      });

      // Load initial customer info and offerings
      await Promise.all([
        refreshCustomerInfo(),
        loadOfferings(),
      ]);

      setIsInitialized(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing RevenueCat:', error);
      setIsLoading(false);
    }
  }, []);

  // Refresh customer info from RevenueCat
  const refreshCustomerInfo = useCallback(async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      setCustomerInfo(info);
      
      // Check if user has Pro entitlement
      const hasPro = info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      setIsPro(hasPro);
      
      return info;
    } catch (error) {
      console.error('Error refreshing customer info:', error);
      throw error;
    }
  }, []);

  // Load available offerings and packages
  const loadOfferings = useCallback(async () => {
    try {
      const offerings = await Purchases.getOfferings();
      
      if (offerings.current !== null) {
        setCurrentOffering(offerings.current);
        setAvailablePackages(offerings.current.availablePackages);
      } else {
        console.warn('No current offering available');
        setCurrentOffering(null);
        setAvailablePackages([]);
      }
    } catch (error) {
      console.error('Error loading offerings:', error);
      setCurrentOffering(null);
      setAvailablePackages([]);
    }
  }, []);

  // Check subscription status
  const checkSubscriptionStatus = useCallback(async () => {
    try {
      await refreshCustomerInfo();
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  }, [refreshCustomerInfo]);

  // Purchase a package
  const purchasePackage = useCallback(async (
    pkg: PurchasesPackage
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      setCustomerInfo(customerInfo);
      
      // Check if purchase granted Pro entitlement
      const hasPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      setIsPro(hasPro);
      
      return { success: true };
    } catch (error: any) {
      // Handle purchase errors
      if (error.userCancelled) {
        return { success: false, error: 'Purchase cancelled by user' };
      }
      
      if (error.code === 'PURCHASE_NOT_ALLOWED') {
        return { success: false, error: 'Purchases are not allowed on this device' };
      }
      
      if (error.code === 'PURCHASE_INVALID') {
        return { success: false, error: 'Purchase is invalid' };
      }
      
      console.error('Error purchasing package:', error);
      return { success: false, error: error.message || 'Purchase failed' };
    }
  }, []);

  // Restore purchases
  const restorePurchases = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      setCustomerInfo(customerInfo);
      
      // Check if restore granted Pro entitlement
      const hasPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
      setIsPro(hasPro);
      
      return { success: true };
    } catch (error: any) {
      console.error('Error restoring purchases:', error);
      return { success: false, error: error.message || 'Failed to restore purchases' };
    }
  }, []);

  // Present RevenueCat Paywall
  const presentPaywall = useCallback(async () => {
    try {
      if (!currentOffering) {
        // Try to load offerings if not available
        await loadOfferings();
        
        if (!currentOffering) {
          throw new Error('No offering available to display');
        }
      }

      // Check if RevenueCatUI is available
      if (!RevenueCatUI) {
        throw new Error('RevenueCat UI module not loaded');
      }

      // RevenueCatUI.presentPaywall is a static method
      // According to RevenueCat docs: https://www.revenuecat.com/docs
      if (typeof RevenueCatUI.presentPaywall !== 'function') {
        throw new Error('presentPaywall function not available in RevenueCat UI');
      }

      // Use RevenueCat UI paywall - returns PAYWALL_RESULT
      await RevenueCatUI.presentPaywall({
        offering: currentOffering,
      });
      
      // Refresh customer info after paywall interaction to check if purchase was made
      await refreshCustomerInfo();
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('Paywall dismissed by user');
        return;
      }
      
      console.error('Error presenting paywall:', error);
      // Re-throw error so caller can handle navigation to custom paywall
      throw error;
    }
  }, [currentOffering, loadOfferings, refreshCustomerInfo]);

  // Present Customer Center
  const presentCustomerCenter = useCallback(async () => {
    try {
      // Check if RevenueCatUI is available
      if (!RevenueCatUI) {
        throw new Error('RevenueCat UI module not loaded');
      }

      // RevenueCatUI.presentCustomerCenter is a static method
      if (typeof RevenueCatUI.presentCustomerCenter !== 'function') {
        throw new Error('presentCustomerCenter function not available in RevenueCat UI');
      }

      // Use RevenueCat UI customer center
      await RevenueCatUI.presentCustomerCenter();
      
      // Refresh customer info after customer center interaction
      await refreshCustomerInfo();
    } catch (error: any) {
      if (error.userCancelled) {
        console.log('Customer center dismissed by user');
        return;
      }
      console.error('Error presenting customer center:', error);
      throw error;
    }
  }, [refreshCustomerInfo]);

  // Get product info by identifier
  const getProductInfo = useCallback((identifier: string): PurchasesStoreProduct | null => {
    if (!currentOffering) return null;
    
    // Search through all packages
    for (const pkg of availablePackages) {
      // PurchasesPackage has a 'product' property, not 'storeProduct'
      const product = (pkg as any).product || (pkg as any).storeProduct;
      if (product && product.identifier === identifier) {
        return product;
      }
    }
    
    return null;
  }, [currentOffering, availablePackages]);

  // Initialize on mount
  useEffect(() => {
    initializeRevenueCat();
  }, [initializeRevenueCat]);

  // Listen for customer info updates (e.g., from background purchases)
  useEffect(() => {
    if (!isInitialized) return;

    try {
      // addCustomerInfoUpdateListener returns a function to remove the listener
      const removeListener = Purchases.addCustomerInfoUpdateListener((info) => {
        setCustomerInfo(info);
        const hasPro = info.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
        setIsPro(hasPro);
      });

      return () => {
        // Type assertion needed as TypeScript may not recognize the return type correctly
        if (typeof removeListener === 'function') {
          (removeListener as () => void)();
        }
      };
    } catch (error) {
      console.error('Error setting up customer info update listener:', error);
      return undefined;
    }
  }, [isInitialized]);

  const value: RevenueCatContextType = {
    isPro,
    isLoading,
    customerInfo,
    currentOffering,
    availablePackages,
    checkSubscriptionStatus,
    purchasePackage,
    restorePurchases,
    presentPaywall,
    presentCustomerCenter,
    getProductInfo,
    refreshCustomerInfo,
  };

  // Always wrap children with Provider, even during loading
  // This ensures the context is available to all child components
  return <RevenueCatContext.Provider value={value}>{children}</RevenueCatContext.Provider>;
};

// Hook to use RevenueCat context
export const useRevenueCat = (): RevenueCatContextType => {
  const context = useContext(RevenueCatContext);
  if (!context) {
    throw new Error('useRevenueCat must be used within RevenueCatProvider');
  }
  return context;
};

// Convenience hook for subscription status
export const useSubscription = () => {
  const { isPro, isLoading, checkSubscriptionStatus } = useRevenueCat();
  return { isPro, isLoading, checkSubscriptionStatus };
};


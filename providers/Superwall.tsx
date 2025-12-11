import { createContext, useContext, useEffect, useState } from 'react';
import { useUser, useSuperwallEvents } from 'expo-superwall';
import React from 'react';

interface SuperwallProps {
  isPro: boolean;
  isLoading: boolean;
  checkSubscriptionStatus: () => Promise<void>;
}

const SuperwallContext = createContext<SuperwallProps | null>(null);

// Provide Superwall functions to our app
export const SuperwallProvider = ({ children }: any) => {
  const [isPro, setIsPro] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { subscriptionStatus } = useUser();

  const checkSubscriptionStatus = async () => {
    try {
      // Check subscription status according to Superwall docs
      // subscriptionStatus.status can be "ACTIVE", "INACTIVE", or "UNKNOWN"
      if (subscriptionStatus?.status === 'ACTIVE') {
        setIsPro(true);
      } else {
        setIsPro(false);
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
      setIsPro(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Listen for subscription status changes
  useSuperwallEvents({
    onSubscriptionStatusChange: (status) => {
      if (status.status === 'ACTIVE') {
        setIsPro(true);
      } else {
        setIsPro(false);
      }
      setIsLoading(false);
    },
  });

  useEffect(() => {
    // Update subscription status when subscriptionStatus changes
    if (subscriptionStatus) {
      if (subscriptionStatus.status === 'ACTIVE') {
        setIsPro(true);
      } else {
        setIsPro(false);
      }
      setIsLoading(false);
    }
  }, [subscriptionStatus]);

  const value = {
    isPro,
    isLoading,
    checkSubscriptionStatus,
  };

  // Return empty fragment if provider is not ready
  if (isLoading) return <></>;

  return <SuperwallContext.Provider value={value}>{children}</SuperwallContext.Provider>;
};

// Export context for easy usage
export const useSuperwallSubscription = () => {
  return useContext(SuperwallContext) as SuperwallProps;
};


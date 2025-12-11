import { useEffect, useRef } from 'react';
import { View } from 'react-native';
import { usePlacement } from 'expo-superwall';
import { safeHaptic } from '@/lib/haptics';
import { useSuperwallSubscription } from '@/providers/Superwall';
import { usePostHog } from 'posthog-react-native';

interface PaywallScreenProps {
  onComplete: () => void;
  onBackToSummary: () => void;
}

export function PaywallScreen({ onComplete, onBackToSummary }: PaywallScreenProps) {
  const placement = 'campaign_trigger';
  const { checkSubscriptionStatus } = useSuperwallSubscription();
  const posthog = usePostHog();
  const paywallStartTimeRef = useRef<number>(Date.now());
  
  const { registerPlacement } = usePlacement({
    onError: (err) => {
      console.error('Placement Error:', err);
      safeHaptic.notification('error');
      
      // Track paywall error
      posthog?.capture('onboarding_paywall_error', {
        placement: placement,
        error: err,
      });
      
      // Go back to summary if there's an error
      onBackToSummary();
    },
    onPresent: (info) => {
      console.log('Paywall Presented:', info);
      safeHaptic.impact();
      paywallStartTimeRef.current = Date.now();
      
      // Track paywall presented
      posthog?.capture('onboarding_paywall_presented', {
        placement: placement,
        timestamp: new Date().toISOString(),
      });
    },
    onDismiss: async (info, result) => {
      console.log('Paywall Dismissed:', info, 'Result:', result);
      safeHaptic.impact();
      
      const duration = Date.now() - paywallStartTimeRef.current;
      
      // Check if user purchased
      if (result?.type === 'purchased') {
        // Track successful purchase
        posthog?.capture('onboarding_paywall_purchased', {
          placement: placement,
          duration_ms: duration,
          duration_seconds: Math.round(duration / 1000),
        });
        
        // User subscribed - check subscription status and complete onboarding
        await checkSubscriptionStatus();
        onComplete();
      } else {
        // Track paywall dismissed without purchase
        posthog?.capture('onboarding_paywall_dismissed', {
          placement: placement,
          purchased: false,
          duration_ms: duration,
          duration_seconds: Math.round(duration / 1000),
        });
        
        // User did not subscribe - go back to summary screen
        console.log('User did not subscribe - returning to summary');
        onBackToSummary();
      }
    },
  });

  // Track paywall screen mounted
  useEffect(() => {
    posthog?.capture('onboarding_paywall_screen_mounted', {
      placement: placement,
      timestamp: new Date().toISOString(),
    });
  }, [posthog]);

  // Automatically trigger the paywall when component mounts
  useEffect(() => {
    const triggerPaywall = async () => {
      try {
        await registerPlacement({
          placement: placement,
        });
      } catch (error) {
        console.error('Failed to trigger paywall:', error);
        
        // Track paywall trigger failure
        posthog?.capture('onboarding_paywall_trigger_failed', {
          placement: placement,
          error: error instanceof Error ? error.message : String(error),
        });
        
        // Go back to summary if paywall fails to trigger
        onBackToSummary();
      }
    };

    // Trigger immediately - no delay needed since we're coming from summary
    triggerPaywall();
  }, [registerPlacement, onBackToSummary, posthog]);

  // Return empty view - Superwall handles the paywall UI as a modal
  return <View style={{ flex: 1 }} />;
}


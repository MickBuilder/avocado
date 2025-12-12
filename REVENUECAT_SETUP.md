# RevenueCat Integration Guide

This document provides step-by-step instructions for setting up RevenueCat in your Avocado app.

## ✅ Installation Complete

The RevenueCat SDK has been installed and integrated into your app:
- `react-native-purchases` - Core RevenueCat SDK
- `react-native-purchases-ui` - UI components for paywall and customer center

## 🔑 API Key Configuration

The API key is currently hardcoded in `providers/RevenueCat.tsx`:
```typescript
const REVENUECAT_API_KEY = 'test_gsPKtlGtVerQRhfLwSeeaXJZifP';
```

**For production**, move this to an environment variable:
1. Add to your `.env` file: `EXPO_PUBLIC_REVENUECAT_KEY=your_production_key`
2. Update `providers/RevenueCat.tsx` to use: `process.env.EXPO_PUBLIC_REVENUECAT_KEY || REVENUECAT_API_KEY`

## 📱 RevenueCat Dashboard Setup

### 1. Create Products in App Store Connect / Google Play Console

You need to create two subscription products with these Product IDs:
- `001` - Avocado Premium (Monthly) subscription
- `002` - Avocado Premium (Annual) subscription

**iOS (App Store Connect):**
1. Go to your app → Features → In-App Purchases
2. Create subscriptions:
   - Product ID: `001` - Avocado Premium (Monthly)
   - Product ID: `002` - Avocado Premium (Annual)
3. The Product IDs (`001`, `002`) must match exactly

**Android (Google Play Console):**
1. Go to your app → Monetize → Products → Subscriptions
2. Create subscriptions:
   - Product ID: `001` - Avocado Premium (Monthly)
   - Product ID: `002` - Avocado Premium (Annual)
3. Use the same Product IDs: `001`, `002`

### 2. Configure RevenueCat Dashboard

1. **Log in to RevenueCat Dashboard**: https://app.revenuecat.com
2. **Create/Select Project**: Create a new project or select existing
3. **Add App**: Add your iOS and Android apps
4. **Configure Products**:
   - Go to Products → Create Product
   - Create products and link them to your App Store/Play Store products:
     - Product ID: `001` (Avocado Premium Monthly)
     - Product ID: `002` (Avocado Premium Annual)

### 3. Create Entitlement

1. Go to **Entitlements** → Create Entitlement
2. Name: `Avocado Pro`
3. Identifier: `Avocado Pro` (must match the code)
4. Attach both products (Product ID `001` and `002`) to this entitlement

### 4. Create Offering

1. Go to **Offerings** → Create Offering
2. Name: `default` (or any name)
3. Set as **Current Offering**
4. Add packages:
   - Package identifier: `monthly` → Attach product with Product ID `001`
   - Package identifier: `yearly` → Attach product with Product ID `002`
   
   **Note:** Package identifiers in RevenueCat can be any name (like `monthly`, `yearly`), but they must be linked to the actual Product IDs from App Store Connect (`001`, `002`).

### 5. Configure Paywall (Optional)

RevenueCat provides a paywall builder:
1. Go to **Paywalls** → Create Paywall
2. Design your paywall UI
3. The code will automatically use RevenueCat's paywall UI via `presentPaywall()`

## 🎯 Entitlement Checking

The app checks for the `Avocado Pro` entitlement:

```typescript
const PRO_ENTITLEMENT_ID = 'Avocado Pro';
const hasPro = customerInfo.entitlements.active[PRO_ENTITLEMENT_ID] !== undefined;
```

## 📦 Package Structure

### Provider (`providers/RevenueCat.tsx`)
- Initializes RevenueCat SDK
- Manages subscription state
- Provides hooks for subscription checking
- Handles purchases and restores
- Manages customer info

### Paywall Screen (`components/paywall/paywall-screen.tsx`)
- Custom paywall UI
- Displays available packages
- Handles purchases
- Shows restore purchases option
- Links to customer center for Pro users

### App Integration
- `app/_layout.tsx` - Wraps app with RevenueCatProvider
- `app/index.tsx` - Checks subscription status on launch
- `app/paywall.tsx` - Paywall route/page
- `app/(tabs)/history.tsx` - Shows subscription management button

## 🔧 Usage Examples

### Check Subscription Status
```typescript
import { useSubscription } from '@/providers/RevenueCat';

function MyComponent() {
  const { isPro, isLoading } = useSubscription();
  
  if (isLoading) return <Loading />;
  if (!isPro) return <PaywallPrompt />;
  return <ProContent />;
}
```

### Present Paywall
```typescript
import { useRevenueCat } from '@/providers/RevenueCat';

function MyComponent() {
  const { presentPaywall } = useRevenueCat();
  
  const handleUpgrade = async () => {
    try {
      await presentPaywall();
    } catch (error) {
      // Handle error
    }
  };
}
```

### Purchase Specific Package
```typescript
import { useRevenueCat } from '@/providers/RevenueCat';

function MyComponent() {
  const { availablePackages, purchasePackage } = useRevenueCat();
  // Find by Product ID from App Store Connect
  const monthlyPackage = availablePackages.find(pkg => pkg.storeProduct.identifier === '001');
  
  const handlePurchase = async () => {
    if (monthlyPackage) {
      const result = await purchasePackage(monthlyPackage);
      if (result.success) {
        // Purchase successful
      }
    }
  };
}
```

### Restore Purchases
```typescript
import { useRevenueCat } from '@/providers/RevenueCat';

function MyComponent() {
  const { restorePurchases } = useRevenueCat();
  
  const handleRestore = async () => {
    const result = await restorePurchases();
    if (result.success) {
      // Purchases restored
    }
  };
}
```

### Open Customer Center
```typescript
import { useRevenueCat } from '@/providers/RevenueCat';

function MyComponent() {
  const { presentCustomerCenter } = useRevenueCat();
  
  const handleManage = async () => {
    try {
      await presentCustomerCenter();
    } catch (error) {
      // Handle error
    }
  };
}
```

## 🧪 Testing

### Sandbox Testing (iOS)
1. Create sandbox test accounts in App Store Connect
2. Sign out of App Store on your device
3. When prompted during purchase, sign in with sandbox account
4. Test purchases will be free in sandbox

### Testing (Android)
1. Add test accounts in Google Play Console
2. Install app from internal testing track
3. Test purchases will be free for test accounts

### Test API Key
The current API key (`test_gsPKtlGtVerQRhfLwSeeaXJZifP`) is a test key. Replace with production key before release.

## 🚀 Best Practices

1. **Error Handling**: Always handle purchase errors gracefully
2. **Loading States**: Show loading indicators during async operations
3. **User Feedback**: Provide clear feedback for purchase success/failure
4. **Restore Purchases**: Always provide a way to restore purchases
5. **Customer Center**: Make it easy for users to manage subscriptions
6. **Analytics**: Track subscription events (already integrated with PostHog)

## 📊 Analytics Integration

The integration includes PostHog analytics tracking for:
- `subscription_purchased` - When a subscription is purchased
- `subscription_purchase_failed` - When a purchase fails
- `subscription_restored` - When purchases are restored
- `revenuecat_paywall_presented` - When paywall is shown
- `customer_center_opened` - When customer center is opened

## 🔐 Security Notes

- Never expose your RevenueCat API key in client-side code (use environment variables)
- RevenueCat handles receipt validation server-side
- Always verify entitlements server-side for critical features
- Use RevenueCat webhooks for server-side subscription validation

## 📚 Resources

- [RevenueCat Documentation](https://www.revenuecat.com/docs)
- [React Native Purchases SDK](https://www.revenuecat.com/docs/react-native)
- [RevenueCat Paywalls](https://www.revenuecat.com/docs/tools/paywalls)
- [Customer Center](https://www.revenuecat.com/docs/tools/customer-center)

## 🐛 Troubleshooting

### Packages not loading
- Check that offerings are configured in RevenueCat dashboard
- Verify products exist in App Store/Play Console
- Ensure API key is correct

### Purchases not working
- Check sandbox/test account setup
- Verify products are approved in App Store/Play Console
- Check RevenueCat dashboard for errors

### Entitlement not granting
- Verify entitlement identifier matches (`Avocado Pro`)
- Check that products are attached to entitlement
- Ensure offering includes the entitlement


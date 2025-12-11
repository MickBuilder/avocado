import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  brand?: string;
  imageUrl?: string;
  score: number;
  quality: 'Poor' | 'Fair' | 'Good' | 'Excellent';
  scannedAt: Date;
  isFavorite: boolean;
  // Open Food Facts data
  additives?: Array<{ name: string; code: string; severity: 'good' | 'caution' | 'warning' }>;
  allergens?: string[];
  dietInfo?: string[];
  ingredients?: string[];
  hasSeedOil?: boolean;
  hasPalmOil?: boolean;
  // Nutrition data
  calories?: number; // Energy in kcal
  sugars?: number; // Sugars in g per 100g
  salt?: number; // Salt in g per 100g
}

interface AppState {
  products: Product[];
  favorites: string[]; // product IDs
  hasCompletedOnboarding: boolean;
  addProduct: (product: Product) => void;
  removeProduct: (id: string) => void;
  removeProducts: (ids: string[]) => void;
  toggleFavorite: (id: string) => void;
  getProduct: (id: string) => Product | undefined;
  getFavorites: () => Product[];
  completeOnboarding: () => void;
  resetOnboarding: () => void;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      products: [],
      favorites: [],
      hasCompletedOnboarding: false,

      addProduct: (product) =>
        set((state) => {
          // Check if product already exists (by barcode)
          const existingIndex = state.products.findIndex((p) => p.barcode === product.barcode);
          if (existingIndex >= 0) {
            // Update existing product
            const updated = [...state.products];
            updated[existingIndex] = { ...product, scannedAt: new Date() };
            return { products: updated };
          }
          // Add new product
          return { products: [product, ...state.products] };
        }),

      removeProduct: (id) =>
        set((state) => ({
          products: state.products.filter((p) => p.id !== id),
          favorites: state.favorites.filter((fid) => fid !== id),
        })),

      removeProducts: (ids) =>
        set((state) => ({
          products: state.products.filter((p) => !ids.includes(p.id)),
          favorites: state.favorites.filter((fid) => !ids.includes(fid)),
        })),

      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((fid) => fid !== id)
            : [...state.favorites, id],
        })),

      getProduct: (id) => get().products.find((p) => p.id === id),

      getFavorites: () => {
        const state = get();
        return state.products.filter((p) => state.favorites.includes(p.id));
      },

      completeOnboarding: () => {
        set({ hasCompletedOnboarding: true });
      },

      resetOnboarding: () => {
        set({ hasCompletedOnboarding: false });
      },
    }),
    {
      name: 'avocado-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Convert date strings back to Date objects when loading from storage
      partialize: (state) => state,
      onRehydrateStorage: () => (state) => {
        if (state?.products) {
          state.products = state.products.map((product) => ({
            ...product,
            scannedAt: product.scannedAt instanceof Date 
              ? product.scannedAt 
              : new Date(product.scannedAt),
          }));
        }
      },
    }
  )
);

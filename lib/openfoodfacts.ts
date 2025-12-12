import { OpenFoodFacts, type Product } from '@openfoodfacts/openfoodfacts-nodejs';

// Create client instance
const client = new OpenFoodFacts(globalThis.fetch);

export type { Product };

export async function getProductByBarcode(barcode: string): Promise<Product | null> {
  try {
    const response = await client.apiv2.getProductV2(barcode);
    if (response.error || !response.data) {
      return null;
    }
    return response.data.product as Product;
  } catch (error) {
    console.error('Error fetching product:', error);
    return null;
  }
}

export async function searchProducts(query: string): Promise<Product[]> {
  try {
    // Use direct API endpoint for text search (SDK search is tag-based)
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(
        query
      )}&search_simple=1&action=process&json=1&page_size=20`
    );
    const data = await response.json();
    return (data.products || []) as Product[];
  } catch (error) {
    console.error('Error searching products:', error);
    return [];
  }
}

// Calculate score from Nutri-Score or other factors
export function calculateScore(product: Product): number {
  // Use Nutri-Score if available (converted to 0-100 scale)
  if (product.nutriscore_score !== undefined && product.nutriscore_score !== null) {
    // Nutri-Score ranges from -15 (best) to 40 (worst)
    // Convert to 0-100 scale where higher is better
    const nutriScore = product.nutriscore_score;
    const normalized = Math.max(0, Math.min(100, ((40 - nutriScore) / 55) * 100));
    return Math.round(normalized);
  }

  // Fallback: calculate based on additives and other factors
  let score = 50; // Base score

  // Deduct points for additives
  if (product.additives_tags && product.additives_tags.length > 0) {
    score -= product.additives_tags.length * 5;
  }

  // Deduct points for palm oil - check tags arrays
  const hasPalmOil =
    (product.ingredients_from_palm_oil_tags && product.ingredients_from_palm_oil_tags.length > 0) ||
    (product.ingredients_that_may_be_from_palm_oil_tags &&
      product.ingredients_that_may_be_from_palm_oil_tags.length > 0);
  if (hasPalmOil) {
    score -= 10;
  }

  return Math.max(0, Math.min(100, score));
}

// Determine quality label
export function getQualityLabel(score: number): 'Avoid' | 'Limit' | 'Good' | 'Excellent' {
  if (score >= 75) return 'Excellent';
  if (score >= 60) return 'Good';
  if (score >= 40) return 'Limit';
  return 'Avoid';
}

// Get quality color based on score - using new color scheme
export function getQualityColorFromScore(score: number): string {
  if (score >= 75) {
    // Excellent - Dark green
    return '#2E7D32';
  } else if (score >= 50) {
    // Good - Light green
    return '#8BC34A';
  } else if (score >= 25) {
    // Limit/Poor - Orange
    return '#FF9800';
  } else {
    // Avoid/Bad - Red
    return '#F44336';
  }
}

// Get quality color - using new color scheme
export function getQualityColor(quality: 'Avoid' | 'Limit' | 'Good' | 'Excellent'): string {
  switch (quality) {
    case 'Excellent':
      return '#2E7D32'; // Dark green
    case 'Good':
      return '#8BC34A'; // Light green
    case 'Limit':
      return '#FF9800'; // Orange
    case 'Avoid':
      return '#F44336'; // Red
    default:
      return '#518E22'; // Medium green (fallback)
  }
}

// Cache for additive names to avoid repeated API calls
const additiveNameCache = new Map<string, string>();
let additivesDataCache: Record<string, any> | null = null;

// Load all additives data from Open Food Facts
async function loadAdditivesData(): Promise<Record<string, any> | any[]> {
  if (additivesDataCache) {
    return additivesDataCache;
  }

  try {
    const response = await fetch('https://world.openfoodfacts.org/facets/additives.json');
    if (response.ok) {
      const data = await response.json();
      // The response might be wrapped in a structure, check for tags or direct object
      additivesDataCache = data.tags || data;
      return additivesDataCache || [];
    }
  } catch (error) {
    console.error('Error loading additives data:', error);
  }

  return [];
}

// Fetch additive name from Open Food Facts additives data
async function getAdditiveName(code: string): Promise<string> {
  // Check cache first
  if (additiveNameCache.has(code)) {
    return additiveNameCache.get(code)!;
  }

  try {
    // Extract E-number from code (e.g., "E322" -> "322")
    const eNumber = code.replace(/^E/i, '').toLowerCase();
    
    // Load additives data
    const additivesData = await loadAdditivesData();
    
    // The facets API returns an array of objects with id and name
    // Format: [{id: "en:e170", name: "Calcium carbonates"}, ...]
    if (Array.isArray(additivesData)) {
      const additive = additivesData.find(
        (item: any) => 
          item.id === `en:e${eNumber}` || 
          item.id === `en:E${eNumber.toUpperCase()}` ||
          item.id?.toLowerCase() === `en:e${eNumber}`
      );
      
      if (additive && additive.name) {
        additiveNameCache.set(code, additive.name);
        return additive.name;
      }
    } else {
      // Try object format
      const additive = additivesData[eNumber] || 
                       additivesData[`e${eNumber}`] || 
                       additivesData[code.toLowerCase()] ||
                       additivesData[code.toUpperCase()];
      
      if (additive) {
        const name = typeof additive === 'string' 
          ? additive 
          : (additive.name || additive.Name || additive.NAME);
        
        if (name && name !== code && name.toLowerCase() !== code.toLowerCase()) {
          additiveNameCache.set(code, name);
          return name;
        }
      }
    }
  } catch (error) {
    console.error(`Error fetching additive name for ${code}:`, error);
  }

  // Fallback to code if API fails
  additiveNameCache.set(code, code);
  return code;
}

// Parse additives from Open Food Facts format
export async function parseAdditives(
  additivesTags?: string[] | null
): Promise<Array<{ name: string; code: string; severity: 'good' | 'caution' | 'warning' }>> {
  if (!additivesTags || additivesTags.length === 0) return [];

  // Fetch all additive names in parallel
  const additives = await Promise.all(
    additivesTags.map(async (tag) => {
      // Format: "en:e322" -> "E322"
      const code = tag.replace(/^[a-z]{2}:/, '').toUpperCase();
      const name = await getAdditiveName(code);
      
      // Ensure we got a real name, not just the code
      const finalName = name && name !== code ? name : code;

      // Determine severity (simplified - you'd want a proper mapping)
      let severity: 'good' | 'caution' | 'warning' = 'caution';
      if (code.startsWith('E1')) severity = 'good';
      else if (code.startsWith('E2')) severity = 'caution';
      else if (code.startsWith('E3') || code.startsWith('E4') || code.startsWith('E5'))
        severity = 'warning';

      return { name: finalName, code, severity };
    })
  );

  return additives;
}

// Check for seed oils (simplified check)
export function hasSeedOil(ingredients?: string[] | null): boolean {
  if (!ingredients || ingredients.length === 0) return false;
  const seedOilKeywords = [
    'soybean oil',
    'canola oil',
    'rapeseed oil',
    'sunflower oil',
    'corn oil',
    'cottonseed oil',
    'safflower oil',
    'grapeseed oil',
  ];
  const ingredientsText = ingredients.join(' ').toLowerCase();
  return seedOilKeywords.some((keyword) => ingredientsText.includes(keyword));
}

// Extract calories (energy) from product
export function getCalories(product: Product): number | undefined {
  // Energy is typically in kJ, convert to kcal (divide by 4.184)
  // Check for energy-kcal first, then energy-kj
  const energyKcal = (product as any).nutriments?.['energy-kcal'];
  const energyKj = (product as any).nutriments?.['energy-kj'];
  
  if (energyKcal !== undefined && energyKcal !== null) {
    return Math.round(energyKcal);
  }
  if (energyKj !== undefined && energyKj !== null) {
    return Math.round(energyKj / 4.184);
  }
  return undefined;
}

// Extract sugars from product (g per 100g)
export function getSugars(product: Product): number | undefined {
  const sugars = (product as any).nutriments?.sugars;
  if (sugars !== undefined && sugars !== null) {
    return parseFloat(sugars);
  }
  return undefined;
}

// Extract salt from product (g per 100g)
export function getSalt(product: Product): number | undefined {
  // Salt can be stored as salt or sodium (sodium * 2.5 = salt)
  const salt = (product as any).nutriments?.salt;
  const sodium = (product as any).nutriments?.sodium;
  
  if (salt !== undefined && salt !== null) {
    return parseFloat(salt);
  }
  if (sodium !== undefined && sodium !== null) {
    // Convert sodium to salt (sodium * 2.5 = salt)
    return parseFloat(sodium) * 2.5;
  }
  return undefined;
}

// Format relative time
export function formatRelativeTime(date: Date | string): string {
  // Handle both Date objects and date strings (from AsyncStorage)
  const dateObj = date instanceof Date ? date : new Date(date);
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) {
    return 'Unknown';
  }
  
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return dateObj.toLocaleDateString();
}

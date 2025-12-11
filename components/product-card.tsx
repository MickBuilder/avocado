import { View, Text, Image, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '@/store/store';
import { formatRelativeTime, getQualityColor } from '@/lib/openfoodfacts';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  onPress: () => void;
  isSelectMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

export function ProductCard({ product, onPress, isSelectMode = false, isSelected = false, onToggleSelect }: ProductCardProps) {
  const qualityColor = getQualityColor(product.quality);

  const handlePress = () => {
    if (isSelectMode && onToggleSelect) {
      onToggleSelect();
    } else {
      onPress();
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      className="rounded-lg shadow-sm mb-3 p-4 flex-row items-center"
      style={{ 
        backgroundColor: '#FFFFFF',
        opacity: isSelectMode && isSelected ? 0.6 : 1,
        borderWidth: isSelectMode && isSelected ? 2 : 0,
        borderColor: isSelectMode && isSelected ? '#97C536' : 'transparent',
      }}
    >
      {/* Selection Checkbox */}
      {isSelectMode && (
        <View className="mr-3">
          <View
            className="w-6 h-6 rounded-full border-2 items-center justify-center"
            style={{ 
              borderColor: isSelected ? '#97C536' : '#D1D1D1',
              backgroundColor: isSelected ? '#97C536' : 'transparent',
            }}
          >
            {isSelected && (
              <Ionicons name="checkmark" size={16} color="#FFFFFF" />
            )}
          </View>
        </View>
      )}

      {/* Product Image */}
      <View className="w-16 h-16 rounded-xl overflow-hidden mr-4" style={{ backgroundColor: '#F1F3ED' }}>
        {product.imageUrl ? (
          <Image source={{ uri: product.imageUrl }} className="w-full h-full" resizeMode="cover" />
        ) : (
          <View className="w-full h-full items-center justify-center">
            <Ionicons name="image-outline" size={24} color="#518E22" />
          </View>
        )}
      </View>

      {/* Product Info */}
      <View className="flex-1">
        <Text className="text-base font-semibold mb-1" style={{ color: '#2C3F22' }} numberOfLines={2}>
          {product.name}
        </Text>
        <View className="flex-row items-center gap-2">
          {/* Score Badge */}
          <View
            className="px-2 py-1 rounded-full"
            style={{ backgroundColor: `${qualityColor}20` }}
          >
            <Text
              className="text-xs font-semibold"
              style={{ color: qualityColor }}
            >{`${product.score}/100`}</Text>
          </View>
          {/* Quality Label */}
          <Text className="text-sm" style={{ color: qualityColor }}>
            {product.quality}
          </Text>
        </View>
      </View>

      {/* Timestamp */}
      {!isSelectMode && (
        <Text className="text-xs ml-2" style={{ color: '#518E22' }}>
          {formatRelativeTime(product.scannedAt)}
        </Text>
      )}

      {/* Arrow - only show when not in select mode */}
      {!isSelectMode && (
        <Ionicons name="chevron-forward-outline" size={24} color="#518E22" style={{ marginLeft: 8 }} />
      )}
    </Pressable>
  );
}


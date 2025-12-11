import { View, Text } from 'react-native';
import { getQualityColor, getQualityLabel } from '@/lib/openfoodfacts';
import { cn } from '@/lib/utils';

interface ScoreBadgeProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = true }: ScoreBadgeProps) {
  const quality = getQualityLabel(score);
  const color = getQualityColor(quality);

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-1.5 text-base',
  };

  return (
    <View className="flex-row items-center gap-2">
      <View
        className={cn('rounded-full', sizeClasses[size])}
        style={{ backgroundColor: `${color}20` }}
      >
        <Text className={cn('font-semibold')} style={{ color: color }}>
          {score}/100
        </Text>
      </View>
      {showLabel && (
        <Text className="text-sm font-medium" style={{ color: color }}>
          {quality}
        </Text>
      )}
    </View>
  );
}


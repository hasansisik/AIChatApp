import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { AICategory } from '@/data/AICategories';
import { FontSizes } from '@/constants/Fonts';

interface GridItemProps {
  item: AICategory;
  onPress?: (item: AICategory) => void;
  onFavoritePress?: (item: AICategory) => void;
}

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 3; // 3 columns with padding

const GridItem: React.FC<GridItemProps> = ({ item, onPress, onFavoritePress }) => {
  const handleFavoritePress = () => {
    onFavoritePress?.(item);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: itemWidth }]}
      onPress={() => onPress?.(item)}
      activeOpacity={0.9}
    >
      {/* Full Background Image */}
      <Image
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Favorite Icon */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={handleFavoritePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={item.isFavorite ? "heart" : "heart-outline"}
          size={16}
          color={item.isFavorite ? Colors.error : Colors.lightWhite}
        />
      </TouchableOpacity>

      {/* Category Overlay */}
      <View style={styles.categoryOverlay}>
        <ReusableText
          text={item.category}
          family="medium"
          size={8}
          color={Colors.lightWhite}
          style={styles.categoryLabel}
        />
        <ReusableText
          text={item.title}
          family="bold"
          size={FontSizes.small}
          color={Colors.lightWhite}
          style={styles.categoryTitle}
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 180,
    borderRadius: 25,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  favoriteButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    marginHorizontal: 6,
    marginBottom: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryLabel: {
    opacity: 0.8,
    marginBottom: 2,
  },
  categoryTitle: {
    lineHeight: 16,
  },
});

export default GridItem;

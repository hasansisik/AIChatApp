import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { AICategory } from '@/data/AICategories';
import { FontSizes } from '@/constants/Fonts';

interface AIItemProps {
  item: AICategory;
  onPress?: (item: AICategory) => void;
  onFavoritePress?: (item: AICategory) => void;
}

const { width } = Dimensions.get('window');
const itemWidth = (width - 48) / 2; // 48 = padding (16*2) + gap (16)

const AIItem: React.FC<AIItemProps> = ({ item, onPress, onFavoritePress }) => {
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
          size={20}
          color={item.isFavorite ? Colors.error : Colors.lightWhite}
        />
      </TouchableOpacity>

      {/* Category Overlay */}
      <View style={styles.categoryOverlay}>
        <ReusableText
          text={item.category}
          family="medium"
          size={10}
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
    height: 275,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 16,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 32,
    height: 32,
    borderRadius: 16,
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
    marginHorizontal: 10,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
  },
  categoryLabel: {
    opacity: 0.8,
    marginBottom: 4,
  },
  categoryTitle: {
    lineHeight: 20,
  },
});

export default AIItem;

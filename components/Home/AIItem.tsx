import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  const { user } = useSelector((state: any) => state.user);
  const isFavorite = user?.favoriteAIs?.includes(item.id) || false;
  const [isFavoriteProcessing, setIsFavoriteProcessing] = useState(false);

  const handleFavoritePress = () => {
    if (isFavoriteProcessing) return;
    setIsFavoriteProcessing(true);
    onFavoritePress?.(item);
    // Reset after a short delay to allow Redux state to update
    setTimeout(() => setIsFavoriteProcessing(false), 100);
  };

  const handleItemPress = () => {
    // Eğer favorite button'a tıklanmışsa, item press'i engelle
    if (isFavoriteProcessing) return;
    onPress?.(item);
  };

  return (
    <TouchableOpacity
      style={[styles.container, { width: itemWidth }]}
      onPress={handleItemPress}
      activeOpacity={0.9}
    >
      {/* Full Background Image */}
      <Image
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={styles.backgroundImage}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
        priority="high"
        recyclingKey={item.id}
      />
      
      {/* Favorite Icon */}
      <TouchableOpacity
        style={styles.favoriteButton}
        onPress={handleFavoritePress}
        activeOpacity={0.7}
      >
        <Ionicons
          name={isFavorite ? "heart" : "heart-outline"}
          size={20}
          color={isFavorite ? Colors.error : Colors.lightWhite}
        />
      </TouchableOpacity>

      {/* Category Overlay */}
      <View style={styles.categoryOverlay}>
        <ReusableText
          text={item.category ? t(item.category, { defaultValue: item.category }) : item.category}
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

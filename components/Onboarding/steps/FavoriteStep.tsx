import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { Sizes } from '@/constants/Sizes';

interface FavoriteStepProps {
  data: {
    favorites: string[];
  };
  onUpdate: (key: string, value: any) => void;
}

const favorites = [
  { id: 'muzik', title: 'Müzik', emoji: '🎵' },
  { id: 'film', title: 'Film', emoji: '🎬' },
  { id: 'kitap', title: 'Kitap', emoji: '📚' },
  { id: 'spor', title: 'Spor', emoji: '⚽' },
  { id: 'sanat', title: 'Sanat', emoji: '🎨' },
  { id: 'teknoloji', title: 'Teknoloji', emoji: '💻' },
  { id: 'yemek', title: 'Yemek', emoji: '🍕' },
  { id: 'seyahat', title: 'Seyahat', emoji: '✈️' },
  { id: 'oyun', title: 'Oyun', emoji: '🎮' },
  { id: 'dogal', title: 'Doğa', emoji: '🌿' },
  { id: 'moda', title: 'Moda', emoji: '👗' },
  { id: 'bilim', title: 'Bilim', emoji: '🔬' },
];

const FavoriteStep: React.FC<FavoriteStepProps> = ({ data, onUpdate }) => {
  const handleToggle = (favoriteId: string) => {
    const currentFavorites = data.favorites || [];
    const isSelected = currentFavorites.includes(favoriteId);
    
    if (isSelected) {
      onUpdate('favorites', currentFavorites.filter(id => id !== favoriteId));
    } else {
      onUpdate('favorites', [...currentFavorites, favoriteId]);
    }
  };

  const isSelected = (favoriteId: string) => {
    return data.favorites?.includes(favoriteId) || false;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <ReusableText
          text="En sevdiğiniz şeyler nelerdir?"
          family="bold"
          size={24}
          color={Colors.black}
          align="left"
          style={styles.title}
        />
        <ReusableText
          text="Birden fazla seçebilirsiniz"
          family="regular"
          size={16}
          color={Colors.gray}
          align="left"
          style={styles.subtitle}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.optionsContainer}
        showsVerticalScrollIndicator={false}
      >
        {favorites.map((favorite) => (
          <TouchableOpacity
            key={favorite.id}
            style={[
              styles.optionButton,
              isSelected(favorite.id) && styles.optionButtonSelected,
            ]}
            onPress={() => handleToggle(favorite.id)}
          >
            <ReusableText
              text={favorite.emoji}
              family="regular"
              size={32}
              align="center"
              style={styles.emoji}
            />
            <ReusableText
              text={favorite.title}
              family="medium"
              size={16}
              color={isSelected(favorite.id) ? Colors.white : Colors.black}
              align="center"
              style={styles.optionText}
            />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    marginBottom: 8,
    lineHeight: 32,
  },
  subtitle: {
    lineHeight: 24,
  },
  optionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  optionButton: {
    width: (Sizes.screenWidth - 100) / 4, // 4 columns
    height: (Sizes.screenWidth - 100) / 4, // Square to make it circular
    backgroundColor: Colors.white,
    borderRadius: (Sizes.screenWidth - 100) / 8, // Perfect circle
    borderWidth: 2,
    borderColor: Colors.lightGray,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  optionButtonSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  emoji: {
    marginBottom: 2,
    fontSize: 16,
  },
  optionText: {
    lineHeight: 14,
    fontSize: 10,
  },
});

export default FavoriteStep;

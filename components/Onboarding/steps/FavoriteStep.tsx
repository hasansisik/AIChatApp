import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { Sizes } from '@/constants/Sizes';

interface FavoriteStepProps {
  data: {
    favorites: string[];
  };
  onUpdate: (key: string, value: any) => void;
}

const FavoriteStep: React.FC<FavoriteStepProps> = ({ data, onUpdate }) => {
  const { t } = useTranslation();
  
  const favorites = [
    { id: 'muzik', title: t('onboarding.favoriteStep.options.muzik'), emoji: '🎵' },
    { id: 'film', title: t('onboarding.favoriteStep.options.film'), emoji: '🎬' },
    { id: 'kitap', title: t('onboarding.favoriteStep.options.kitap'), emoji: '📚' },
    { id: 'spor', title: t('onboarding.favoriteStep.options.spor'), emoji: '⚽' },
    { id: 'sanat', title: t('onboarding.favoriteStep.options.sanat'), emoji: '🎨' },
    { id: 'teknoloji', title: t('onboarding.favoriteStep.options.teknoloji'), emoji: '💻' },
    { id: 'yemek', title: t('onboarding.favoriteStep.options.yemek'), emoji: '🍕' },
    { id: 'seyahat', title: t('onboarding.favoriteStep.options.seyahat'), emoji: '✈️' },
    { id: 'oyun', title: t('onboarding.favoriteStep.options.oyun'), emoji: '🎮' },
    { id: 'dogal', title: t('onboarding.favoriteStep.options.dogal'), emoji: '🌿' },
    { id: 'moda', title: t('onboarding.favoriteStep.options.moda'), emoji: '👗' },
    { id: 'bilim', title: t('onboarding.favoriteStep.options.bilim'), emoji: '🔬' },
  ];

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
          text={t('onboarding.favoriteStep.title')}
          family="bold"
          size={24}
          color={Colors.black}
          align="left"
          style={styles.title}
        />
        <ReusableText
          text={t('onboarding.favoriteStep.subtitle')}
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

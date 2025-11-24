import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import CategoryCard from './CategoryCard';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';

interface CategoriesProps {
  onCategoryPress?: (category: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ onCategoryPress }) => {
  const { t } = useTranslation();
  
  return (
    <View style={styles.container}>

      <View style={styles.cardsContainer}>
        {/* Left side - Large Live Chat Card */}
        <CategoryCard
          title={t('home.categories.liveChat')}
          icon="mic"
          backgroundColor={Colors.lightYellow}
          iconBackgroundColor={Colors.lightYellow}
          onPress={() => onCategoryPress?.(t('home.categories.liveChat'))}
          isLarge={true}
        />

        {/* Right side - Two smaller cards stacked */}
        <View style={styles.rightColumn}>
          <CategoryCard
            title={t('home.categories.contact')}
            icon="chatbubble"
            backgroundColor={Colors.lightPurple}
            iconBackgroundColor={Colors.lightPurple}
            onPress={() => onCategoryPress?.(t('home.categories.contact'))}
            isLarge={false}
          />
          
          <CategoryCard
            title={t('home.categories.courseSessions')}
            icon="school"
            backgroundColor={Colors.lightPink}
            iconBackgroundColor={Colors.lightPink}
            onPress={() => onCategoryPress?.(t('home.categories.courseSessions'))}
            isLarge={false}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 20,
  },
  sectionTitle: {
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    gap: 10,
    minHeight: 200, // Minimum height, can expand based on content
  },
  rightColumn: {
    flex: 1,
    gap: 10,
    justifyContent: 'space-between',
  },
});

export default Categories;

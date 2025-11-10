import React from 'react';
import { View, StyleSheet } from 'react-native';
import CategoryCard from './CategoryCard';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';

interface CategoriesProps {
  onCategoryPress?: (category: string) => void;
}

const Categories: React.FC<CategoriesProps> = ({ onCategoryPress }) => {
  return (
    <View style={styles.container}>

      <View style={styles.cardsContainer}>
        {/* Left side - Large Live Chat Card */}
        <CategoryCard
          title="Canlı Sohbet"
          icon="mic"
          backgroundColor={Colors.lightYellow}
          iconBackgroundColor={Colors.lightYellow}
          onPress={() => onCategoryPress?.('Canlı Sohbet')}
          isLarge={true}
        />

        {/* Right side - Two smaller cards stacked */}
        <View style={styles.rightColumn}>
          <CategoryCard
            title="İletişim"
            icon="chatbubble"
            backgroundColor={Colors.lightPurple}
            iconBackgroundColor={Colors.lightPurple}
            onPress={() => onCategoryPress?.('İletişim')}
            isLarge={false}
          />
          
          <CategoryCard
            title="Kurs Seansları"
            icon="school"
            backgroundColor={Colors.lightPink}
            iconBackgroundColor={Colors.lightPink}
            onPress={() => onCategoryPress?.('Kurs Seansları')}
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

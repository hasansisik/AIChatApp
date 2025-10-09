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
          title="Live Conversation"
          icon="mic"
          backgroundColor={Colors.lightYellow}
          iconBackgroundColor={Colors.lightYellow}
          onPress={() => onCategoryPress?.('Live Conversation')}
          isLarge={true}
        />

        {/* Right side - Two smaller cards stacked */}
        <View style={styles.rightColumn}>
          <CategoryCard
            title="Vocabulary Practice"
            icon="book"
            backgroundColor={Colors.lightPurple}
            iconBackgroundColor={Colors.lightPurple}
            onPress={() => onCategoryPress?.('Vocabulary Practice')}
            isLarge={false}
          />
          
          <CategoryCard
            title="Grammar Lessons"
            icon="school"
            backgroundColor={Colors.lightPink}
            iconBackgroundColor={Colors.lightPink}
            onPress={() => onCategoryPress?.('Grammar Lessons')}
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

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
        {/* Left side - Large Chat with AI Card */}
        <CategoryCard
          title="Chat with AI"
          icon="chatbubbles"
          backgroundColor={Colors.lightYellow}
          iconBackgroundColor={Colors.lightYellow}
          onPress={() => onCategoryPress?.('Chat with AI')}
          isLarge={true}
        />

        {/* Right side - Two smaller cards stacked */}
        <View style={styles.rightColumn}>
          <CategoryCard
            title="Create AI Image"
            icon="image"
            backgroundColor={Colors.lightPurple}
            iconBackgroundColor={Colors.lightPurple}
            onPress={() => onCategoryPress?.('Create AI Image')}
            isLarge={false}
          />
          
          <CategoryCard
            title="Create AI Video"
            icon="videocam"
            backgroundColor={Colors.lightPink}
            iconBackgroundColor={Colors.lightPink}
            onPress={() => onCategoryPress?.('Create AI Video')}
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

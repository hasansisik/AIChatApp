import React from 'react';
import { View, StyleSheet, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from "@/hooks/useThemeColor";
import HeaderList from '@/components/Home/HeaderList';
import HorizontalList from '@/components/Home/HorizontalList';
import GridList from '@/components/Home/GridList';
import { AICategory } from '@/data/AICategories';

const List = () => {
  const router = useRouter();

  const handleSearchPress = () => {
    // Handle search functionality
    console.log('Search pressed');
  };

  const handleProfilePress = () => {
    // Handle profile navigation
    console.log('Profile pressed');
  };

  const handleItemPress = (item: AICategory) => {
    // Navigate to AI detail page
    router.push(`/ai-detail?id=${item.id}`);
  };

  const handleFavoritePress = (item: AICategory) => {
    // Handle favorite press
    console.log('Favorite pressed:', item);
  };

  const handleCategoryPress = (categoryType: string) => {
    // Handle category press
    console.log('Category pressed:', categoryType);
  };

  return (
    <View style={styles.container}>
      <HeaderList 
        onSearchPress={handleSearchPress}
        onProfilePress={handleProfilePress}
      />
      <ScrollView style={styles.content}>
        <HorizontalList 
          onItemPress={handleItemPress}
          onFavoritePress={handleFavoritePress}
          onCategoryPress={handleCategoryPress}
        />
        <GridList 
          onItemPress={handleItemPress}
          onFavoritePress={handleFavoritePress}
          onCategoryPress={handleCategoryPress}
        />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === "ios" ? 40 : 20,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default List;

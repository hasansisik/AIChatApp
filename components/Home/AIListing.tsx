import React, { useState } from 'react';
import { View, StyleSheet, FlatList } from 'react-native';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import AIItem from './AIItem';
import CategoryFilterComponent from './CategoryFilter';
import { AICategory, aiCategories, categoryFilters } from '@/data/AICategories';

interface AIListingProps {
  onItemPress?: (item: AICategory) => void;
}

const AIListing: React.FC<AIListingProps> = ({ onItemPress }) => {
  const [items, setItems] = useState<AICategory[]>(aiCategories);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const handleFavoritePress = (item: AICategory) => {
    setItems(prevItems =>
      prevItems.map(prevItem =>
        prevItem.id === item.id
          ? { ...prevItem, isFavorite: !prevItem.isFavorite }
          : prevItem
      )
    );
  };

  const handleFilterPress = (filterType: string) => {
    setSelectedFilter(filterType);
  };

  const handleCategoryPress = (categoryType: string) => {
    setSelectedFilter(categoryType);
  };

  const filteredItems = selectedFilter === 'all' 
    ? items 
    : items.filter(item => item.categoryType === selectedFilter);

  const renderItem = ({ item }: { item: AICategory }) => (
    <AIItem
      item={item}
      onPress={onItemPress}
      onFavoritePress={handleFavoritePress}
      onCategoryPress={handleCategoryPress}
    />
  );

  return (
    <View style={styles.container}>
      <CategoryFilterComponent
        filters={categoryFilters}
        selectedFilter={selectedFilter}
        onFilterPress={handleFilterPress}
      />
      
      <FlatList
        data={filteredItems}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  listContainer: {
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
    paddingHorizontal: 0,
  },
});

export default AIListing;

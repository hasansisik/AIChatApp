import React, { useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import AIItem from './AIItem';
import CategoryFilterComponent from './CategoryFilter';
import { AICategory, aiCategories, categoryFilters } from '@/data/AICategories';

interface AIListingProps {
  onItemPress?: (item: AICategory) => void;
  onFavoritePress?: (item: AICategory) => void;
}

const AIListing: React.FC<AIListingProps> = ({ onItemPress, onFavoritePress }) => {
  const [items, setItems] = useState<AICategory[]>(aiCategories);
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const handleFilterPress = (filterType: string) => {
    setSelectedFilter(filterType);
  };


  const filteredItems = selectedFilter === 'all' 
    ? items 
    : items.filter(item => item.categoryType === selectedFilter);

  return (
    <View style={styles.container}>
      <CategoryFilterComponent
        filters={categoryFilters}
        selectedFilter={selectedFilter}
        onFilterPress={handleFilterPress}
      />
      
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      >
        <View style={styles.gridContainer}>
          {filteredItems.map((item) => (
            <AIItem
              key={item.id}
              item={item}
              onPress={onItemPress}
              onFavoritePress={onFavoritePress}
            />
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
  },
  listContainer: {
    paddingBottom: 120,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
});

export default AIListing;

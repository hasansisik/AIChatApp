import React from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { aiCategories, AICategory } from '@/data/AICategories';
import GridItem from './GridItem';

interface GridListProps {
  onItemPress?: (item: AICategory) => void;
  onFavoritePress?: (item: AICategory) => void;
}

const GridList: React.FC<GridListProps> = ({ 
  onItemPress, 
  onFavoritePress
}) => {
  const renderItem = ({ item }: { item: AICategory }) => (
    <GridItem
      item={item}
      onPress={onItemPress}
      onFavoritePress={onFavoritePress}
    />
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={aiCategories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        columnWrapperStyle={styles.row}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 10,
  },
  listContainer: {
    paddingBottom: 100,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 10,
  },
});

export default GridList;

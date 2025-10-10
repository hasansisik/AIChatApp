import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, FlatList, Dimensions } from 'react-native';
import { Colors } from '@/hooks/useThemeColor';
import { aiCategories, AICategory } from '@/data/AICategories';
import ListItem from './ListItem';
import ReusableText from '@/components/ui/ReusableText';
import { FontSizes } from '@/constants/Fonts';

interface HorizontalListProps {
  onItemPress?: (item: AICategory) => void;
  onFavoritePress?: (item: AICategory) => void;
  onCategoryPress?: (categoryType: string) => void;
}

const { width } = Dimensions.get('window');
const itemWidth = width * 0.7;
const gap = 10;
const snapInterval = itemWidth + gap;

const HorizontalList: React.FC<HorizontalListProps> = ({ 
  onItemPress, 
  onFavoritePress, 
  onCategoryPress 
}) => {
  const flatListRef = useRef<FlatList>(null);

  // Calculate snap offsets for perfect centering
  const snapOffsets = aiCategories.map((_, index) => index * snapInterval);

  useEffect(() => {
    // Start from the center item
    const centerIndex = Math.floor(aiCategories.length / 2);
    const centerOffset = centerIndex * snapInterval;
    setTimeout(() => {
      flatListRef.current?.scrollToOffset({
        offset: centerOffset,
        animated: false,
      });
    }, 100);
  }, []);

  const renderItem = ({ item, index }: { item: AICategory; index: number }) => (
    <View style={[styles.itemContainer, { width: itemWidth }]}>
      <ListItem
        item={item}
        onPress={onItemPress}
        onFavoritePress={onFavoritePress}
        onCategoryPress={onCategoryPress}
      />
    </View>
  );

  const getItemLayout = (_: any, index: number) => ({
    length: snapInterval,
    offset: snapInterval * index,
    index,
  });

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={aiCategories}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        decelerationRate="fast"
        snapToOffsets={snapOffsets}
        snapToAlignment="center"
        getItemLayout={getItemLayout}
        ItemSeparatorComponent={() => <View style={{ width: gap }} />}
        onScrollToIndexFailed={(info) => {
          // Fallback if scroll to index fails
          setTimeout(() => {
            flatListRef.current?.scrollToOffset({
              offset: info.averageItemLength * info.index,
              animated: true,
            });
          }, 100);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Remove flex: 1 to prevent centering
  },
  title: {
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  listContainer: {
    paddingHorizontal: (width - itemWidth) / 2, // Center items perfectly
  },
  itemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default HorizontalList;

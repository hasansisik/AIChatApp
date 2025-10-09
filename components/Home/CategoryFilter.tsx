import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { CategoryFilter } from '@/data/AICategories';

interface CategoryFilterProps {
  filters: CategoryFilter[];
  selectedFilter: string;
  onFilterPress: (filterType: string) => void;
}

const CategoryFilterComponent: React.FC<CategoryFilterProps> = ({
  filters,
  selectedFilter,
  onFilterPress,
}) => {
  const renderFilterItem = ({ item }: { item: CategoryFilter }) => {
    const isSelected = selectedFilter === item.type;
    
    return (
      <TouchableOpacity
        style={[
          styles.filterItem,
          isSelected && styles.selectedFilterItem,
        ]}
        onPress={() => onFilterPress(item.type)}
        activeOpacity={0.7}
      >
        <ReusableText
          text={item.name}
          family={isSelected ? "bold" : "medium"}
          size={14}
          color={isSelected ? Colors.white : Colors.dark}
          style={styles.filterText}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filters}
        renderItem={renderFilterItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  listContainer: {
    paddingHorizontal: 4,
    gap: 12,
  },
  filterItem: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.lightInput,
    borderWidth: 1,
    borderColor: Colors.lightInput,
  },
  selectedFilterItem: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterText: {
    textAlign: 'center',
  },
});

export default CategoryFilterComponent;

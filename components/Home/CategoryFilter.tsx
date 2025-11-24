import React from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
  
  const getFilterName = (filterType: string): string => {
    const filterKeyMap: { [key: string]: string } = {
      'all': 'home.filters.all',
      'education': 'home.filters.education',
      'work': 'home.filters.work',
      'lifestyle': 'home.filters.lifestyle',
      'family': 'home.filters.family',
      'relationships': 'home.filters.relationships',
    };
    return t(filterKeyMap[filterType] || filterType);
  };
  
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
          text={getFilterName(item.type)}
          family={isSelected ? "bold" : "medium"}
          size={14}
          color={isSelected ? Colors.lightWhite : Colors.black}
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
    backgroundColor: Colors.backgroundBox,
    borderWidth: 1,
    borderColor: Colors.backgroundBox,
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

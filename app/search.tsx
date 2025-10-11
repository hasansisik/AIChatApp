import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from "@/hooks/useThemeColor";
import ReusableText from '@/components/ui/ReusableText';
import { AICategory, aiCategories } from '@/data/AICategories';
import AIItem from '@/components/Home/AIItem';
import { FontSizes } from '@/constants/Fonts';

const Search = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<AICategory[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredItems([]);
      setIsSearching(false);
    } else {
      setIsSearching(true);
      const filtered = aiCategories.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredItems(filtered);
    }
  }, [searchQuery]);

  const handleItemPress = (item: AICategory) => {
    router.push(`/ai-detail?id=${item.id}`);
  };

  const handleFavoritePress = (item: AICategory) => {
    // Handle favorite functionality
    console.log('Favorite pressed:', item);
  };

  const handleCategoryPress = (categoryType: string) => {
    // Handle category press
    console.log('Category pressed:', categoryType);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <ReusableText 
          text="Search"
          family="bold"
          size={20}
          color={Colors.text}
        />
        
        <View style={styles.placeholder} />
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color={Colors.gray} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search AI assistants..."
            placeholderTextColor={Colors.gray}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={Colors.gray} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!isSearching && searchQuery.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={Colors.gray} />
            <ReusableText 
              text="Search for AI assistants"
              family="medium"
              size={FontSizes.medium}
              color={Colors.gray}
              style={styles.emptyText}
            />
            <ReusableText 
              text="Find the perfect AI assistant for your needs"
              family="regular"
              size={FontSizes.small}
              color={Colors.gray}
              align="center"
            />
          </View>
        ) : isSearching && filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search-outline" size={64} color={Colors.gray} />
            <ReusableText 
              text="No results found"
              family="medium"
              size={FontSizes.medium}
              color={Colors.gray}
              style={styles.emptyText}
            />
            <ReusableText 
              text={`No AI assistants found for "${searchQuery}"`}
              family="regular"
              size={FontSizes.small}
              color={Colors.gray}
              align="center"
            />
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <ReusableText 
              text={`${filteredItems.length} result${filteredItems.length !== 1 ? 's' : ''} found`}
              family="medium"
              size={FontSizes.small}
              color={Colors.gray}
              style={styles.resultsCount}
            />
            <View style={styles.gridContainer}>
              {filteredItems.map((item) => (
                <AIItem
                  key={item.id}
                  item={item}
                  onPress={handleItemPress}
                  onFavoritePress={handleFavoritePress}
                  onCategoryPress={handleCategoryPress}
                />
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  backButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.lightGray,
    shadowColor: Colors.black,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: FontSizes.medium,
    color: Colors.text,
    fontFamily: 'Poppins-Regular',
  },
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
  resultsContainer: {
    paddingBottom: 20,
  },
  resultsCount: {
    marginBottom: 16,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 16,
  },
});

export default Search;

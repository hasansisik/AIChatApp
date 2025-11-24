import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from "@/hooks/useThemeColor";
import ReusableText from '@/components/ui/ReusableText';
import { AICategory, aiCategories } from '@/data/AICategories';
import AIItem from '@/components/Home/AIItem';
import { FontSizes } from '@/constants/Fonts';
import { startConversation } from '@/redux/actions/aiActions';
import { addFavoriteAI, removeFavoriteAI } from '@/redux/actions/userActions';
import { useSelector } from 'react-redux';

const Search = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useSelector((state: any) => state.user);
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

  const handleItemPress = async (item: AICategory) => {
    try {
      // Start conversation with avatar_id
      const result = await dispatch(startConversation({ avatar_id: item.avatar_id }) as any);
      
      if (startConversation.fulfilled.match(result)) {
        // Navigate to AI detail page with conversation data
        router.push(`/ai-detail?id=${item.id}`);
      } else {
        console.error('Failed to start conversation:', result.payload);
        // Still navigate even if conversation fails
        router.push(`/ai-detail?id=${item.id}`);
      }
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Still navigate even if conversation fails
      router.push(`/ai-detail?id=${item.id}`);
    }
  };

  const handleFavoritePress = async (item: AICategory) => {
    if (!user) {
      // Kullanıcı giriş yapmamışsa login sayfasına yönlendir
      router.push('/(auth)/login');
      return;
    }

    const isFavorite = user?.favoriteAIs?.includes(item.id) || false;

    try {
      if (isFavorite) {
        // Favoriden çıkar
        await dispatch(removeFavoriteAI(item.id) as any);
      } else {
        // Favoriye ekle
        await dispatch(addFavoriteAI(item.id) as any);
      }
      // Sayfa yenilenmesini önlemek için hiçbir şey yapmıyoruz
      // Redux state güncellendiğinde component otomatik olarak yeniden render olacak
    } catch (error) {
      console.error('Favori işlemi hatası:', error);
    }
  };


  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.text} />
        </TouchableOpacity>
        
        <ReusableText 
          text={t('search.title')}
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
            placeholder={t('search.placeholder')}
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
      <View style={styles.content}>
        {!isSearching && searchQuery.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="search" size={64} color={Colors.gray} />
            <ReusableText 
              text={t('search.emptyState.title')}
              family="medium"
              size={FontSizes.medium}
              color={Colors.gray}
              style={styles.emptyText}
            />
            <ReusableText 
              text={t('search.emptyState.description')}
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
              text={t('search.noResults.title')}
              family="medium"
              size={FontSizes.medium}
              color={Colors.gray}
              style={styles.emptyText}
            />
            <ReusableText 
              text={t('search.noResults.description', { query: searchQuery })}
              family="regular"
              size={FontSizes.small}
              color={Colors.gray}
              align="center"
            />
          </View>
        ) : (
          <View style={styles.resultsContainer}>
            <ReusableText 
              text={t('search.resultsCount', { count: filteredItems.length })}
              family="medium"
              size={FontSizes.small}
              color={Colors.gray}
              style={styles.resultsCount}
            />
            <FlatList
              data={filteredItems}
              renderItem={({ item }) => (
                <AIItem
                  item={item}
                  onPress={handleItemPress}
                  onFavoritePress={handleFavoritePress}
                />
              )}
              keyExtractor={(item) => item.id}
              numColumns={2}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.gridContainer}
              columnWrapperStyle={styles.row}
            />
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
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
    zIndex: 10,
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
    zIndex: 10,
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
  row: {
    justifyContent: 'space-between',
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
    paddingBottom: 20,
  },
});

export default Search;

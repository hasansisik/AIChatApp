import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Colors } from "@/hooks/useThemeColor";
import HeaderList from '@/components/Home/HeaderList';
import HorizontalList from '@/components/Home/HorizontalList';
import GridList from '@/components/Home/GridList';
import { AICategory } from '@/data/AICategories';
import { startConversation } from '@/redux/actions/aiActions';

const List = () => {
  const router = useRouter();
  const dispatch = useDispatch();

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

  const handleFavoritePress = (item: AICategory) => {
    // Handle favorite press
    console.log('Favorite pressed:', item);
  };


  return (
    <View style={styles.container}>
      <HeaderList />
      <View style={styles.content}>
        <HorizontalList 
          onItemPress={handleItemPress}
          onFavoritePress={handleFavoritePress}
        />
        <GridList 
          onItemPress={handleItemPress}
          onFavoritePress={handleFavoritePress}
        />
      </View>
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

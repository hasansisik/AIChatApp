import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native'
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { Colors } from "@/hooks/useThemeColor";
import Header from '@/components/Home/Header';
import Categories from '@/components/Home/Categories';
import AIListing from '@/components/Home/AIListing';
import { AICategory } from '@/data/AICategories';
import { startConversation } from '@/redux/actions/aiActions';

const Home = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const handleCategoryPress = (category: string) => {
    // Handle category navigation
    console.log(`${category} pressed`);
  };

  const handleAICategoryPress = async (item: AICategory) => {
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

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <Categories onCategoryPress={handleCategoryPress} />
        <AIListing onItemPress={handleAICategoryPress} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingTop: Platform.OS === "ios" ? 40 : 20 ,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default Home
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native'
import { useRouter } from 'expo-router';
import { Colors } from "@/hooks/useThemeColor";
import Header from '@/components/Home/Header';
import Categories from '@/components/Home/Categories';
import AIListing from '@/components/Home/AIListing';
import { AICategory } from '@/data/AICategories';

const Home = () => {
  const router = useRouter();

  const handleCategoryPress = (category: string) => {
    // Handle category navigation
    console.log(`${category} pressed`);
  };

  const handleAICategoryPress = (item: AICategory) => {
    // Navigate to AI detail page
    router.push(`/ai-detail?id=${item.id}`);
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
import { View, Text, StyleSheet, ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import React from 'react'
import { Colors } from "@/hooks/useThemeColor";
import Header from '@/components/Home/Header';
import Categories from '@/components/Home/Categories';

const Home = () => {
  const handleSearchPress = () => {
    // Handle search functionality
    console.log('Search pressed');
  };

  const handleProfilePress = () => {
    // Handle profile navigation
    console.log('Profile pressed');
  };

  const handleCategoryPress = (category: string) => {
    // Handle category navigation
    console.log(`${category} pressed`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header 
        onSearchPress={handleSearchPress}
        onProfilePress={handleProfilePress}
      />
      <ScrollView style={styles.content}>
        <Categories onCategoryPress={handleCategoryPress} />
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default Home
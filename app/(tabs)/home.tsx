import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native'
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Colors } from "@/hooks/useThemeColor";
import Header from '@/components/Home/Header';
import Categories from '@/components/Home/Categories';
import AIListing from '@/components/Home/AIListing';
import { AICategory } from '@/data/AICategories';
import { addFavoriteAI, removeFavoriteAI } from '@/redux/actions/userActions';
import { getActiveOnboardings } from '@/redux/actions/onboardingActions';
import { useSelector } from 'react-redux';
import ChatBot from '@/components/ChatBot/ChatBot';
import OnboardingCarousel from '@/components/Onboarding/OnboardingCarousel';
import AsyncStorage from '@react-native-async-storage/async-storage';

const Home = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useSelector((state: any) => state.user);
  const { onboardings, loading: onboardingsLoading } = useSelector((state: any) => state.onboarding);
  const [chatBotVisible, setChatBotVisible] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);

  // Load onboardings and check if should show
  useEffect(() => {
    const loadOnboardings = async () => {
      try {
        await dispatch(getActiveOnboardings() as any);
        
        // Check if user has seen onboarding before (test için yeni key)
        const hasSeenOnboardingV2 = await AsyncStorage.getItem('hasSeenOnboardingV2');
        
        // Show onboarding if there are active onboardings and user hasn't seen it
        // Test için: onboardings varsa her zaman göster
        if (onboardings.length > 0) {
          setOnboardingVisible(true);
        }
      } catch (error) {
        console.error('Error loading onboardings:', error);
      }
    };

    loadOnboardings();
  }, [dispatch]);

  // Update onboarding visibility when onboardings are loaded
  useEffect(() => {
    const checkOnboarding = async () => {
      if (onboardings.length > 0 && !onboardingsLoading) {
        // Test için: onboardings varsa her zaman göster
        setOnboardingVisible(true);
      }
    };

    checkOnboarding();
  }, [onboardings, onboardingsLoading]);

  const handleOnboardingClose = async () => {
    await AsyncStorage.setItem('hasSeenOnboardingV2', 'true');
    setOnboardingVisible(false);
  };

  const handleCategoryPress = (category: string) => {
    if (category === t('home.categories.liveChat')) {
      navigation.navigate('List' as never);
    } else if (category === t('home.categories.courseSessions')) {
      navigation.navigate('Edu' as never);
    } else if (category === t('home.categories.contact')) {
      setChatBotVisible(true);
    }
  };

  const handleAICategoryPress = async (item: AICategory) => {
    // Navigate directly to AI detail page
    router.push(`/ai-detail?id=${item.id}`);
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
      console.error(t('home.favoriteError'), error);
    }
  };

  return (
    <View style={styles.container}>
      <Header />
      <ScrollView style={styles.content}>
        <Categories onCategoryPress={handleCategoryPress} />
        <AIListing onItemPress={handleAICategoryPress} onFavoritePress={handleFavoritePress} />
      </ScrollView>
      <ChatBot
        visible={chatBotVisible}
        onClose={() => setChatBotVisible(false)}
      />
      <OnboardingCarousel
        onboardings={onboardings}
        visible={onboardingVisible}
        onClose={handleOnboardingClose}
      />
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
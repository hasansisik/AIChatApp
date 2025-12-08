import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native'
import { useRouter } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { Image } from 'expo-image';
import { Colors } from "@/hooks/useThemeColor";
import Header from '@/components/Home/Header';
import Categories from '@/components/Home/Categories';
import AIListing from '@/components/Home/AIListing';
import { AICategory, aiCategories } from '@/data/AICategories';
import { addFavoriteAI, removeFavoriteAI } from '@/redux/actions/userActions';
import { getActiveOnboardings, markOnboardingAsViewed } from '@/redux/actions/onboardingActions';
import { useSelector } from 'react-redux';
import ChatBot from '@/components/ChatBot/ChatBot';
import OnboardingCarousel from '@/components/Onboarding/OnboardingCarousel';
import { useAuth } from '@/hooks/useAuth';

const Home = () => {
  const router = useRouter();
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useSelector((state: any) => state.user);
  const { onboardings, loading: onboardingsLoading } = useSelector((state: any) => state.onboarding);
  const { isOnboardingCompleted } = useAuth();
  const [chatBotVisible, setChatBotVisible] = useState(false);
  const [onboardingVisible, setOnboardingVisible] = useState(false);
  const [imagesReady, setImagesReady] = useState(false);
  const homeMountedTime = useRef<number | null>(null);
  const onboardingDemoCompletedTime = useRef<number | null>(null);
  const showCarouselTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Track when home component mounts and preload AI images
  useEffect(() => {
    homeMountedTime.current = Date.now();
    
    // Preload all AI images immediately when home mounts
    const preloadAIImages = async () => {
      try {
        const imagePromises = aiCategories.map((item) => {
          if (typeof item.image === 'string') {
            // Network image
            return Image.prefetch(item.image);
          } else {
            // Local asset - expo-image handles these automatically, but we can warm the cache
            return Promise.resolve();
          }
        });
        await Promise.all(imagePromises);
      } catch (error) {
        console.error('Error preloading AI images:', error);
      }
    };
    
    preloadAIImages();
    
    return () => {
      if (showCarouselTimeoutRef.current) {
        clearTimeout(showCarouselTimeoutRef.current);
      }
    };
  }, []);

  // Track when onboarding demo completes - check if it was just completed
  const prevIsOnboardingCompleted = useRef<boolean | undefined>(undefined);
  useEffect(() => {
    // If onboarding was just completed (changed from false/undefined to true), track the time
    if (prevIsOnboardingCompleted.current === false && isOnboardingCompleted) {
      onboardingDemoCompletedTime.current = Date.now();
    }
    prevIsOnboardingCompleted.current = isOnboardingCompleted;
  }, [isOnboardingCompleted]);

  // Load onboardings and check if should show
  useEffect(() => {
    const loadOnboardings = async () => {
      try {
        await dispatch(getActiveOnboardings() as any);
      } catch (error) {
        console.error('Error loading onboardings:', error);
      }
    };

    loadOnboardings();
  }, [dispatch]);

  // Preload images and wait for them to be ready
  useEffect(() => {
    if (onboardings.length > 0 && !onboardingsLoading) {
      const preloadImages = async () => {
        try {
          const { Image } = await import('expo-image');
          const imagePromises = onboardings
            .filter((item: any) => item.mediaType === 'image')
            .map((item: any) => 
              Image.prefetch(item.mediaUrl)
            );
          
          await Promise.all(imagePromises);
          setImagesReady(true);
        } catch (error) {
          console.error('Error preloading images:', error);
          // Still set ready even if some images fail to preload
          setImagesReady(true);
        }
      };

      preloadImages();
    } else {
      setImagesReady(false);
    }
  }, [onboardings, onboardingsLoading]);

  // Show onboarding carousel with delay based on onboarding demo status
  useEffect(() => {
    // Clear any existing timeout
    if (showCarouselTimeoutRef.current) {
      clearTimeout(showCarouselTimeoutRef.current);
      showCarouselTimeoutRef.current = null;
    }

    // Only proceed if onboardings are loaded and images are ready
    if (onboardings.length === 0 || onboardingsLoading || !imagesReady) {
      setOnboardingVisible(false);
      return;
    }

    // Calculate delay based on onboarding demo status
    let delay = 5000; // Default: 5 seconds after home opens

    if (onboardingDemoCompletedTime.current !== null) {
      // Onboarding demo was shown and completed
      // Show carousel 3 seconds after demo completion
      const timeSinceDemoCompletion = Date.now() - onboardingDemoCompletedTime.current;
      if (timeSinceDemoCompletion < 3000) {
        delay = 3000 - timeSinceDemoCompletion;
      } else {
        // Demo completed more than 3 seconds ago, show immediately
        delay = 0;
      }
    } else {
      // No onboarding demo was shown, show 5 seconds after home opens
      if (homeMountedTime.current !== null) {
        const timeSinceHomeMount = Date.now() - homeMountedTime.current;
        if (timeSinceHomeMount < 5000) {
          delay = 5000 - timeSinceHomeMount;
        } else {
          // Home opened more than 5 seconds ago, show immediately
          delay = 0;
        }
      }
    }

    // Set timeout to show carousel
    showCarouselTimeoutRef.current = setTimeout(() => {
      setOnboardingVisible(true);
    }, delay);

    return () => {
      if (showCarouselTimeoutRef.current) {
        clearTimeout(showCarouselTimeoutRef.current);
        showCarouselTimeoutRef.current = null;
      }
    };
  }, [onboardings, onboardingsLoading, imagesReady, isOnboardingCompleted]);

  const handleOnboardingClose = async () => {
    try {
      // Get all unique onboarding IDs from the current onboardings
      const uniqueOnboardingIds = new Set<string>();
      onboardings.forEach((item: any) => {
        if (item.onboardingId) {
          uniqueOnboardingIds.add(item.onboardingId);
        }
      });

      // Mark all viewed onboardings
      const markPromises = Array.from(uniqueOnboardingIds).map((onboardingId) =>
        dispatch(markOnboardingAsViewed(onboardingId) as any)
      );

      await Promise.all(markPromises);
      
      // Reload onboardings to get updated list (without viewed ones)
      await dispatch(getActiveOnboardings() as any);
      
      setOnboardingVisible(false);
    } catch (error) {
      console.error('Error marking onboarding as viewed:', error);
      // Still close the modal even if marking fails
    setOnboardingVisible(false);
    }
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

export default Home;
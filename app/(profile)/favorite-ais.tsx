import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import ReusableText from '@/components/ui/ReusableText';
import { FontSizes } from '@/constants/Fonts';
import AppBar from '@/components/ui/AppBar';
import { AICategory, aiCategories } from '@/data/AICategories';
import { getFavoriteAIs, removeFavoriteAI } from '@/redux/actions/userActions';
import { startConversation } from '@/redux/actions/aiActions';

const FavoriteAIs: React.FC = () => {
  const router = useRouter();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { user } = useSelector((state: any) => state.user);
  const [favoriteAIs, setFavoriteAIs] = useState<AICategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      setLoading(true);
      const result = await dispatch<any>(getFavoriteAIs());
      if (getFavoriteAIs.fulfilled.match(result)) {
        const favoriteIds = result.payload || [];
        const favorites = aiCategories.filter(ai => favoriteIds.includes(ai.id));
        setFavoriteAIs(favorites);
      }
    } catch (error) {
      console.error(t('profile.favoriteAIs.loadError'), error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = (aiId: string) => {
    Alert.alert(
      t('profile.favoriteAIs.removeTitle'),
      t('profile.favoriteAIs.removeMessage'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('profile.favoriteAIs.remove'),
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await dispatch<any>(removeFavoriteAI(aiId));
              if (removeFavoriteAI.fulfilled.match(result)) {
                setFavoriteAIs(prev => prev.filter(ai => ai.id !== aiId));
              }
            } catch (error) {
              console.error(t('profile.favoriteAIs.removeError'), error);
            }
          },
        },
      ]
    );
  };

  const handleItemPress = async (item: AICategory) => {
    try {
      // Start conversation with avatar_id
      const result = await dispatch<any>(startConversation({ avatar_id: item.avatar_id }));
      
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

  const renderItem = ({ item }: { item: AICategory }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => handleItemPress(item)}
      activeOpacity={0.7}
    >
      <Image source={item.image as any} style={styles.image} />
      <View style={styles.itemContent}>
        <ReusableText
          text={item.title}
          family="medium"
          size={FontSizes.medium}
          color={Colors.black}
        />
        <ReusableText
          text={t(item.description)}
          family="regular"
          size={FontSizes.small}
          color={Colors.description}
          style={styles.description}
        />
        <ReusableText
          text={t(item.category)}
          family="regular"
          size={FontSizes.xSmall}
          color={Colors.gray}
        />
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => handleRemoveFavorite(item.id)}
        activeOpacity={0.7}
      >
        <Ionicons name="heart" size={24} color={Colors.red} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <AppBar
        top={0}
        left={20}
        right={20}
        color={Colors.light}
        onPress={() => router.back()}
      />
      <View style={styles.header}>
        <ReusableText
          text={t('profile.favoriteAIs.title')}
          family="bold"
          size={FontSizes.large}
          color={Colors.black}
        />
      </View>
      {favoriteAIs.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="star-outline" size={64} color={Colors.gray} />
          <ReusableText
            text={t('profile.favoriteAIs.emptyTitle')}
            family="medium"
            size={FontSizes.medium}
            color={Colors.gray}
            style={styles.emptyText}
          />
          <ReusableText
            text={t('profile.favoriteAIs.emptyDescription')}
            family="regular"
            size={FontSizes.small}
            color={Colors.gray}
            align="center"
          />
        </View>
      ) : (
        <FlatList
          data={favoriteAIs}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.lightGray,
  },
  listContent: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  image: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
  },
  description: {
    marginTop: 4,
    marginBottom: 4,
  },
  removeButton: {
    padding: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    marginBottom: 8,
  },
});

export default FavoriteAIs;


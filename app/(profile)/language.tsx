import React from 'react';
import { View, TouchableOpacity, StyleSheet, Image, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import AppBar from '@/components/ui/AppBar';
import ReusableText from '@/components/ui/ReusableText';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Language {
  code: string;
  name: string;
  flag: any;
}

const LanguageScreen = () => {
  const router = useRouter();
  const { i18n, t } = useTranslation();

  const languages: Language[] = [
    {
      code: 'en',
      name: t('profile.language.english'),
      flag: require('@/assets/images/main/en.png')
    },
    {
      code: 'tr',
      name: t('profile.language.turkish'),
      flag: require('@/assets/images/main/tr.png')
    }
  ];

  const handleLanguageChange = async (languageCode: string) => {
    try {
      await AsyncStorage.setItem('language', languageCode);
      await i18n.changeLanguage(languageCode);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={styles.languageOption}
      onPress={() => handleLanguageChange(item.code)}
    >
      <View style={styles.leftContent}>
        <Image
          source={item.flag}
          style={styles.flagIcon}
        />
        <ReusableText
          text={item.name}
          family="regular"
          size={FontSizes.medium}
          color={Colors.black}
        />
      </View>
      <View style={[
        styles.circle,
        i18n.language === item.code && styles.selectedCircle
      ]}>
        {i18n.language === item.code && (
          <Ionicons name="checkmark" size={18} color={Colors.white} />
        )}
      </View>
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
      
      <View style={styles.content}>
        <ReusableText
          text={t('profile.languageTitle')}
          family="bold"
          size={FontSizes.large}
          color={Colors.black}
        />
        
        <FlatList
          data={languages}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  listContainer: {
    marginTop: 20,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    paddingHorizontal: 5,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  flagIcon: {
    width: 30,
    height: 30,
  },
  circle: {
    width: 25,
    height: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: Colors.gray,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCircle: {
    width: 25,
    height: 25,
    borderRadius: 15,
    borderColor: Colors.black,
    backgroundColor: Colors.black,
  },
});

export default LanguageScreen;

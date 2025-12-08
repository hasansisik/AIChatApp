import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { Colors, useTheme } from '@/hooks/useThemeColor';

interface HeaderListProps {
  onSearchPress?: () => void;
  onProfilePress?: () => void;
}

const HeaderList: React.FC<HeaderListProps> = ({ onSearchPress, onProfilePress }) => {
  const { isDark } = useTheme();
  const router = useRouter();
  const { user } = useSelector((state: any) => state.user);

  const handleProfilePress = () => {
    if (onProfilePress) {
      onProfilePress();
    } else {
      // Default navigation to profile tab
      router.push('/(tabs)/profile');
    }
  };

  const handleSearchPress = () => {
    if (onSearchPress) {
      onSearchPress();
    } else {
      // Default navigation to search page
      router.push('/search');
    }
  };
  
  return (
    <View style={styles.headerContainer}>
      {/* Top Row: Search, Logo, Profile */}
      <View style={styles.topRow}>
        {/* Search Icon */}
        <TouchableOpacity style={styles.iconContainer} onPress={handleSearchPress}>
          <Ionicons name="search" size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoContainer}>
          <Image
            source={isDark ? require('@/assets/images/icon-w.png') : require('@/assets/images/icon-b.png')}
            style={styles.logo}
            contentFit="contain"
            transition={200}
            cachePolicy="memory-disk"
            priority="high"
          />
        </View>

        {/* Profile Photo */}
        <TouchableOpacity style={styles.profileContainer} onPress={handleProfilePress}>
          <Image
            source={
              user?.profile?.picture
                ? user.profile.picture
                : require("@/assets/images/person.png")
            }
            style={styles.profileImage}
            contentFit="cover"
            transition={200}
            cachePolicy="memory-disk"
            priority="high"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
  },
  logo: {
    width: 120,
    height: 50,
  },
  profileContainer: {
    width: 40,
    height: 40,
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
});

export default HeaderList;

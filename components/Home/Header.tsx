import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Video, ResizeMode } from 'expo-av';
import { Colors, useTheme } from '@/hooks/useThemeColor';
import ReusableText from '@/components/ui/ReusableText';

interface HeaderProps {
  onSearchPress?: () => void;
  onProfilePress?: () => void;
}

const Header: React.FC<HeaderProps> = ({ onSearchPress, onProfilePress }) => {
  const { isDark } = useTheme();
  
  return (
    <View style={styles.headerContainer}>
      {/* Top Row: Search, Logo, Profile */}
      <View style={styles.topRow}>
        {/* Search Icon */}
        <TouchableOpacity style={styles.iconContainer} onPress={onSearchPress}>
          <Ionicons name="search" size={24} color={Colors.text} />
        </TouchableOpacity>

        {/* Video Logo */}
        <View style={styles.logoContainer}>
          <Video
            source={isDark ? require('@/assets/video/Tlogotm-dark.mp4') : require('@/assets/video/Tlogotm.mp4')}
            style={styles.video}
            shouldPlay
            isLooping
            resizeMode={ResizeMode.CONTAIN}
          />
        </View>

        {/* Profile Photo */}
        <TouchableOpacity style={styles.profileContainer} onPress={onProfilePress}>
          <Image
            source={{ uri: 'https://plus.unsplash.com/premium_photo-1690407617542-2f210cf20d7e?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8cGVyc29ufGVufDB8fDB8fHww' }}
            style={styles.profileImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      </View>

      {/* Welcome Text */}
      <View style={styles.textContainer}>
        <ReusableText 
          text="How may I help you"
          family="medium"
          size={24}
          color={Colors.text}
          align="left"
          style={styles.welcomeText}
        />
        <ReusableText 
          text="today, Adam"
          family="bold"
          size={24}
          color={Colors.text}
          align="left"
          style={styles.welcomeText}
        />
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
    marginBottom: 20,
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
  video: {
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
  textContainer: {
    alignItems: 'flex-start',
  },
  welcomeText: {
    lineHeight: 32,
    marginBottom: 4,
  },
});

export default Header;

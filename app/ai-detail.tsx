import React from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { AICategory, aiCategories } from '@/data/AICategories';

const { width, height } = Dimensions.get('window');

const AIDetailPage = () => {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  
  // Find the AI item by ID
  const item = aiCategories.find(ai => ai.id === id);

  if (!item) {
    return (
      <View style={styles.container}>
        <ReusableText text="AI not found" />
      </View>
    );
  }

  const handleGoBack = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Full Screen Background Image */}
      <Image
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Dark Overlay */}
      <View style={styles.overlay} />
      
      {/* Purple Gradient at Bottom */}
      <LinearGradient
        colors={['transparent', 'rgba(75, 0, 130, 0.2)', 'rgba(75, 0, 130, 0.6)', 'rgba(75, 0, 130, 0.9)', 'rgba(75, 0, 130, 1)']}
        locations={[0.2, 0.4, 0.6, 0.8, 1.0]}
        style={styles.bottomGradient}
      />
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          {/* Close Button (left side) */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Ionicons
              name="close"
              size={24}
              color={Colors.lightWhite}
            />
          </TouchableOpacity>
          
          {/* Profile Section */}
          <View style={styles.profileSection}>
            {/* Round Profile Image */}
            <View style={styles.profileImageContainer}>
              <Image
                source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                style={styles.profileImage}
                resizeMode="contain"
              />
            </View>
            
            {/* Name */}
            <ReusableText
              text={item.title}
              family="bold"
              size={24}
              color={Colors.lightWhite}
              style={styles.nameText}
            />
          </View>
          
          {/* Empty space for right side */}
          <View style={styles.rightSpacer} />
        </View>
      </SafeAreaView>
      
      {/* Content Area */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Empty space to push text to bottom */}
        <View style={styles.spacer} />
      </ScrollView>
      
      {/* Bottom Text - Work Alexander */}
      <View style={styles.bottomTextContainer}>
        <ReusableText
          text={item.category}
          family="bold"
          size={18}
          color={Colors.lightWhite}
          style={styles.categoryText}
        />
        <ReusableText
          text={item.title}
          family="bold"
          size={24}
          color={Colors.lightWhite}
          style={styles.nameText}
        />
        <ReusableText
          text={item.description}
          family="regular"
          size={14}
          color={Colors.lightWhite}
          style={styles.descriptionText}
        />
        
        {/* Start Button */}
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => {
            // Handle start button press
            console.log('Start button pressed');
          }}
          activeOpacity={0.8}
        >
          <ReusableText
            text="Hemen Başla"
            family="medium"
            size={16}
            color={Colors.lightWhite}
            style={styles.startButtonText}
          />
          <View style={styles.startButtonIconContainer}>
            <MaterialIcons 
              name="arrow-outward" 
              size={24} 
              color="white" 
              style={styles.startButtonIcon}
            />
         </View>

        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'black',
  },
  backgroundImage: {
    width: width,
    height: height,
    position: 'absolute',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  bottomGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 1, // Cover bottom half of screen
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  rightSpacer: {
    width: 40,
    height: 40,
  },
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    borderWidth: 2,
    borderColor: Colors.lightWhite,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  nameText: {
    flex: 1,
  },
  closeButton: {
    borderRadius: 30,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.lightWhite,
  },
  content: {
    flex: 1,
    marginTop: 120, // Space for header
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  spacer: {
    flex: 1,
  },
  bottomTextContainer: {
    position: 'absolute',
    bottom: 60,
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  categoryText: {
    marginBottom: 4,
    textAlign: 'center',
  },
  descriptionText: {
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.9,
    lineHeight: 18,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingHorizontal: 2,
    paddingLeft: 15,
    paddingVertical: 2,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: Colors.lightWhite,
  },
  startButtonText: {
    marginRight: 8,
  },
  startButtonIconContainer: {
    borderWidth: 2,
    borderColor: Colors.lightWhite,
    padding: 10,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startButtonIcon: {
    // Icon styling
  },
});

export default AIDetailPage;

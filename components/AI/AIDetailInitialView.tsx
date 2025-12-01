import React from 'react';
import { View, StyleSheet, Image, Animated, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { AICategory } from '@/data/AICategories';
import BottomTextContent from '@/components/ui/BottomTextContent';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';

const { height } = Dimensions.get('window');

interface AIDetailInitialViewProps {
  item: AICategory;
  gradientOpacity: Animated.Value;
  textOpacity: Animated.Value;
  overlayOpacity: Animated.Value;
  isGradientVisible: boolean;
  isTextVisible: boolean;
  onStartPress: () => void;
  onGoBack: () => void;
  buttonText?: string; // Optional custom button text
}

const AIDetailInitialView: React.FC<AIDetailInitialViewProps> = ({
  item,
  gradientOpacity,
  textOpacity,
  overlayOpacity,
  isGradientVisible,
  isTextVisible,
  onStartPress,
  onGoBack,
  buttonText,
}) => {
  return (
    <>
      {/* Background Image */}
      <Image
        source={typeof item.image === 'string' ? { uri: item.image } : item.image}
        style={styles.backgroundImage}
        resizeMode="cover"
      />
      
      {/* Dark Overlay */}
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]} />
      
      {/* Purple Gradient at Bottom */}
      {isGradientVisible && (
        <Animated.View style={[styles.gradientContainer, { opacity: gradientOpacity }]}>
          <LinearGradient
            colors={['transparent', 'rgba(75, 0, 130, 0.2)', 'rgba(75, 0, 130, 0.6)', 'rgba(75, 0, 130, 0.9)', 'rgba(75, 0, 130, 1)']}
            locations={[0.2, 0.4, 0.6, 0.8, 1.0]}
            style={styles.bottomGradient}
          />
        </Animated.View>
      )}
      
      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          {/* Close Button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onGoBack}
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
            <View style={styles.profileImageContainer}>
              <Image
                source={typeof item.image === 'string' ? { uri: item.image } : item.image}
                style={styles.profileImage}
                resizeMode="contain"
              />
            </View>
            
            <ReusableText
              text={item.title}
              family="bold"
              size={24}
              color={Colors.lightWhite}
              style={styles.nameText}
            />
          </View>
          
          <View style={styles.rightSpacer} />
        </View>
      </SafeAreaView>
      
      {/* Bottom Text Content - Should be on top */}
      <View style={styles.textContentWrapper}>
        <BottomTextContent
          item={item}
          isVisible={isTextVisible}
          opacity={textOpacity}
          onStartPress={onStartPress}
          buttonText={buttonText}
        />
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    zIndex: 1,
  },
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 1,
    zIndex: 1,
  },
  bottomGradient: {
    width: '100%',
    height: '100%',
  },
  textContentWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 10,
    pointerEvents: 'box-none',
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
});

export default AIDetailInitialView;


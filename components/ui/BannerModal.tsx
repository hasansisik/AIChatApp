import React, { useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Image,
  TouchableOpacity,
  Dimensions,
  Animated,
  StatusBar,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/hooks/useThemeColor';
import Svg, { Circle } from 'react-native-svg';

const { width, height } = Dimensions.get('window');

// Create animated SVG components
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface BannerModalProps {
  visible: boolean;
  onClose: () => void;
  bannerData: {
    id: string;
    image: string;
    url: string;
  } | null;
  loading?: boolean;
}

const BannerModal: React.FC<BannerModalProps> = ({ 
  visible, 
  onClose, 
  bannerData, 
  loading = false 
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset progress animation
      progressAnim.setValue(0);
      
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Start progress animation
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 5000,
        useNativeDriver: false,
      }).start();

      return () => clearTimeout(timer);
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 0.8,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, onClose]);

  const handleImagePress = () => {
    if (bannerData?.url && bannerData.url !== '/test') {
      // Handle URL navigation
      Linking.openURL(bannerData.url).catch(() => {});
    }
  };

  if (!visible) return null;

  // Calculate the circumference for the progress circle
  const radius = 20;
  const circumference = 2 * Math.PI * radius;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <StatusBar backgroundColor="rgba(0,0,0,0.9)" barStyle="light-content" />
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close Button with Progress Border */}
          <View style={styles.closeButtonContainer}>
            <Svg width={48} height={48} style={styles.progressCircle}>
              {/* Background circle */}
              <Circle
                cx={24}
                cy={24}
                r={radius}
                stroke="rgba(255,255,255,0.3)"
                strokeWidth={3}
                fill="none"
              />
              {/* Progress circle */}
              <AnimatedCircle
                cx={24}
                cy={24}
                r={radius}
                stroke="white"
                strokeWidth={3}
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [circumference, 0],
                })}
                strokeLinecap="round"
                transform={`rotate(-90 24 24)`}
              />
            </Svg>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close-outline" size={24} color="white" />
            </TouchableOpacity>
          </View>

          {/* Banner Content */}
          <View style={styles.bannerContainer}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : bannerData?.image ? (
              <TouchableOpacity
                style={styles.imageContainer}
                onPress={handleImagePress}
                activeOpacity={0.9}
              >
                <Image
                  source={{ uri: bannerData.image }}
                  style={styles.bannerImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            ) : null}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonContainer: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressCircle: {
    position: 'absolute',
  },
  closeButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default BannerModal; 
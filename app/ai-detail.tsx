import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import ReusableText from '@/components/ui/ReusableText';
import SelectionModal from '@/components/ui/SelectionModal';
import { AICategory, aiCategories } from '@/data/AICategories';
import aiService from '@/services/aiService';
import AIDetailInitialView from '@/components/AI/AIDetailInitialView';
import AIDetailVideoView from '@/components/AI/AIDetailVideoView';
import PurchaseModal from '@/components/ui/PurchaseModal';
import CouponModal from '@/components/ui/CouponModal';
import CouponSelectionModal from '@/components/ui/CouponSelectionModal';
import { useCouponAccess } from '@/hooks/useCouponAccess';

const AIDetailPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [isGradientVisible, setIsGradientVisible] = useState(true);
  const [isTextVisible, setIsTextVisible] = useState(true);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [isSelectionModalVisible, setIsSelectionModalVisible] = useState(false);
  const [selectedDetectionMethod, setSelectedDetectionMethod] = useState('keyboard');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [conversationText, setConversationText] = useState('');
  const [purchaseModalVisible, setPurchaseModalVisible] = useState(false);
  const [couponModalVisible, setCouponModalVisible] = useState(false);
  const [couponSelectionModalVisible, setCouponSelectionModalVisible] = useState(false);
  const gradientOpacity = useRef(new Animated.Value(1)).current;
  const bottomAreaOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const videoOpacity = useRef(new Animated.Value(0)).current;
  
  // Check coupon access
  const { hasAccess, loading: accessLoading } = useCouponAccess();
  
  // Find the AI item by ID
  const item = aiCategories.find(ai => ai.id === id);

  if (!item) {
    return (
      <View style={styles.container}>
        <ReusableText text={t('ai.notFound')} />
      </View>
    );
  }

  const handleGoBack = async () => {
    try {
      // Recording'i durdur (eğer aktifse)
      if (isRecording) {
        await aiService.stopLiveTranscription(false);
      }
      
      // Tüm servisleri temizle
      await aiService.cleanup();
    } catch (error) {
      // Ignore
    } finally {
      setIsRecording(false);
      router.push('/(tabs)/tabs');
    }
  };

  const handleStartPress = () => {
    // Check if user has access (wait for loading to finish)
    if (accessLoading) {
      return; // Wait for access check to complete
    }

    if (!hasAccess) {
      // Show selection modal first
      setCouponSelectionModalVisible(true);
      return;
    }

    // User has access, proceed with animation
    startVideoAnimation();
  };

  const startVideoAnimation = () => {
    // Animate gradient fade out, text fade out, overlay fade out, and bottom area fade in
    Animated.parallel([
      Animated.timing(gradientOpacity, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(bottomAreaOpacity, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsGradientVisible(false);
      setIsTextVisible(false);
      Animated.timing(videoOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    });
  };

  const handleHasCoupon = () => {
    // User has coupon, show coupon modal
    setCouponModalVisible(true);
  };

  const handleNoCoupon = () => {
    // User doesn't have coupon, show purchase modal
    setPurchaseModalVisible(true);
  };

  const handleCouponSuccess = async () => {
    setCouponModalVisible(false);
    // After successful coupon entry, reload user data
    // The useCouponAccess hook will update automatically via checkDemoStatus
    // Wait a bit for the hook to update, then check access
    setTimeout(() => {
      // Access will be checked by the useEffect that watches hasAccess
    }, 1000);
  };


  const handleAutoDetectPress = () => {
    setSelectedDetectionMethod('microphone');
    setIsSelectionModalVisible(false);
    // Modal açılmıyor, sadece icon değişiyor
  };

  const handleHandDetectPress = () => {
    setSelectedDetectionMethod('hand');
    setIsSelectionModalVisible(false);
    // Modal açılmıyor, sadece icon değişiyor
  };

  // Set voice when component mounts or item changes
  useEffect(() => {
    if (item?.voice) {
      aiService.prewarmConnection(item.voice);
    }
  }, [item?.voice]);

  // Check access when hasAccess changes (after coupon entry)
  useEffect(() => {
    if (!accessLoading && hasAccess && isGradientVisible && !purchaseModalVisible && !couponModalVisible) {
      // Access was granted after coupon entry, start animation
      startVideoAnimation();
    }
  }, [hasAccess, accessLoading, isGradientVisible, purchaseModalVisible, couponModalVisible]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      aiService.cleanup();
    };
  }, []);


  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Initial View (Gradient + Text) or Video View */}
      {!isGradientVisible ? (
        <Animated.View style={{ flex: 1, opacity: videoOpacity }}>
          <AIDetailVideoView
            item={item}
            bottomAreaOpacity={bottomAreaOpacity}
            isKeyboardVisible={isKeyboardVisible}
            setIsKeyboardVisible={setIsKeyboardVisible}
            conversationText={conversationText}
            setConversationText={setConversationText}
            isRecording={isRecording}
            setIsRecording={setIsRecording}
            isProcessing={isProcessing}
            setIsProcessing={setIsProcessing}
            selectedDetectionMethod={selectedDetectionMethod}
            onGoBack={handleGoBack}
          />
        </Animated.View>
      ) : (
        <AIDetailInitialView
          item={item}
          gradientOpacity={gradientOpacity}
          textOpacity={textOpacity}
          overlayOpacity={overlayOpacity}
          isGradientVisible={isGradientVisible}
          isTextVisible={isTextVisible}
          onStartPress={handleStartPress}
          onGoBack={handleGoBack}
        />
      )}

      {/* Selection Modal */}
      <SelectionModal
        visible={isSelectionModalVisible}
        onClose={() => setIsSelectionModalVisible(false)}
        onAutoDetectPress={handleAutoDetectPress}
        onHandDetectPress={handleHandDetectPress}
      />

      {/* Coupon Selection Modal */}
      <CouponSelectionModal
        visible={couponSelectionModalVisible}
        onClose={() => setCouponSelectionModalVisible(false)}
        onHasCoupon={handleHasCoupon}
        onNoCoupon={handleNoCoupon}
      />

      {/* Purchase Modal */}
      <PurchaseModal
        visible={purchaseModalVisible}
        onClose={() => setPurchaseModalVisible(false)}
      />

      {/* Coupon Modal */}
      <CouponModal
        visible={couponModalVisible}
        onClose={() => setCouponModalVisible(false)}
        onSuccess={handleCouponSuccess}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AIDetailPage;

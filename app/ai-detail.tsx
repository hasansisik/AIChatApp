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
  const gradientOpacity = useRef(new Animated.Value(1)).current;
  const bottomAreaOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;
  const overlayOpacity = useRef(new Animated.Value(1)).current;
  const videoOpacity = useRef(new Animated.Value(0)).current;
  
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default AIDetailPage;

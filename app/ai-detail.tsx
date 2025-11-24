import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Dimensions,
  Animated,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { RootState } from '@/redux/store';
import ReusableText from '@/components/ui/ReusableText';
import SelectionModal from '@/components/ui/SelectionModal';
import { AICategory, aiCategories } from '@/data/AICategories';
import aiService from '@/services/aiService';
import { sendAudio } from '@/redux/actions/aiActions';
import AIDetailInitialView from '@/components/AI/AIDetailInitialView';
import AIDetailVideoView from '@/components/AI/AIDetailVideoView';

const AIDetailPage = () => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const { id } = useLocalSearchParams();
  const aiState = useSelector((state: RootState) => state.ai);
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
  
  // Get websocket_stream_url from Redux state
  const webStreamUrl = aiState.conversation.websocket_stream_url;

  if (!item) {
    return (
      <View style={styles.container}>
        <ReusableText text={t('ai.notFound')} />
      </View>
    );
  }

  const handleGoBack = () => {
    router.back();
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
    if (item && item.voice) {
      aiService.setVoice(item.voice);
    }
  }, [item]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      aiService.cleanup();
    };
  }, []);

  // Listen for TTS audio and send to conversation
  useEffect(() => {
    const handleTTSAudio = async (audioUri: string) => {
      const conversationId = aiState.conversation.conversation_id;
      if (!conversationId) {
        console.warn('⚠️ [ai-detail] TTS audio alındı ama conversation_id yok');
        return;
      }

      try {
        await dispatch(sendAudio({ conversation_id: conversationId, audio: audioUri }) as any).unwrap();
        console.log('✅ [ai-detail] TTS audio conversation\'a gönderildi');
      } catch (error: any) {
        // 409 Conflict is normal when audio is already being processed - silently ignore
        if (error?.response?.status === 409 || error?.message?.includes('409')) {
          console.log('ℹ️ [ai-detail] TTS audio zaten işleniyor - normal durum');
        } else {
          console.error('❌ [ai-detail] TTS audio gönderilemedi:', error);
        }
      }
    };

    aiService.onTTSAudio(handleTTSAudio);
    return () => {
      aiService.offTTSAudio(handleTTSAudio);
    };
  }, [dispatch, aiState.conversation.conversation_id]);

  // Listen for recording completion and send to conversation for lipsync
  useEffect(() => {
    const handleRecordingForLipsync = async (audioUri: string) => {
      const conversationId = aiState.conversation.conversation_id;
      if (!conversationId) {
        console.warn('⚠️ [ai-detail] Recording alındı ama conversation_id yok');
        return;
      }

      try {
        console.log('🎤 [ai-detail] Recording conversation\'a gönderiliyor...');
        setIsProcessing(true);
        const result = await dispatch(sendAudio({ conversation_id: conversationId, audio: audioUri }) as any).unwrap();
        console.log('✅ [ai-detail] Recording conversation\'a gönderildi:', result);
        
        // Recording sent successfully, server will process it
        // The WebSocket stream will start receiving synchronized video+audio frames
        // isProcessing will be set to false when recording stops (in handleMicrophonePress)
        
        // Clean up the temporary file after sending
        setTimeout(() => {
          const { deleteAsync } = require('expo-file-system/legacy');
          deleteAsync(audioUri, { idempotent: true }).catch(() => {});
        }, 5000);
      } catch (error) {
        console.error('❌ [ai-detail] Recording gönderilemedi:', error);
        setIsProcessing(false);
      }
    };

    aiService.onRecordingForLipsync(handleRecordingForLipsync);
    return () => {
      aiService.offRecordingForLipsync(handleRecordingForLipsync);
    };
  }, [dispatch, aiState.conversation.conversation_id]);

  return (
    <View style={styles.container}>
      <StatusBar
        barStyle="light-content"
        backgroundColor="transparent"
        translucent
      />
      
      {/* Initial View (Gradient + Text) or Video View (WebView + All UI) */}
      {webStreamUrl && !isGradientVisible ? (
        <Animated.View style={{ flex: 1, opacity: videoOpacity }}>
          <AIDetailVideoView
            webStreamUrl={webStreamUrl}
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
            conversationId={aiState.conversation.conversation_id ?? undefined}
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

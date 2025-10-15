import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Image,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  SafeAreaView,
  ScrollView,
  Animated,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import ReusableText from '@/components/ui/ReusableText';
import SelectionModal from '@/components/ui/SelectionModal';
import BottomTextContent from '@/components/ui/BottomTextContent';
import { Colors } from '@/hooks/useThemeColor';
import { AICategory, aiCategories } from '@/data/AICategories';
import aiService from '@/services/aiService';

const { width, height } = Dimensions.get('window');

const AIDetailPage = () => {
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
    });
  };

  const handleKeyboardPress = () => {
    setIsKeyboardVisible(true);
    // Keyboard will be handled by TextInput focus
  };

  const handleMicrophonePress = async () => {
    if (isRecording) {
      // Kayıt durdur
      await stopRecording();
    } else {
      // Kayıt başlat
      await startRecording();
    }
  };

  const startRecording = async () => {
    try {
      const success = await aiService.startRecording();
      if (success) {
        setIsRecording(true);
        setConversationText('Kayıt başladı...');
      } else {
        Alert.alert('Hata', 'Kayıt başlatılamadı');
      }
    } catch (error) {
      console.error('Kayıt başlatma hatası:', error);
      Alert.alert('Hata', 'Kayıt başlatılamadı');
    }
  };

  const stopRecording = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setConversationText('İşleniyor...');

      const audioUri = await aiService.stopRecording();
      if (audioUri) {
        // Backend'e gönder
        const response = await aiService.sendVoiceToAI(audioUri);
        
        if (response.success && response.data) {
          setConversationText(`Sen: ${response.data.transcription}\n\nAI: ${response.data.aiResponse}`);
          
          // AI yanıtını sese çevir ve oynat
          await aiService.textToSpeech(response.data.aiResponse);
        } else {
          Alert.alert('Hata', response.message || 'Ses işlenirken hata oluştu');
          setConversationText('');
        }
      } else {
        Alert.alert('Hata', 'Ses kaydedilemedi');
        setConversationText('');
      }
    } catch (error) {
      console.error('Kayıt durdurma hatası:', error);
      Alert.alert('Hata', 'Kayıt durdurulamadı');
      setConversationText('');
    } finally {
      setIsProcessing(false);
    }
  };


  const handleTextPress = async () => {
    if (conversationText.trim()) {
      // Mevcut metni AI'ye gönder
      setIsProcessing(true);
      try {
        const response = await aiService.sendTextToAI(conversationText);
        if (response.success && response.data) {
          setConversationText(prev => prev + `\n\nAI: ${response.data!.aiResponse}`);
          // AI yanıtını sese çevir ve oynat
          await aiService.textToSpeech(response.data!.aiResponse);
        } else {
          Alert.alert('Hata', response.message || 'Metin işlenirken hata oluştu');
        }
      } catch (error) {
        console.error('Metin gönderme hatası:', error);
        Alert.alert('Hata', 'Metin gönderilemedi');
      } finally {
        setIsProcessing(false);
      }
    } else {
      // Text input'u göster
      setIsKeyboardVisible(true);
    }
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
      
      {/* Full Screen Background Image */}
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
        {/* Conversation Text */}
        {conversationText ? (
          <View style={styles.conversationContainer}>
            <ReusableText
              text={conversationText}
              family="regular"
              size={16}
              color={Colors.lightWhite}
              style={styles.conversationText}
            />
          </View>
        ) : null}
        
        {/* Empty space to push text to bottom */}
        <View style={styles.spacer} />
      </ScrollView>
      
      {/* Bottom Text Content */}
      <BottomTextContent
        item={item}
        isVisible={isTextVisible}
        opacity={textOpacity}
        onStartPress={handleStartPress}
      />
      
      {/* Bottom Area - appears after animation */}
      <Animated.View style={[
        styles.bottomArea, 
        { opacity: bottomAreaOpacity },
        isKeyboardVisible && styles.bottomAreaKeyboard
      ]}>
        <View style={styles.bottomAreaContent}>
          
          {/* 4 Circle Icons */}
          <View style={styles.iconCirclesContainer}>
            <TouchableOpacity style={styles.circleButton} onPress={handleKeyboardPress}>
              <MaterialIcons name="keyboard" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.circleButton, 
                isRecording && styles.recordingButton,
                isProcessing && styles.processingButton
              ]} 
              onPress={handleMicrophonePress}
              disabled={isProcessing}
            >
              {isRecording ? (
                <Ionicons name="stop" size={28} color="white" />
              ) : isProcessing ? (
                <Ionicons name="hourglass-outline" size={28} color="white" />
              ) : selectedDetectionMethod === 'microphone' ? (
                <Ionicons name="mic-outline" size={28} color="white" />
              ) : selectedDetectionMethod === 'hand' ? (
                <Ionicons name="hand-left-outline" size={28} color="white" />
              ) : (
                <Ionicons name="mic-outline" size={28} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.circleButton} onPress={handleTextPress}>
              <Ionicons name="text-outline" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity style={[styles.circleButton, styles.redCircleButton]}>
              <Ionicons name="call" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Keyboard Input */}
      {isKeyboardVisible && (
        <View style={styles.keyboardInputContainer}>
          <TextInput
            style={styles.keyboardInput}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="rgba(255, 255, 255, 0.6)"
            multiline
            autoFocus
            value={conversationText}
            onChangeText={setConversationText}
            onBlur={() => setIsKeyboardVisible(false)}
            onSubmitEditing={handleTextPress}
          />
          <TouchableOpacity 
            style={styles.sendButton}
            onPress={handleTextPress}
          >
            <Ionicons name="send" size={24} color="white" />
          </TouchableOpacity>
        </View>
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
  gradientContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 1,
  },
  bottomGradient: {
    width: '100%',
    height: '100%',
  },
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  bottomAreaKeyboard: {
    bottom: 350,
  },
  bottomAreaContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  bottomAreaTitle: {
    marginBottom: 8,
    textAlign: 'center',
  },
  iconCirclesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
    gap: 30,
  },
  circleButton: {
    padding: 15,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  redCircleButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    borderColor: 'rgba(255, 0, 0, 0.8)',
  },
  keyboardInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    zIndex: 1,
  },
  keyboardInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
    paddingHorizontal: 20,
    paddingVertical: 15,
    color: 'white',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
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
  conversationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 15,
    padding: 15,
    marginHorizontal: 20,
    marginVertical: 10,
  },
  conversationText: {
    lineHeight: 24,
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    borderColor: 'rgba(255, 0, 0, 0.8)',
  },
  processingButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.6)',
    borderColor: 'rgba(255, 165, 0, 0.8)',
  },
  sendButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 0, 130, 0.8)',
  },
});

export default AIDetailPage;

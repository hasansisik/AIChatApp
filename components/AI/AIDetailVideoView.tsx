import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  TextInput,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { AICategory } from '@/data/AICategories';
import aiService from '@/services/aiService';

const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

interface AIDetailVideoViewProps {
  item: AICategory;
  bottomAreaOpacity: Animated.Value;
  isKeyboardVisible: boolean;
  setIsKeyboardVisible: (visible: boolean) => void;
  conversationText: string;
  setConversationText: React.Dispatch<React.SetStateAction<string>>;
  isRecording: boolean;
  setIsRecording: (recording: boolean) => void;
  isProcessing: boolean;
  setIsProcessing: (processing: boolean) => void;
  selectedDetectionMethod: string;
  onGoBack: () => void;
  isDemo?: boolean;
  demoMinutesRemaining?: number | null; // Minutes remaining (not seconds)
}

const AIDetailVideoView: React.FC<AIDetailVideoViewProps> = ({
  item,
  bottomAreaOpacity,
  isKeyboardVisible,
  setIsKeyboardVisible,
  conversationText,
  setConversationText,
  isRecording,
  setIsRecording,
  isProcessing,
  setIsProcessing,
  selectedDetectionMethod,
  onGoBack,
  isDemo = false,
  demoMinutesRemaining = null, // Minutes remaining (not seconds)
}) => {
  const { t } = useTranslation();
  const textInputRef = useRef<TextInput>(null);
  const videoRef = useRef<Video>(null);
  const videoRefTTS = useRef<Video>(null);
  const bottomAreaTranslateY = React.useRef(new Animated.Value(0)).current;
  const inputAreaTranslateY = React.useRef(new Animated.Value(0)).current;
  const isManuallyOpeningKeyboardRef = React.useRef(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [userText, setUserText] = React.useState(''); // Kullanıcının konuştuğu metin
  const [aiText, setAiText] = React.useState(''); // AI'dan dönen metin
  const [sttLanguage, setSttLanguage] = React.useState<'tr' | 'en'>('tr'); // STT dili
  const [isTTSPlaying, setIsTTSPlaying] = React.useState(false); // TTS çalıyor mu?
  const [currentDemoMinutes, setCurrentDemoMinutes] = React.useState<number | null>(demoMinutesRemaining);

  const handleKeyboardPress = () => {
    if (!isKeyboardVisible) {
      // Klavye kapalıysa aç
      isManuallyOpeningKeyboardRef.current = true;
      
      // Android için: Önce tahmini bir klavye yüksekliği ayarla ki input görünsün
      if (Platform.OS === 'android') {
        setKeyboardHeight(300);
        setIsKeyboardVisible(true);
        
        // Android'de render tamamlandıktan sonra focus yap
        // requestAnimationFrame + setTimeout kombinasyonu daha güvenilir
        requestAnimationFrame(() => {
          setTimeout(() => {
            if (textInputRef.current) {
              textInputRef.current.focus();
            }
            setTimeout(() => {
              isManuallyOpeningKeyboardRef.current = false;
            }, 300);
          }, 100);
        });
      } else {
        // iOS için mevcut mantık
        setIsKeyboardVisible(true);
        setTimeout(() => {
          textInputRef.current?.focus();
          setTimeout(() => {
            isManuallyOpeningKeyboardRef.current = false;
          }, 300);
        }, 50);
      }
    } else {
      // Klavye açıksa kapat
      dismissKeyboard();
    }
  };

  const dismissKeyboard = () => {
    Keyboard.dismiss();
    setIsKeyboardVisible(false);
    if (Platform.OS === 'android') {
      setKeyboardHeight(0);
    }
  };

  useEffect(() => {
    if (isKeyboardVisible && textInputRef.current && !isManuallyOpeningKeyboardRef.current) {
      requestAnimationFrame(() => {
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 100);
      });
    }
  }, [isKeyboardVisible]);

  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setIsKeyboardVisible(true);
        const height = event.endCoordinates.height;
        const inputAreaHeight = 80;
        const totalOffset = height + inputAreaHeight;
        
        // Android için klavye yüksekliğini state'e kaydet
        if (Platform.OS === 'android') {
          // screenY: klavyenin başladığı Y pozisyonu (ekranın üstünden)
          const screenY = event.endCoordinates.screenY || 0;
          const calculatedHeight = screenHeight - screenY;
          // Fallback ve minimum değer kontrolü + ekstra 10px güvenlik marjı
          const baseHeight = calculatedHeight > 100 ? calculatedHeight : (height > 100 ? height : 280);
          const finalHeight = baseHeight + 10; // Navigation bar için ekstra offset
          console.log('📱 Android keyboard - screenY:', screenY, 'screenHeight:', screenHeight, 'height:', height, 'final:', finalHeight);
          setKeyboardHeight(finalHeight);
        }

        Animated.timing(bottomAreaTranslateY, {
          toValue: -totalOffset,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 200,
          useNativeDriver: true,
        }).start();

        // iOS için transform kullan
        if (Platform.OS === 'ios') {
          Animated.timing(inputAreaTranslateY, {
            toValue: -height,
            duration: event.duration || 250,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        if (isManuallyOpeningKeyboardRef.current) {
          return;
        }

        setIsKeyboardVisible(false);
        
        // Android için klavye yüksekliğini sıfırla
        if (Platform.OS === 'android') {
          setKeyboardHeight(0);
        }

        Animated.timing(bottomAreaTranslateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 200,
          useNativeDriver: true,
        }).start();

        if (Platform.OS === 'ios') {
          Animated.timing(inputAreaTranslateY, {
            toValue: 0,
            duration: event.duration || 250,
            useNativeDriver: true,
          }).start();
        }
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [setIsKeyboardVisible, bottomAreaTranslateY, inputAreaTranslateY]);

  // Basılı tutma - Kayıt başlat
  const handleMicrophonePressIn = async () => {
    // Android'de klavye açıksa önce kapat ve bekle
    if (Platform.OS === 'android' && isKeyboardVisible) {
      console.log('🔄 Android: Klavye kapatılıyor...');
      Keyboard.dismiss();
      setIsKeyboardVisible(false);
      setKeyboardHeight(0);
      
      // Klavyenin tamamen kapanması için bekle
      await new Promise(resolve => setTimeout(resolve, 400));
    }
    
    // iOS'ta da klavye açıksa kapat
    if (Platform.OS === 'ios' && isKeyboardVisible) {
      Keyboard.dismiss();
      setIsKeyboardVisible(false);
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    try {
      const started = await aiService.startLiveTranscription(item.voice, sttLanguage);
      if (started) {
        setIsRecording(true);
        console.log('✅ Ses kaydı başlatıldı (basılı tutuluyor)');
      } else {
        Alert.alert(t('common.error'), t('ai.recording.startError'));
      }
    } catch (error) {
      console.error('❌ Ses kaydı başlatılamadı:', error);
      Alert.alert(t('common.error'), t('ai.recording.startError'));
    }
  };

  // Bırakma - Kayıt durdur ve STT'ye gönder
  const handleMicrophonePressOut = async () => {
    if (!isRecording) {
      return;
    }

    try {
      await aiService.stopLiveTranscription(true); // shouldSendAudio = true (send)
      setIsRecording(false);
      console.log('⏸️ Kayıt durduruldu, ses gönderildi');
    } catch (error) {
      console.error('❌ Kayıt durdurulamadı:', error);
      setIsRecording(false);
    }
  };

  const handleSendText = async () => {
    const textToSend = conversationText.trim();
    if (!textToSend) {
      setIsKeyboardVisible(true);
      return;
    }

    // Kullanıcının yazdığı metni göster
    setUserText(textToSend);

    // Text mesajını STT yapmadan direkt LLM'e gönder
    try {
      const sent = await aiService.sendTextMessage(textToSend);
      if (sent) {
        setConversationText('');
        setIsKeyboardVisible(false);
        console.log('✅ Text mesajı gönderildi');
      } else {
        Alert.alert(t('common.error'), t('ai.message.sendError'));
        setUserText('');
      }
    } catch (error) {
      console.error('❌ Text mesajı gönderilirken hata:', error);
      Alert.alert(t('common.error'), t('ai.message.sendError'));
      setUserText('');
    }
  };

  // Video loop için useEffect - her iki video için de
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.setIsLoopingAsync(true);
      videoRef.current.setIsMutedAsync(true);
      videoRef.current.playAsync();
    }
    if (videoRefTTS.current) {
      videoRefTTS.current.setIsLoopingAsync(true);
      videoRefTTS.current.setIsMutedAsync(true);
      videoRefTTS.current.playAsync();
    }
  }, []);

  // STT transcription listener - kullanıcının konuştuğu metin
  useEffect(() => {
    const handleTranscription = (text: string) => {
      setUserText(text);
    };

    aiService.onTranscription(handleTranscription);
    return () => {
      aiService.offTranscription(handleTranscription);
    };
  }, []);

  // AI response listener - AI'dan dönen metin
  useEffect(() => {
    const handleStatus = (status: string) => {
      // "AI: " prefix'ini kaldır
      if (status.startsWith('AI: ')) {
        setAiText(status.substring(4));
        // TTS bitene kadar bekle, otomatik temizleme yok
      }
    };

    aiService.onSocketStatus(handleStatus);
    return () => {
      aiService.offSocketStatus(handleStatus);
    };
  }, []);


  // WebSocket bağlantı durumunu takip et
  const [isSocketConnected, setIsSocketConnected] = React.useState(false);

  useEffect(() => {
    const handleSocketConnection = (connected: boolean) => {
      setIsSocketConnected(connected);
      
      if (connected) {
        // WebSocket açıldığında - backend'de timer başlatılıyor, sadece başlangıç değerini göster
        if (isDemo && demoMinutesRemaining !== null && demoMinutesRemaining > 0) {
          setCurrentDemoMinutes(demoMinutesRemaining);
          console.log('📊 WebSocket açıldı, demo süresi gösteriliyor:', demoMinutesRemaining, 'dakika (backend\'de takip ediliyor)');
        }
      } else {
        // WebSocket kapandığında - backend'de timer durduruldu, son değeri göster
        console.log('🛑 WebSocket kapandı, backend\'de timer durduruldu');
      }
    };

    aiService.onSocketConnection(handleSocketConnection);
    
    return () => {
      aiService.offSocketConnection(handleSocketConnection);
    };
  }, [isDemo, demoMinutesRemaining]);

  // Backend'den gelen demo timer güncellemelerini dinle
  useEffect(() => {
    const handleDemoTimerUpdate = (minutesRemaining: number) => {
      if (isDemo) {
        setCurrentDemoMinutes(minutesRemaining);
        console.log('📊 Backend\'den demo süresi güncellendi:', minutesRemaining, 'dakika');
      }
    };

    aiService.onDemoTimerUpdate(handleDemoTimerUpdate);
    
    return () => {
      aiService.offDemoTimerUpdate(handleDemoTimerUpdate);
    };
  }, [isDemo]);

  // Component unmount olduğunda - backend'de zaten socket kapandığında timer durduruluyor
  // Burada ekstra bir şey yapmaya gerek yok

  // Props değiştiğinde (yeni demo süresi geldiğinde) currentDemoMinutes state'ini güncelle
  // Backend'de timer çalışıyor, sadece görüntülemek için state'i güncelle
  useEffect(() => {
    if (isDemo && demoMinutesRemaining !== null && demoMinutesRemaining > 0) {
      // Socket bağlı değilse veya timer çalışmıyorsa, sadece göster
      if (!isSocketConnected) {
        setCurrentDemoMinutes(demoMinutesRemaining);
      }
      // Socket bağlıysa, backend'den gelen güncellemeleri kullan (yukarıdaki useEffect'te)
    } else if (isDemo && (demoMinutesRemaining === null || demoMinutesRemaining <= 0)) {
      // Demo süresi bitti
      setCurrentDemoMinutes(0);
    }
  }, [demoMinutesRemaining, isDemo, isSocketConnected]);

  // TTS Audio listener - AI'dan gelen sesi oynat
  const soundRef = useRef<Audio.Sound | null>(null);
  const isPlayingRef = useRef(false); // Çift oynatmayı önlemek için
  const handlerRef = useRef<((audioUri: string) => Promise<void>) | null>(null);

  useEffect(() => {
    // Handler'ı sadece bir kez oluştur ve ref'te sakla
    if (!handlerRef.current) {
      handlerRef.current = async (audioUri: string) => {
        // Eğer zaten bir ses oynatılıyorsa, yeni sesi yok say
        if (isPlayingRef.current) {
          console.log('⚠️ TTS zaten oynatılıyor, yeni ses yok sayılıyor');
          return;
        }

        try {
          isPlayingRef.current = true;
          console.log('🔊 TTS audio oynatılıyor:', audioUri);
          
          // TTS başladığında video kaynağını değiştir
          setIsTTSPlaying(true);
          
          // Önceki ses varsa durdur
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }

          // Yeni ses dosyasını yükle ve oynat
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: audioUri },
            { shouldPlay: true, volume: 1.0 }
          );
          
          soundRef.current = newSound;

          // Ses bittiğinde temizle ve metinleri kaldır
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish) {
              soundRef.current?.unloadAsync().catch(() => {});
              soundRef.current = null;
              isPlayingRef.current = false; // Oynatma bitti, yeni ses kabul edilebilir
              console.log('✅ TTS audio oynatma tamamlandı, metinler temizleniyor');
              // TTS bittiğinde metinleri temizle ve video kaynağını geri değiştir
              setUserText('');
              setAiText('');
              setIsTTSPlaying(false);
            }
          });
        } catch (error) {
          console.error('❌ TTS audio oynatılamadı:', error);
          isPlayingRef.current = false;
          setIsTTSPlaying(false);
        }
      };
    }

    const handler = handlerRef.current;
    aiService.onTTSAudio(handler);
    
    return () => {
      aiService.offTTSAudio(handler);
      // Cleanup
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      isPlayingRef.current = false;
    };
  }, []);

  return (
    <View style={styles.container}>
      {/* Video Background - Loop, Muted, Full Screen */}
      {/* İki video overlay - yumuşak geçiş için */}
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={item.video}
          style={[styles.video, { opacity: isTTSPlaying ? 0 : 1 }]}
          resizeMode={ResizeMode.COVER}
          isLooping={true}
          isMuted={true}
          shouldPlay={true}
        />
        <Video
          ref={videoRefTTS}
          source={item.videoTTS}
          style={[styles.video, styles.videoOverlay, { opacity: isTTSPlaying ? 1 : 0 }]}
          resizeMode={ResizeMode.COVER}
          isLooping={true}
          isMuted={true}
          shouldPlay={true}
        />
      </View>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={onGoBack}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={Colors.lightWhite} />
            </TouchableOpacity>

            <View style={styles.profileImageContainer}>
              <Image
                source={item.image}
                style={styles.profileImage}
                contentFit="contain"
                transition={200}
                cachePolicy="memory-disk"
                priority="high"
              />
            </View>
          </View>

          <View style={styles.liveChatContainer}>
            {/* Language Switch */}
            <View style={styles.languageContainer}>
              <Image
                source={sttLanguage === 'tr' 
                  ? require('@/assets/images/main/tr.png')
                  : require('@/assets/images/main/en.png')
                }
                style={styles.flagImage}
                contentFit="cover"
                transition={200}
                cachePolicy="memory-disk"
                priority="high"
              />
              <Switch
                value={sttLanguage === 'en'}
                onValueChange={async (value) => {
                  const newLanguage = value ? 'en' : 'tr';
                  const wasRecording = isRecording;
                  
                  // Eğer kayıt aktifse, önce durdur
                  if (wasRecording) {
                    try {
                      await aiService.stopLiveTranscription(false);
                      setIsRecording(false);
                    } catch (error) {
                      console.error('Dil değiştirirken kayıt durdurulamadı:', error);
                    }
                  }
                  
                  // Dil'i güncelle
                  setSttLanguage(newLanguage);
                  
                  // Eğer kayıt aktifse, yeni dil ile yeniden başlat
                  if (wasRecording) {
                    setTimeout(async () => {
                      try {
                        const started = await aiService.startLiveTranscription(item.voice, newLanguage);
                        if (started) {
                          setIsRecording(true);
                          console.log(`✅ Ses kaydı yeni dil ile başlatıldı: ${newLanguage}`);
                        }
                      } catch (error) {
                        console.error('Yeni dil ile kayıt başlatılamadı:', error);
                      }
                    }, 300);
                  }
                }}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: '#4CAF50' }}
                thumbColor={Colors.white}
                style={styles.languageSwitch}
              />
            </View>
            <View style={styles.liveIndicator} />
            <ReusableText
              text={t('ai.liveChat')}
              family="medium"
              size={16}
              color={Colors.lightWhite}
              style={styles.liveChatText}
            />
          </View>
          
          {/* Demo Timer - Header içinde, sağ üstte sabit - Her zaman görünür (isDemo ise) */}
          {isDemo ? (
            <View style={styles.demoTimerHeader}>
              <View style={styles.demoTimerBubble}>
                {currentDemoMinutes !== null && currentDemoMinutes > 0 ? (
                  <ReusableText
                    text={`${t('ai.demo.timer')}: ${Math.floor(currentDemoMinutes)}:${String(Math.floor((currentDemoMinutes % 1) * 60)).padStart(2, '0')}`}
                    family="medium"
                    size={14}
                    color={Colors.white}
                  />
                ) : (
                  <ReusableText
                    text={`${t('ai.demo.timer')}: ${demoMinutesRemaining !== null && demoMinutesRemaining > 0 ? `${Math.floor(demoMinutesRemaining)}:${String(Math.floor((demoMinutesRemaining % 1) * 60)).padStart(2, '0')}` : '0:00'}`}
                    family="medium"
                    size={14}
                    color={isSocketConnected ? Colors.white : Colors.lightWhite}
                  />
                )}
              </View>
            </View>
          ) : null}
        </View>
        
        {/* User Text - Header'ın altında, flex ile */}
        {userText ? (
          <View style={styles.userTextContainer}>
            <View style={styles.userTextBubble}>
              <ReusableText
                text={userText}
                family="regular"
                size={16}
                color={Colors.white}
              />
            </View>
          </View>
        ) : null}
      </SafeAreaView>

      {/* AI Text - Altta */}
      {aiText ? (
        <View style={styles.aiTextContainer}>
          <View style={styles.aiTextBubble}>
            <ReusableText
              text={aiText}
              family="regular"
              size={16}
              color={Colors.white}
            />
          </View>
        </View>
      ) : null}

      <Animated.View
        style={[
          styles.bottomArea,
          {
            opacity: bottomAreaOpacity,
            transform: [{ translateY: bottomAreaTranslateY }],
          },
        ]}
      >
        <View style={styles.bottomAreaContent}>
          <View style={styles.iconCirclesContainer}>
            <TouchableOpacity style={styles.circleButton} onPress={handleKeyboardPress}>
              <MaterialIcons name="keyboard" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.circleButton,
                styles.microphoneButton,
                isRecording && styles.recordingButton,
                !isRecording && styles.pausedButton,
              ]}
              onPressIn={handleMicrophonePressIn}
              onPressOut={handleMicrophonePressOut}
              activeOpacity={0.7}
              delayPressIn={0}
            >
              {isRecording ? (
                <>
                  <Ionicons name="mic" size={28} color="white" />
                  <ReusableText
                    text={t('ai.microphone.speaking')}
                    family="medium"
                    size={12}
                    color={Colors.white}
                    style={styles.buttonText}
                  />
                </>
              ) : (
                <>
                  <Ionicons name="mic-outline" size={28} color="white" />
                  <ReusableText
                    text={t('ai.microphone.pushToTalk')}
                    family="medium"
                    size={12}
                    color={Colors.white}
                    style={styles.buttonText}
                  />
                </>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.circleButton, styles.redCircleButton]}
              onPress={onGoBack}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Keyboard Dismiss Overlay - boş alana tıklayınca klavye kapansın */}
      {isKeyboardVisible && (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.keyboardDismissOverlay} />
        </TouchableWithoutFeedback>
      )}

      {/* Keyboard Input Area */}
      {Platform.OS === 'android' ? (
        // Android: Sabit pozisyonlu View kullan - sadece keyboard height > 0 iken göster
        isKeyboardVisible && keyboardHeight > 0 && (
          <View
            style={[
              styles.keyboardAvoidingContainer,
              { bottom: keyboardHeight }
            ]}
          >
            <View style={styles.keyboardInputWrapper}>
              <TextInput
                ref={textInputRef}
                style={styles.keyboardInput}
                placeholder={t('ai.input.placeholder')}
                placeholderTextColor="rgba(11, 11, 11, 0.5)"
                multiline
                scrollEnabled={false}
                value={conversationText}
                onChangeText={setConversationText}
                onSubmitEditing={handleSendText}
                autoFocus={true}
                showSoftInputOnFocus={true}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !conversationText.trim() && styles.sendButtonDisabled
                ]}
                onPress={handleSendText}
                disabled={!conversationText.trim() || isProcessing}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={20} color={Colors.primary} />
              </TouchableOpacity>
            </View>
          </View>
        )
      ) : (
        // iOS: Animated.View kullan
        <Animated.View
          style={[
            styles.keyboardInputContainer,
            {
              transform: [{ translateY: inputAreaTranslateY }],
              opacity: isKeyboardVisible ? 1 : 0,
            },
          ]}
          pointerEvents={isKeyboardVisible ? 'auto' : 'none'}
        >
          <View style={styles.keyboardInputWrapper}>
            <TextInput
              ref={textInputRef}
              style={styles.keyboardInput}
              placeholder={t('ai.input.placeholder')}
              placeholderTextColor="rgba(11, 11, 11, 0.5)"
              multiline
              scrollEnabled={false}
              value={conversationText}
              onChangeText={setConversationText}
              onSubmitEditing={handleSendText}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                !conversationText.trim() && styles.sendButtonDisabled
              ]}
              onPress={handleSendText}
              disabled={!conversationText.trim() || isProcessing}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={20} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
    backgroundColor: Colors.black,
  },
  videoContainer: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  video: {
    flex: 1,
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1001,
  },
  userTextContainer: {
    paddingHorizontal: 20,
    alignItems: 'flex-start',
    marginTop: 10,
  },
  demoTimerHeader: {
    position: 'absolute',
    top: 60,
    right: 20,
    zIndex: 10,
  },
  demoTimerBubble: {
    backgroundColor: 'rgba(255, 152, 0, 0.8)',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
    minHeight: 80,
    position: 'relative',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveChatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
    gap: 12,
  },
  languageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flagImage: {
    width: 24,
    height: 18,
    borderRadius: 2,
  },
  languageSwitch: {
    transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }],
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  liveChatText: {
    opacity: 0.9,
  },
  profileImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
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
  bottomArea: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: Platform.OS === 'android' ? 80 : 60,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  keyboardDismissOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 9998, // bottomArea'nın altında ama diğerlerinin üstünde
  },
  bottomAreaContent: {
    alignItems: 'center',
    paddingHorizontal: 20,
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
  recordingButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.8)',
    borderColor: 'rgba(76, 175, 80, 1)',
  },
  pausedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.5)',
    opacity: 1, // Pause durumunda da tam görünür olsun
  },
  keyboardInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    width: '100%',

    zIndex: 10000,
  },
  keyboardAvoidingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    width: '100%',
    zIndex: 10000,
    elevation: 10, // Android için elevation ekle
  },
  keyboardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    paddingBottom: Platform.OS === 'android' ? 16 : 25,
  },
  keyboardInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    color: 'black',
    fontSize: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.white,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.white,
    shadowOpacity: 0,
    elevation: 0,
  },
  microphoneButton: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minWidth: 80,
    paddingVertical: 12,
  },
  buttonText: {
    marginTop: 2,
  },
  userTextBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  aiTextContainer: {
    position: 'absolute',
    bottom: 200,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 1000,
    alignItems: 'flex-end',
  },
  aiTextBubble: {
    backgroundColor: 'rgba(75, 0, 130, 0.8)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
});

export default AIDetailVideoView;
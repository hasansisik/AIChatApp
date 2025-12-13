import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  TextInput,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { Image } from 'expo-image';
import { Video, ResizeMode } from 'expo-av';
import { Audio } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Switch } from 'react-native';
import ReusableText from '@/components/ui/ReusableText';
import { useReactiveColors } from '@/hooks/useThemeColor';
import { Colors as StaticColors } from '@/constants/Colors';
import { AICategory } from '@/data/AICategories';
import aiService from '@/services/aiService';
import translationService from '@/services/translationService';

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
  const Colors = useReactiveColors();
  const textInputRef = useRef<TextInput>(null);
  const videoRef = useRef<Video>(null);
  const videoRefTTS = useRef<Video>(null);
  const bottomAreaTranslateY = React.useRef(new Animated.Value(0)).current;
  const inputAreaTranslateY = React.useRef(new Animated.Value(0)).current;
  const microphoneButtonScale = React.useRef(new Animated.Value(1)).current;
  const isManuallyOpeningKeyboardRef = React.useRef(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);
  const [userText, setUserText] = React.useState('');
  const [aiText, setAiText] = React.useState('');
  const [userOriginalText, setUserOriginalText] = React.useState(''); // Orijinal çeviri metni
  const [isAIResponding, setIsAIResponding] = React.useState(false); // AI cevap veriyor mu?
  const [sttLanguage, setSttLanguage] = React.useState<'tr' | 'en'>('tr');
  const [isTTSPlaying, setIsTTSPlaying] = React.useState(false);
  // Demo süresi saniye cinsinden tutulur, basit geri sayım sayacı
  const [currentDemoSeconds, setCurrentDemoSeconds] = React.useState<number | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = React.useState(false);
  const [isVideoTTSLoaded, setIsVideoTTSLoaded] = React.useState(false);
  const [showTranscriptions, setShowTranscriptions] = React.useState(true);
  const [isSocketReady, setIsSocketReady] = React.useState(false); // WebSocket hazır mı?
  const [isStartingRecording, setIsStartingRecording] = React.useState(false); // Kayıt başlatılıyor mu?
  const demoExpiredShownRef = React.useRef(false); // Demo süresi doldu uyarısı gösterildi mi?
  const [userTextHeight, setUserTextHeight] = React.useState(0); // Kullanıcı mesajının yüksekliği

  const dynamicStyles = React.useMemo(() => ({
    sendButton: {
      backgroundColor: Colors.light,
      shadowColor: Colors.light,
    },
    sendButtonDisabled: {
      backgroundColor: Colors.light,
    },
    keyboardInput: {
      color: Colors.text,
      backgroundColor: Colors.lightInput,
      borderColor: Colors.lightGray,
    },
    closeButton: {
      borderColor: '#FFFFFF',
    },
    circleButton: {
      // Video üzerinde her zaman görünür olması için yarı saydam
      backgroundColor: 'rgba(255, 255, 255, 0.25)',
      borderColor: 'rgba(255, 255, 255, 0.4)',
    },
    userTextBubble: {
      // Kullanıcı mesajı - koyu arka plan, beyaz yazı
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    userTextColor: {
      color: Colors.light, // Her zaman beyaz
    },
    aiTextBubble: {
      // AI mesajı - mor/mavi arka plan
      backgroundColor: Colors.primary,
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    aiTextColor: {
      color: Colors.light, // Her zaman beyaz
    },
    demoTimerBubble: {
      // Demo timer - turuncu arka plan
      backgroundColor: 'rgba(255, 152, 0, 0.75)',
      borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    demoTimerColor: {
      color: Colors.light, // Her zaman beyaz
    },
    headerText: {
      color: Colors.light,
    },
    placeholderColor: Colors.gray,
    transcriptionToggleButton: {
      backgroundColor: showTranscriptions ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 0, 0, 0.6)',
      borderColor: showTranscriptions ? 'rgba(255, 255, 255, 0.4)' : 'rgba(255, 0, 0, 0.8)',
    },
  }), [Colors, showTranscriptions]);

  const handleKeyboardPress = () => {
    if (!isKeyboardVisible) {
      isManuallyOpeningKeyboardRef.current = true;
      
      if (Platform.OS === 'android') {
        setKeyboardHeight(300);
        setIsKeyboardVisible(true);
        
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
        setIsKeyboardVisible(true);
        setTimeout(() => {
          textInputRef.current?.focus();
          setTimeout(() => {
            isManuallyOpeningKeyboardRef.current = false;
          }, 300);
        }, 50);
      }
    } else {
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
        
        if (Platform.OS === 'android') {
          const screenY = event.endCoordinates.screenY || 0;
          const calculatedHeight = screenHeight - screenY;
          const baseHeight = calculatedHeight > 100 ? calculatedHeight : (height > 100 ? height : 280);
          const finalHeight = baseHeight + 10;
          setKeyboardHeight(finalHeight);
        }

        Animated.timing(bottomAreaTranslateY, {
          toValue: -totalOffset,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 200,
          useNativeDriver: true,
        }).start();

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

  const handleMicrophonePressIn = async () => {
    // Kayıt başlatılıyor durumunu aktif et
    setIsStartingRecording(true);

    // Klavye varsa önce kapat (hızlıca)
    if (isKeyboardVisible) {
      Keyboard.dismiss();
      setIsKeyboardVisible(false);
      if (Platform.OS === 'android') {
        setKeyboardHeight(0);
      }
    }
    
    // Buton animasyonu: Hemen yeşile dön ve hafifçe büyüt (daha hızlı ve smooth)
    Animated.spring(microphoneButtonScale, {
      toValue: 1.08,
      useNativeDriver: true,
      tension: 400,
      friction: 8,
    }).start();
    
    try {
      // Kayıt başlatmayı hemen yap - bu socket'i de otomatik açacak
      const started = await aiService.startLiveTranscription(item.voice, sttLanguage);
      if (started) {
        setIsRecording(true);
        setIsStartingRecording(false);
        // Socket başarıyla açıldı
        setIsSocketReady(true);
      } else {
        // Eğer kayıt başlatılamazsa, geri al
        setIsStartingRecording(false);
        Animated.spring(microphoneButtonScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 400,
          friction: 8,
        }).start();
      }
    } catch (error: any) {
      // Hata durumunda geri al
      setIsStartingRecording(false);
      Animated.spring(microphoneButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }).start();
    }
  };

  const handleMicrophonePressOut = async () => {
    // Kayıt başlatılıyor durumundaysa iptal et
    if (isStartingRecording) {
      setIsStartingRecording(false);
      Animated.spring(microphoneButtonScale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      }).start();
      return;
    }

    if (!isRecording) {
      return;
    }

    // Buton animasyonu: Normal boyuta dön (smooth)
    Animated.spring(microphoneButtonScale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 400,
      friction: 8,
    }).start();

    try {
      // Son kelimeleri yakalamak için kısa bir gecikme
      // Bu, mikrofon bırakıldığında konuşmanın son kısmının kaybolmasını önler
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await aiService.stopLiveTranscription(true);
      setIsRecording(false);
    } catch (error) {
      setIsRecording(false);
    }
  };

  const handleSendText = async () => {
    const textToSend = conversationText.trim();
    if (!textToSend) {
      setIsKeyboardVisible(true);
      return;
    }

    setUserText(textToSend);

    try {
      const sent = await aiService.sendTextMessage(textToSend);
      if (sent) {
        setConversationText('');
        setIsKeyboardVisible(false);
      } else {
        setUserText('');
      }
    } catch (error) {
      setUserText('');
    }
  };

  useEffect(() => {
    const initializeVideos = async () => {
      // Her iki video da yüklendiğinde başlat
      if (!isVideoLoaded || !isVideoTTSLoaded) {
        return;
      }
      
      
      if (videoRef.current) {
        try {
          await videoRef.current.setIsLoopingAsync(true);
          await videoRef.current.setIsMutedAsync(true);
          await videoRef.current.playAsync();
        } catch (error) {
        }
      }
      if (videoRefTTS.current) {
        try {
          await videoRefTTS.current.setIsLoopingAsync(true);
          await videoRefTTS.current.setIsMutedAsync(true);
          await videoRefTTS.current.playAsync();
        } catch (error) {
        }
      }
    };
    
    initializeVideos();
  }, [isVideoLoaded, isVideoTTSLoaded]);

  // Component mount olduğunda WebSocket'in hazır olmasını bekle
  // Socket aiService içinde lazy olarak açılıyor, burada sadece durumu dinliyoruz
  useEffect(() => {
  }, []);

  // TTS oynatma durumuna göre videoları kontrol et
  useEffect(() => {
    const updateVideos = async () => {
      if (videoRef.current && !isTTSPlaying) {
        try {
          const status = await videoRef.current.getStatusAsync();
          if (!status.isLoaded || !status.isPlaying) {
            await videoRef.current.playAsync();
          }
        } catch (error) {
          // Ignore
        }
      }
      if (videoRefTTS.current && isTTSPlaying) {
        try {
          const status = await videoRefTTS.current.getStatusAsync();
          if (!status.isLoaded || !status.isPlaying) {
            await videoRefTTS.current.playAsync();
          }
        } catch (error) {
          // Ignore
        }
      }
    };
    
    updateVideos();
  }, [isTTSPlaying]);

  useEffect(() => {
    const handleTranscription = (text: string) => {
      // AI cevap veriyorsa STT güncellemelerini yoksay
      if (isAIResponding) {
        return;
      }
      
      setUserText(text);
      // Kullanıcı konuştuğunda orijinal metni sakla
      setUserOriginalText(text);
    };

    aiService.onTranscription(handleTranscription);
    return () => {
      aiService.offTranscription(handleTranscription);
    };
  }, [isAIResponding]);

  // AI cevabı geldiğinde user text'i güncelle
  useEffect(() => {
    if (aiText) {
      // AI cevap vermeye başladı
      setIsAIResponding(true);
      
      // AI'ın İngilizce cevabını Türkçeye çevir
      translationService.translateToTurkish(aiText)
        .then((translatedText) => {
          setUserText(`${t('ai.translation')}: ${translatedText}`);
        })
        .catch((error) => {
          // Hata durumunda orijinal İngilizce metni göster
          setUserText(`${t('ai.translation')}: ${aiText}`);
        });
    }
  }, [aiText, t]);

  useEffect(() => {
    const handleStatus = (status: string) => {
      if (status.startsWith('AI: ')) {
        const aiResponse = status.substring(4);
        setAiText(aiResponse);
        // AI cevap vermeye başladı, STT güncellemelerini durdur
        setIsAIResponding(true);
      }
    };

    aiService.onSocketStatus(handleStatus);
    return () => {
      aiService.offSocketStatus(handleStatus);
    };
  }, []);

  // WebSocket bağlantı durumunu dinle
  useEffect(() => {
    const handleSocketConnection = (isConnected: boolean) => {
      setIsSocketReady(isConnected);
    };

    aiService.onSocketConnection(handleSocketConnection);
    return () => {
      aiService.offSocketConnection(handleSocketConnection);
    };
  }, []);

  // Demo timer: Basit geri sayım sayacı, hiçbir yere bağlı değil
  useEffect(() => {
    if (!isDemo) {
      setCurrentDemoSeconds(null);
      demoExpiredShownRef.current = false;
      return;
    }

    // Prop'tan gelen dakika değerini saniyeye çevir
    const initialSeconds = demoMinutesRemaining !== null && demoMinutesRemaining > 0
      ? Math.floor(demoMinutesRemaining * 60)
      : 0;

    setCurrentDemoSeconds(initialSeconds);
    demoExpiredShownRef.current = false; // Timer yeniden başladığında ref'i sıfırla

    // Eğer süre 0 ise timer başlatma
    if (initialSeconds <= 0) {
      return;
    }

    // Her saniye 1 saniye azalt
    const interval = setInterval(() => {
      setCurrentDemoSeconds((prevSeconds) => {
        if (prevSeconds !== null && prevSeconds <= 1) {
          return 0;
        }
        const newValue = prevSeconds !== null ? prevSeconds - 1 : 0;
        if (newValue % 10 === 0) {
        }
        return newValue;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, [isDemo, demoMinutesRemaining]);

  // Demo süresi dolduğunda uyarı göster
  useEffect(() => {
    // currentDemoSeconds null değilse ve 0 ise ve daha önce gösterilmediyse
    if (isDemo && currentDemoSeconds !== null && currentDemoSeconds === 0 && !demoExpiredShownRef.current) {
      demoExpiredShownRef.current = true;
      
      // Küçük bir gecikme ile alert göster (state güncellemelerinin tamamlanması için)
      setTimeout(() => {
        Alert.alert(
          t('demo.expired.title'),
          t('demo.expired.message'),
          [
            {
              text: 'OK',
              onPress: () => {
                onGoBack();
              }
            }
          ],
          { cancelable: false }
        );
      }, 100);
    }
  }, [isDemo, currentDemoSeconds, t, onGoBack]);

  const soundRef = useRef<Audio.Sound | null>(null);
  const isPlayingRef = useRef(false);
  const lastPlayedUriRef = useRef<string | null>(null);

  useEffect(() => {
      const handler = async (audioUri: string) => {
        // Duplicate kontrolü: Aynı URI'yi tekrar oynatmayı engelle
        if (isPlayingRef.current || lastPlayedUriRef.current === audioUri) {
          return;
        }

        try {
          isPlayingRef.current = true;
          lastPlayedUriRef.current = audioUri;
        
        setIsTTSPlaying(true);
        
        // Önceki ses varsa temizle
        if (soundRef.current) {
          try {
            await soundRef.current.unloadAsync();
          } catch (e) {
            // Ignore
          }
          soundRef.current = null;
        }

        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          shouldDuckAndroid: false,
          playThroughEarpieceAndroid: false,
          staysActiveInBackground: false,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: audioUri },
          { shouldPlay: true, volume: 1.0 }
        );
        
        soundRef.current = newSound;

        newSound.setOnPlaybackStatusUpdate(async (status) => {
          if (status.isLoaded && status.didJustFinish) {
            try {
              await soundRef.current?.unloadAsync();
            } catch (e) {
              // Ignore
            }
            soundRef.current = null;
            isPlayingRef.current = false;
            lastPlayedUriRef.current = null;
            
            setUserText('');
            setUserOriginalText('');
            setAiText('');
            setIsAIResponding(false); // AI cevabı bitti, STT tekrar çalışabilir
            setIsTTSPlaying(false);
          }
        });
      } catch (error) {
        isPlayingRef.current = false;
        lastPlayedUriRef.current = null;
        setIsTTSPlaying(false);
      }
    };

    aiService.onTTSAudio(handler);
    
    return () => {
      aiService.offTTSAudio(handler);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
      isPlayingRef.current = false;
      lastPlayedUriRef.current = null;
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.videoContainer}>
        <Video
          ref={videoRef}
          source={item.video}
          style={[styles.video, { opacity: isTTSPlaying ? 0 : 1 }]}
          resizeMode={ResizeMode.COVER}
          isLooping={true}
          isMuted={true}
          shouldPlay={true}
          useNativeControls={false}
          onLoad={() => {
            setIsVideoLoaded(true);
          }}
          onReadyForDisplay={() => {
          }}
          onError={(error) => {
            setIsVideoLoaded(true); // Hata durumunda da devam et
          }}
        />
        <Video
          ref={videoRefTTS}
          source={item.videoTTS}
          style={[styles.video, styles.videoOverlay, { opacity: isTTSPlaying ? 1 : 0 }]}
          resizeMode={ResizeMode.COVER}
          isLooping={true}
          isMuted={true}
          shouldPlay={true}
          useNativeControls={false}
          onLoad={() => {
            setIsVideoTTSLoaded(true);
          }}
          onReadyForDisplay={() => {
          }}
          onError={(error) => {
            setIsVideoTTSLoaded(true); // Hata durumunda da devam et
          }}
        />
        
        {/* Loading Indicator - Videolar yüklenene kadar göster */}
        {(!isVideoLoaded || !isVideoTTSLoaded) && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </View>

      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            <TouchableOpacity 
              style={[styles.closeButton, dynamicStyles.closeButton]} 
              onPress={onGoBack}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color="#FFFFFF" />
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
                  
                  // Eğer kayıt aktifse, önce durdur ve temizle
                  if (wasRecording) {
                    try {
                      await aiService.stopLiveTranscription(false);
                      setIsRecording(false);
                      setIsStartingRecording(false);
                      
                      // Buton animasyonunu sıfırla
                      Animated.spring(microphoneButtonScale, {
                        toValue: 1,
                        useNativeDriver: true,
                        tension: 400,
                        friction: 8,
                      }).start();
                      
                    } catch (error) {
                    }
                  }
                  
                  // Dil'i güncelle
                  setSttLanguage(newLanguage);
                  
                  // Socket'i yeniden başlatmak için kısa bir gecikme
                  // Bu, socket'in temiz bir durumda olmasını sağlar
                  if (wasRecording) {
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    try {
                      setIsStartingRecording(true);
                      
                      const started = await aiService.startLiveTranscription(item.voice, newLanguage);
                      if (started) {
                        setIsRecording(true);
                        setIsStartingRecording(false);
                        setIsSocketReady(true);
                        
                        // Buton animasyonu
                        Animated.spring(microphoneButtonScale, {
                          toValue: 1.08,
                          useNativeDriver: true,
                          tension: 400,
                          friction: 8,
                        }).start();
                      } else {
                        setIsStartingRecording(false);
                      }
                    } catch (error) {
                      setIsStartingRecording(false);
                    }
                  }
                }}
                trackColor={{ false: 'rgba(255, 255, 255, 0.3)', true: '#2ecc71' }}
                thumbColor="#FFFFFF"
                style={styles.languageSwitch}
              />
            </View>
            <View style={styles.liveIndicator} />
            <ReusableText
              text={t('ai.liveChat')}
              family="medium"
              size={16}
              color="#FFFFFF"
              style={styles.liveChatText}
            />
          </View>
          
          {isDemo && currentDemoSeconds !== null ? (
            <View style={styles.demoTimerHeader}>
              <View style={[styles.demoTimerBubble, dynamicStyles.demoTimerBubble]}>
                {(() => {
                  const displayMinutes = Math.floor(currentDemoSeconds / 60);
                  const displaySeconds = currentDemoSeconds % 60;
                  
                  return (
                    <ReusableText
                      text={`${t('ai.demo.timer')}: ${displayMinutes}:${String(displaySeconds).padStart(2, '0')}`}
                      family="medium"
                      size={14}
                      color="#FFFFFF"
                    />
                  );
                })()}
              </View>
            </View>
          ) : null}
        </View>
        
        {showTranscriptions && userText ? (
          <View 
            style={styles.userTextContainer}
            onLayout={(event) => {
              const { height } = event.nativeEvent.layout;
              setUserTextHeight(height);
            }}
          >
            <View style={[styles.userTextBubble, dynamicStyles.userTextBubble]}>
              <ScrollView
                style={styles.messageScrollView}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                persistentScrollbar={true}
              >
                <ReusableText
                  text={userText}
                  family="regular"
                  size={16}
                  color="#FFFFFF"
                />
              </ScrollView>
            </View>
          </View>
        ) : null}
      </SafeAreaView>

      {showTranscriptions && aiText ? (
        <View style={styles.aiTextContainer}>
          <View style={[styles.aiTextBubble, dynamicStyles.aiTextBubble]}>
            <ScrollView
              style={styles.messageScrollView}
              showsVerticalScrollIndicator={true}
              nestedScrollEnabled={true}
              persistentScrollbar={true}
            >
              <ReusableText
                text={aiText}
                family="regular"
                size={16}
                color="#FFFFFF"
              />
            </ScrollView>
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
            <TouchableOpacity style={[styles.circleButton, dynamicStyles.circleButton]} onPress={handleKeyboardPress}>
              <MaterialIcons name="keyboard" size={28} color="#FFFFFF" />
            </TouchableOpacity>
            
            {/* Transcription Toggle Button - Icon Only */}
            <TouchableOpacity 
              style={[styles.circleButton, dynamicStyles.transcriptionToggleButton]}
              onPress={() => setShowTranscriptions(!showTranscriptions)}
              activeOpacity={0.7}
            >
              <MaterialIcons 
                name={showTranscriptions ? "subtitles" : "subtitles-off"} 
                size={28} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            
            <Animated.View
              style={[
                styles.circleButton,
                styles.microphoneButton,
                isStartingRecording && styles.preparingButton, // Kayıt başlatılıyorsa sarı
                isRecording && !isStartingRecording && styles.recordingButton, // Kayıt aktifse yeşil
                !isRecording && !isStartingRecording && styles.pausedButton, // Normal durumda beyaz
                {
                  transform: [{ scale: microphoneButtonScale }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.microphoneButtonInner}
                onPressIn={handleMicrophonePressIn}
                onPressOut={handleMicrophonePressOut}
                activeOpacity={1}
                delayPressIn={0}
              >
              {isStartingRecording ? (
                <>
                  <Ionicons name="hourglass-outline" size={28} color="#FFFFFF" />
                  <ReusableText
                    text={t('ai.microphone.preparing')}
                    family="medium"
                    size={12}
                    color="#FFFFFF"
                    style={styles.buttonText}
                  />
                </>
              ) : isRecording ? (
                <>
                  <Ionicons name="mic" size={28} color="#FFFFFF" />
                  <ReusableText
                    text={t('ai.microphone.speaking')}
                    family="medium"
                    size={12}
                    color="#FFFFFF"
                    style={styles.buttonText}
                  />
                </>
              ) : (
                <>
                  <Ionicons name="mic-outline" size={28} color="#FFFFFF" />
                  <ReusableText
                    text={t('ai.microphone.pushToTalk')}
                    family="medium"
                    size={12}
                    color="#FFFFFF"
                    style={styles.buttonText}
                  />
                </>
              )}
              </TouchableOpacity>
            </Animated.View>
            <TouchableOpacity
              style={[styles.circleButton, styles.redCircleButton]}
              onPress={onGoBack}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {isKeyboardVisible && (
        <TouchableWithoutFeedback onPress={dismissKeyboard}>
          <View style={styles.keyboardDismissOverlay} />
        </TouchableWithoutFeedback>
      )}

      {Platform.OS === 'android' ? (
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
                style={[styles.keyboardInput, dynamicStyles.keyboardInput]}
                placeholder={t('ai.input.placeholder')}
                placeholderTextColor={dynamicStyles.placeholderColor}
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
                  dynamicStyles.sendButton,
                  !conversationText.trim() && [styles.sendButtonDisabled, dynamicStyles.sendButtonDisabled]
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
              style={[styles.keyboardInput, dynamicStyles.keyboardInput]}
              placeholder={t('ai.input.placeholder')}
              placeholderTextColor={dynamicStyles.placeholderColor}
              multiline
              scrollEnabled={false}
              value={conversationText}
              onChangeText={setConversationText}
              onSubmitEditing={handleSendText}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                dynamicStyles.sendButton,
                !conversationText.trim() && [styles.sendButtonDisabled, dynamicStyles.sendButtonDisabled]
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
    backgroundColor: '#000000',
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
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
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
    marginTop: 8,
  },
  demoTimerHeader: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
  },
  demoTimerBubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
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
    backgroundColor: '#2ecc71',
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
    borderColor: '#FFFFFF',
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
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  redCircleButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    borderColor: 'rgba(255, 0, 0, 0.8)',
  },
  recordingButton: {
    backgroundColor: '#2ecc71',
    borderColor: '#2ecc71',
    shadowColor: '#2ecc71',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  pausedButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  preparingButton: {
    backgroundColor: 'rgba(255, 193, 7, 0.8)', // Sarı - Hazırlanıyor
    borderColor: 'rgba(255, 193, 7, 1)',
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
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sendButtonDisabled: {
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
  microphoneButtonInner: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    width: '100%',
    height: '100%',
  },
  buttonText: {
    marginTop: 2,
  },
  userTextBubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
    borderWidth: 1,
    maxHeight: 225,
  },
  aiTextContainer: {
    position: 'absolute',
    bottom: 175,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
    zIndex: 1000,
  },
  aiTextBubble: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: '85%',
    borderWidth: 1,
    maxHeight: 300,
  },
  messageScrollView: {
    width: '100%',
    flexGrow: 0,
  },
});

export default AIDetailVideoView;
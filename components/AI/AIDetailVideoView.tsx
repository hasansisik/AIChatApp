import React from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  TextInput,
  Alert,
  Platform,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/redux/store';
import { sendAudio } from '@/redux/actions/aiActions';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { AICategory } from '@/data/AICategories';
import aiService from '@/services/aiService';
import { Sizes } from '@/constants/Sizes';

const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
const { width: screenWidth, height: screenHeight } = Dimensions.get('screen');

interface AIDetailVideoViewProps {
  webStreamUrl: string;
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
}

const AIDetailVideoView: React.FC<AIDetailVideoViewProps> = ({
  webStreamUrl,
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
}) => {
  const router = useRouter();
  const dispatch = useDispatch();
  const aiState = useSelector((state: RootState) => state.ai);

  const handleKeyboardPress = () => {
    setIsKeyboardVisible(true);
  };

  const handleMicrophonePress = async () => {
    if (isRecording) {
      await stopRecording();
    } else {
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
        const response = await aiService.sendVoiceToAI(audioUri);
        
        if (response.success && response.data) {
          setConversationText(`Sen: ${response.data.transcription}\n\nAI: ${response.data.aiResponse}`);
          
          // Backend zaten TTS yapıp audioUrl döndürüyor, direkt kullan
          if (response.data.audioUrl) {
            console.log('🎵 [AIDetailVideoView] Backend\'den gelen audioUrl oynatılıyor');
            // Ses dosyasını oynat (async olarak, beklemeden devam et)
            aiService.playAudioFromUrl(response.data.audioUrl).catch(err => {
              console.error('❌ [AIDetailVideoView] Ses oynatma hatası:', err);
            });
            
            // AudioUrl'i sendAudio'ya gönder
            if (aiState.conversation.conversation_id) {
              console.log('📤 [AIDetailVideoView] Backend audioUrl sendAudio\'ya gönderiliyor');
              dispatch(sendAudio({
                conversation_id: aiState.conversation.conversation_id,
                audio: response.data.audioUrl,
              }) as any);
            }
          }
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
      setIsProcessing(true);
      try {
        const response = await aiService.sendTextToAI(conversationText);
        if (response.success && response.data) {
          setConversationText((prev: string) => prev + `\n\nAI: ${response.data!.aiResponse}`);
          
          // TTS çağrısı yap (async olarak, beklemeden devam et)
          aiService.textToSpeech(response.data!.aiResponse).then(audioUrl => {
            if (audioUrl && aiState.conversation.conversation_id) {
              console.log('📤 [AIDetailVideoView] TTS audioUrl sendAudio\'ya gönderiliyor');
              dispatch(sendAudio({
                conversation_id: aiState.conversation.conversation_id,
                audio: audioUrl,
              }) as any);
            }
          }).catch(err => {
            console.error('❌ [AIDetailVideoView] TTS hatası:', err);
          });
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
      setIsKeyboardVisible(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* WebView Background */}
      <WebView
        source={{ uri: webStreamUrl }}
        style={styles.webView}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={false}
        mixedContentMode="always"
        allowsFullscreenVideo={true}
        scalesPageToFit={true}
        androidLayerType="hardware"
        androidHardwareAccelerationDisabled={false}
        originWhitelist={['*']}
        injectedJavaScriptBeforeContentLoaded={`
          (function() {
            // Viewport meta tag ekle - sayfa yüklenmeden önce
            var meta = document.createElement('meta');
            meta.name = 'viewport';
            meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            document.head.appendChild(meta);
          })();
          true;
        `}
        injectedJavaScript={`
          (function() {
            // Viewport meta tag güncelle
            var viewport = document.querySelector('meta[name="viewport"]');
            if (!viewport) {
              viewport = document.createElement('meta');
              viewport.name = 'viewport';
              viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
              document.head.appendChild(viewport);
            } else {
              viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
            }
            
            // CSS stillerini ekle
            var style = document.createElement('style');
            style.id = 'fullscreen-styles';
            style.innerHTML = \`
              * {
                margin: 0 !important;
                padding: 0 !important;
                box-sizing: border-box !important;
              }
              html {
                width: 100vw !important;
                height: 100vh !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: black !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                -webkit-overflow-scrolling: touch !important;
              }
              body {
                width: 100vw !important;
                height: 100vh !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                margin: 0 !important;
                padding: 0 !important;
                overflow: hidden !important;
                background: black !important;
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                right: 0 !important;
                bottom: 0 !important;
                -webkit-overflow-scrolling: touch !important;
              }
              video, iframe, canvas, img {
                position: absolute !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                height: 100vh !important;
                min-width: 100vw !important;
                min-height: 100vh !important;
                max-width: 100vw !important;
                max-height: 100vh !important;
                object-fit: cover !important;
                object-position: center !important;
                background: black !important;
                border: none !important;
              }
            \`;
            
            // Eski stil varsa kaldır
            var oldStyle = document.getElementById('fullscreen-styles');
            if (oldStyle) {
              oldStyle.remove();
            }
            document.head.appendChild(style);
            
            // HTML ve body stillerini doğrudan uygula
            document.documentElement.style.width = '100vw';
            document.documentElement.style.height = '100vh';
            document.documentElement.style.margin = '0';
            document.documentElement.style.padding = '0';
            document.documentElement.style.overflow = 'hidden';
            document.documentElement.style.position = 'fixed';
            document.documentElement.style.top = '0';
            document.documentElement.style.left = '0';
            document.documentElement.style.right = '0';
            document.documentElement.style.bottom = '0';
            
            if (document.body) {
              document.body.style.width = '100vw';
              document.body.style.height = '100vh';
              document.body.style.margin = '0';
              document.body.style.padding = '0';
              document.body.style.overflow = 'hidden';
              document.body.style.position = 'fixed';
              document.body.style.top = '0';
              document.body.style.left = '0';
              document.body.style.right = '0';
              document.body.style.bottom = '0';
            }
            
            // Tüm medya elementlerini güncelle
            function updateMediaElements() {
              var elements = document.querySelectorAll('video, iframe, canvas, img');
              elements.forEach(function(el) {
                el.style.position = 'absolute';
                el.style.top = '0';
                el.style.left = '0';
                el.style.width = '100vw';
                el.style.height = '100vh';
                el.style.objectFit = 'cover';
                el.style.objectPosition = 'center';
                el.style.background = 'black';
                if (el.tagName === 'IFRAME') {
                  el.style.border = 'none';
                }
              });
            }
            
            // İlk güncelleme
            updateMediaElements();
            
            // DOM değişikliklerini izle
            var observer = new MutationObserver(function(mutations) {
              updateMediaElements();
            });
            
            observer.observe(document.body || document.documentElement, {
              childList: true,
              subtree: true
            });
            
            // Sayfa yüklendiğinde tekrar güncelle
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', updateMediaElements);
            } else {
              updateMediaElements();
            }
            
            // Window resize'da güncelle
            window.addEventListener('resize', updateMediaElements);
          })();
          true;
        `}
        onMessage={() => {}}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      />

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
      

      
      {/* Bottom Area - Control Buttons */}
      <Animated.View style={[
        styles.bottomArea, 
        { opacity: bottomAreaOpacity },
        isKeyboardVisible && styles.bottomAreaKeyboard
      ]}>
        <View style={styles.bottomAreaContent}>
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
  webView: {
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
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: screenWidth,
    height: screenHeight,

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
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    borderColor: 'rgba(255, 0, 0, 0.8)',
  },
  processingButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.6)',
    borderColor: 'rgba(255, 165, 0, 0.8)',
  },
  keyboardInputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
    zIndex: 10000,
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
  sendButton: {
    position: 'absolute',
    right: 15,
    top: 15,
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(75, 0, 130, 0.8)',
  },
});

export default AIDetailVideoView;

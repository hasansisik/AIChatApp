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
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { AICategory } from '@/data/AICategories';
import aiService from '@/services/aiService';
import { Sizes } from '@/constants/Sizes';

const { width, height } = Dimensions.get('window');

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
      setIsProcessing(true);
      try {
        const response = await aiService.sendTextToAI(conversationText);
        if (response.success && response.data) {
          setConversationText((prev: string) => prev + `\n\nAI: ${response.data!.aiResponse}`);
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
          allowsFullscreenVideo={true}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          scalesPageToFit={true}
          injectedJavaScript={`
            (function() {
              // Viewport meta tag ekle
              var viewport = document.querySelector('meta[name="viewport"]');
              if (!viewport) {
                viewport = document.createElement('meta');
                viewport.name = 'viewport';
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
                document.head.appendChild(viewport);
              } else {
                viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
              }
              
              var style = document.createElement('style');
              style.innerHTML = \`
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  width: 100% !important;
                  height: 100% !important;
                  overflow: hidden !important;
                  background: black !important;
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  -webkit-overflow-scrolling: touch !important;
                }
                video {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: contain !important;
                  background: black !important;
                }
                iframe {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  border: none !important;
                  object-fit: contain !important;
                }
                canvas {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: contain !important;
                }
                img {
                  position: absolute !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  object-fit: contain !important;
                }
              \`;
              document.head.appendChild(style);
              
              // Video elementlerini de güncelle
              setTimeout(function() {
                var videos = document.querySelectorAll('video');
                videos.forEach(function(video) {
                  video.style.position = 'absolute';
                  video.style.top = '0';
                  video.style.left = '0';
                  video.style.width = '100%';
                  video.style.height = '100%';
                  video.style.objectFit = 'contain';
                });
                
                var iframes = document.querySelectorAll('iframe');
                iframes.forEach(function(iframe) {
                  iframe.style.position = 'absolute';
                  iframe.style.top = '0';
                  iframe.style.left = '0';
                  iframe.style.width = '100%';
                  iframe.style.height = '100%';
                });
              }, 100);
            })();
            true;
          `}
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
      
      {/* Content Area */}
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
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
        
        <View style={styles.spacer} />
      </ScrollView>
      
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
    width: width,
    height: height,
    backgroundColor: 'black',
  },
  webView: {
    flex: 1,
    backgroundColor: 'black',
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
    marginTop: 120,
    zIndex: 100,
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

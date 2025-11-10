import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/hooks/useThemeColor';
import { FontSizes } from '@/constants/Fonts';
import ReusableText from '@/components/ui/ReusableText';
import aiService from '@/services/aiService';
import * as ImagePicker from 'expo-image-picker';
import { Audio } from 'expo-av';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: string;
  imageUri?: string;
  audioUri?: string;
}

interface ChatBotProps {
  visible: boolean;
  onClose: () => void;
}

const ChatBot: React.FC<ChatBotProps> = ({ visible, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [botStatus, setBotStatus] = useState<'online' | 'typing'>('online');
  const scrollViewRef = useRef<ScrollView>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    // İzinleri iste
    (async () => {
      if (Platform.OS !== 'web') {
        await ImagePicker.requestMediaLibraryPermissionsAsync();
        await ImagePicker.requestCameraPermissionsAsync();
        await Audio.requestPermissionsAsync();
      }
    })();
  }, []);

  useEffect(() => {
    if (visible && messages.length === 0) {
      // İlk açılışta hoş geldin mesajı
      const welcomeMessage: Message = {
        id: '1',
        text: 'Merhaba! Size nasıl yardımcı olabilirim? Projectxwire uygulaması veya hizmetleri hakkında herhangi bir sorunuz varsa, memnuniyetle yanıtlarım.',
        isUser: false,
        timestamp: getCurrentTime(),
      };
      setMessages([welcomeMessage]);
    }
  }, [visible]);

  useEffect(() => {
    // Mesajlar değiştiğinde scroll'u en alta kaydır
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSendText = async () => {
    // Görsel seçildiyse text olmadan gönderilmesin
    if (selectedImage && !inputText.trim()) {
      Alert.alert('Uyarı', 'Görsel göndermek için lütfen bir mesaj yazın');
      return;
    }
    if (!inputText.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: getCurrentTime(),
      imageUri: selectedImage || undefined,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setSelectedImage(null);
    setIsProcessing(true);
    setBotStatus('typing');

    try {
      const response = await aiService.sendTextToAI(userMessage.text || 'Görsel gönderildi');
      
      if (response.success && response.data?.aiResponse) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.aiResponse,
          isUser: false,
          timestamp: getCurrentTime(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        Alert.alert('Hata', response.message || 'Mesaj gönderilirken hata oluştu');
      }
    } catch (error) {
      console.error('Mesaj gönderme hatası:', error);
      Alert.alert('Hata', 'Mesaj gönderilirken hata oluştu');
    } finally {
      setIsProcessing(false);
      setBotStatus('online');
    }
  };

  // Görsel seçme
  const handleImagePicker = async () => {
    try {
      Alert.alert(
        'Görsel Seç',
        'Görsel seçmek için bir seçenek seçin',
        [
          {
            text: 'Galeri',
            onPress: async () => {
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0].uri);
              }
            },
          },
          {
            text: 'Kamera',
            onPress: async () => {
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });

              if (!result.canceled && result.assets[0]) {
                setSelectedImage(result.assets[0].uri);
              }
            },
          },
          {
            text: 'İptal',
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Görsel seçme hatası:', error);
      Alert.alert('Hata', 'Görsel seçilemedi');
    }
  };

  // Ses kaydetme (AI'dan bağımsız)
  const handleVoicePress = async () => {
    if (isRecording) {
      await stopRecordingOnly();
    } else {
      await startRecordingOnly();
    }
  };

  const startRecordingOnly = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        Alert.alert('Hata', 'Mikrofon izni gerekli!');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      recordingRef.current = recording;
      setIsRecording(true);
    } catch (error) {
      console.error('Kayıt başlatma hatası:', error);
      Alert.alert('Hata', 'Kayıt başlatılamadı');
    }
  };

  const stopRecordingOnly = async () => {
    try {
      if (!recordingRef.current) {
        return;
      }

      await recordingRef.current.stopAndUnloadAsync();
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);

      if (uri) {
        const audioMessage: Message = {
          id: Date.now().toString(),
          text: '',
          isUser: true,
          timestamp: getCurrentTime(),
          audioUri: uri,
        };
        setMessages((prev) => [...prev, audioMessage]);
      }
    } catch (error) {
      console.error('Kayıt durdurma hatası:', error);
      Alert.alert('Hata', 'Kayıt durdurulamadı');
      setIsRecording(false);
    }
  };

  // AI ile ses kaydetme (mevcut fonksiyon)
  const handleAIVoicePress = async () => {
    if (isRecording) {
      await stopRecordingAI();
    } else {
      await startRecordingAI();
    }
  };

  const startRecordingAI = async () => {
    try {
      const success = await aiService.startRecording();
      if (success) {
        setIsRecording(true);
      } else {
        Alert.alert('Hata', 'Kayıt başlatılamadı');
      }
    } catch (error) {
      console.error('Kayıt başlatma hatası:', error);
      Alert.alert('Hata', 'Kayıt başlatılamadı');
    }
  };

  const stopRecordingAI = async () => {
    try {
      setIsRecording(false);
      setIsProcessing(true);
      setBotStatus('typing');

      const audioUri = await aiService.stopRecording();
      if (audioUri) {
        const response = await aiService.sendVoiceToAI(audioUri);
        
        if (response.success && response.data) {
          // Kullanıcı mesajı (transcription)
          const userMessage: Message = {
            id: Date.now().toString(),
            text: response.data.transcription,
            isUser: true,
            timestamp: getCurrentTime(),
          };
          
          // Bot mesajı
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: response.data.aiResponse,
            isUser: false,
            timestamp: getCurrentTime(),
          };
          
          setMessages((prev) => [...prev, userMessage, botMessage]);
        } else {
          Alert.alert('Hata', response.message || 'Ses işlenirken hata oluştu');
        }
      } else {
        Alert.alert('Hata', 'Ses kaydedilemedi');
      }
    } catch (error) {
      console.error('Kayıt durdurma hatası:', error);
      Alert.alert('Hata', 'Kayıt durdurulamadı');
    } finally {
      setIsProcessing(false);
      setBotStatus('online');
    }
  };

  const getTodayLabel = () => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const todayStr = today.toDateString();
    const yesterdayStr = yesterday.toDateString();
    
    // Basit bir kontrol - gerçek uygulamada daha detaylı olabilir
    return 'Bugün';
  };

  // Ses oynatıcı component
  const AudioPlayer = ({ uri }: { uri: string }) => {
    const [sound, setSound] = useState<Audio.Sound | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [duration, setDuration] = useState<number | null>(null);
    const [position, setPosition] = useState<number | null>(null);

    useEffect(() => {
      return () => {
        if (sound) {
          sound.unloadAsync();
        }
      };
    }, [sound]);

    const loadSound = async () => {
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri },
          { shouldPlay: false }
        );
        setSound(newSound);
        
        const status = await newSound.getStatusAsync();
        if (status.isLoaded) {
          setDuration(status.durationMillis || null);
        }

        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded) {
            setIsPlaying(status.isPlaying);
            setPosition(status.positionMillis);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPosition(0);
            }
          }
        });
      } catch (error) {
        console.error('Ses yükleme hatası:', error);
      }
    };

    useEffect(() => {
      loadSound();
    }, [uri]);

    const playPause = async () => {
      if (!sound) return;

      try {
        if (isPlaying) {
          await sound.pauseAsync();
        } else {
          await sound.playAsync();
        }
      } catch (error) {
        console.error('Ses oynatma hatası:', error);
      }
    };

    const formatTime = (millis: number | null) => {
      if (!millis) return '0:00';
      const totalSeconds = Math.floor(millis / 1000);
      const minutes = Math.floor(totalSeconds / 60);
      const seconds = totalSeconds % 60;
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
      <View style={styles.audioPlayer}>
        <TouchableOpacity onPress={playPause} style={styles.playButton}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={20}
            color={Colors.primary}
          />
        </TouchableOpacity>
        <View style={styles.audioInfo}>
          <View style={styles.audioProgressBar}>
            <View
              style={[
                styles.audioProgress,
                {
                  width: duration && position
                    ? `${(position / duration) * 100}%`
                    : '0%',
                },
              ]}
            />
          </View>
          <ReusableText
            text={formatTime(position) + ' / ' + formatTime(duration)}
            family="regular"
            size={FontSizes.xxSmall}
            color={Colors.description}
          />
        </View>
      </View>
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
        >
          {/* Header */}
          <LinearGradient
            colors={[Colors.tabBarGradientStart, Colors.tabBarGradientEnd]}
            style={styles.header}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <MaterialCommunityIcons name="robot" size={24} color={Colors.lightGray} />
                </View>
                {botStatus === 'online' && (
                  <View style={styles.onlineIndicator} />
                )}
              </View>
              <View style={styles.headerTextContainer}>
                <ReusableText
                  text="Bot"
                  family="bold"
                  size={FontSizes.medium}
                  color={Colors.white}
                />
                {botStatus === 'typing' ? (
                  <ReusableText
                    text="Yazıyor..."
                    family="regular"
                    size={FontSizes.xSmall}
                    color={Colors.white}
                  />
                ) : (
                  <ReusableText
                    text="İnternet üzerinden"
                    family="regular"
                    size={FontSizes.xSmall}
                    color={Colors.white}
                  />
                )}
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={28} color={Colors.white} />
            </TouchableOpacity>
          </LinearGradient>

          {/* Chat Area */}
          <ScrollView
            ref={scrollViewRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Date Separator */}
            <View style={styles.dateSeparator}>
              <ReusableText
                text={getTodayLabel()}
                family="regular"
                size={FontSizes.small}
                color={Colors.description}
              />
            </View>

            {/* Messages */}
            {messages.map((message) => (
              <View
                key={message.id}
                style={[
                  styles.messageContainer,
                  message.isUser ? styles.userMessageContainer : styles.botMessageContainer,
                ]}
              >
                {!message.isUser && (
                  <View style={styles.botAvatar}>
                    <MaterialCommunityIcons name="robot" size={20} color={Colors.lightGray} />
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  {message.imageUri && (
                    <Image
                      source={{ uri: message.imageUri }}
                      style={styles.messageImage}
                      resizeMode="cover"
                    />
                  )}
                  {message.audioUri && (
                    <AudioPlayer uri={message.audioUri} />
                  )}
                  {message.text && (
                    <ReusableText
                      text={message.text}
                      family="regular"
                      size={FontSizes.small}
                      color={message.isUser ? Colors.black : Colors.black}
                    />
                  )}
                </View>
                <ReusableText
                  text={message.timestamp}
                  family="regular"
                  size={FontSizes.xxSmall}
                  color={Colors.description}
                  style={styles.timestamp}
                />
              </View>
            ))}

            {isProcessing && (
              <View style={styles.botMessageContainer}>
                <View style={styles.botAvatar}>
                  <MaterialCommunityIcons name="robot" size={20} color={Colors.lightGray} />
                </View>
                <View style={[styles.messageBubble, styles.botBubble]}>
                  <ActivityIndicator size="small" color={Colors.primary} />
                </View>
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          {selectedImage && (
            <View style={styles.selectedImageWrapper}>
              <View style={styles.selectedImageContainer}>
                <Image
                  source={{ uri: selectedImage }}
                  style={styles.selectedImage}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  style={styles.removeImageButton}
                  onPress={() => setSelectedImage(null)}
                >
                  <Ionicons name="close-circle" size={24} color={Colors.red} />
                </TouchableOpacity>
              </View>
            </View>
          )}
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Bir mesaj yaz..."
              placeholderTextColor={Colors.description}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isProcessing}
            />
            <View style={styles.inputIcons}>
              <TouchableOpacity
                style={styles.iconButton}
                onPress={handleImagePicker}
                disabled={isProcessing}
              >
                <Ionicons name="attach" size={24} color={Colors.description} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.iconButton, isRecording && styles.recordingButton]}
                onPress={handleVoicePress}
                disabled={isProcessing}
              >
                {isRecording ? (
                  <ActivityIndicator size="small" color={Colors.red} />
                ) : (
                  <Ionicons name="mic" size={24} color={Colors.description} />
                )}
              </TouchableOpacity>
              {inputText.trim() && (
                <TouchableOpacity
                  style={styles.sendButton}
                  onPress={handleSendText}
                  disabled={isProcessing}
                >
                  <Ionicons name="send" size={20} color={Colors.white} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Footer Branding */}
          <View style={styles.footer}>
            <ReusableText
              text="dialogfusion"
              family="regular"
              size={FontSizes.xSmall}
              color={Colors.description}
            />
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.backgroundBox,
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.green,
    borderWidth: 2,
    borderColor: Colors.green,
  },
  headerTextContainer: {
    gap: 2,
  },
  closeButton: {
    padding: 4,
  },
  chatArea: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 20,
  },
  dateSeparator: {
    alignSelf: 'center',
    backgroundColor: Colors.backgroundBox,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 16,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  userMessageContainer: {
    alignSelf: 'flex-end',
    alignItems: 'flex-end',
  },
  botMessageContainer: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  botAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.backgroundBox,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
  },
  userBubble: {
    backgroundColor: Colors.backgroundBox,
  },
  botBubble: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.lightGray,
  },
  timestamp: {
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.backgroundBox,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: FontSizes.small,
    color: Colors.black,
    maxHeight: 100,
  },
  inputIcons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  recordingButton: {
    opacity: 0.6,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    paddingVertical: 8,
    alignItems: 'center',
    backgroundColor: Colors.white,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 8,
  },
  audioPlayer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    minWidth: 250,
  },
  playButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.backgroundBox,
    justifyContent: 'center',
    alignItems: 'center',
  },
  audioInfo: {
    flex: 1,
    gap: 4,
    minWidth: 200,
  },
  audioProgressBar: {
    height: 4,
    backgroundColor: Colors.backgroundBox,
    borderRadius: 2,
    overflow: 'hidden',
    width: '100%',
    minWidth: 200,
  },
  audioProgress: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  selectedImageWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
    backgroundColor: Colors.backgroundBox,
  },
  selectedImageContainer: {
    position: 'relative',
    alignSelf: 'flex-start',
  },
  selectedImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: Colors.white,
    borderRadius: 12,
  },
});

export default ChatBot;


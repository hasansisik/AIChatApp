import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Image,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  TextInput,
  Alert,
  Platform,
  Keyboard,
  KeyboardAvoidingView,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'react-i18next';
import ReusableText from '@/components/ui/ReusableText';
import { Colors } from '@/hooks/useThemeColor';
import { AICategory } from '@/data/AICategories';
import aiService from '@/services/aiService';
import { endConversation } from '@/redux/actions/aiActions';

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
  conversationId?: string;
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
  conversationId,
}) => {
  const { t } = useTranslation();
  const router = useRouter();
  const dispatch = useDispatch();
  const textInputRef = useRef<TextInput>(null);
  const bottomAreaTranslateY = React.useRef(new Animated.Value(0)).current;
  const inputAreaTranslateY = React.useRef(new Animated.Value(0)).current;
  const isManuallyOpeningKeyboardRef = React.useRef(false);
  const [keyboardHeight, setKeyboardHeight] = React.useState(0);

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

  const handleMicrophonePress = async () => {
    if (isProcessing) {
      return;
    }

    if (!isRecording) {
      setIsProcessing(true);
      
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
        const started = await aiService.startLiveTranscription(item.voice);
        setIsProcessing(false);
        if (started) {
          setIsRecording(true);
          console.log('✅ Ses kaydı başlatıldı');
        } else {
          Alert.alert(t('common.error'), t('ai.recording.startError'));
        }
      } catch (error) {
        console.error('❌ Ses kaydı başlatılamadı:', error);
        setIsProcessing(false);
        Alert.alert(t('common.error'), t('ai.recording.startError'));
      }
      return;
    }

    // Pause durumu: Sadece kaydı durdur, ses gönderme
    // Kullanıcı tekrar basarsa kayıt devam edecek
    try {
      await aiService.stopLiveTranscription(false); // shouldSendAudio = false (pause)
      setIsRecording(false);
      setIsProcessing(false);
      console.log('⏸️ Kayıt pause edildi, ses gönderilmedi');
    } catch (error) {
      setIsProcessing(false);
      setIsRecording(false);
    }
  };

  const handleSendText = async () => {
    const textToSend = conversationText.trim();
    if (!textToSend) {
      setIsKeyboardVisible(true);
      return;
    }

    // Text mesajını STT yapmadan direkt LLM'e gönder
    setIsProcessing(true);
    try {
      const sent = await aiService.sendTextMessage(textToSend);
      if (sent) {
        setConversationText('');
        setIsKeyboardVisible(false);
        console.log('✅ Text mesajı gönderildi');
      } else {
        Alert.alert(t('common.error'), t('ai.message.sendError'));
      }
    } catch (error) {
      console.error('❌ Text mesajı gönderilirken hata:', error);
      Alert.alert(t('common.error'), t('ai.message.sendError'));
    } finally {
      setIsProcessing(false);
    }
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        html, body {
          width: 100vw;
          height: 100vh;
          overflow: hidden;
          background: black;
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
        }
        #video-container {
          width: 100vw;
          height: 100vh;
          position: absolute;
          top: 0;
          left: 0;
          background: black;
        }
        video, canvas, img {
          width: 100vw;
          height: 100vh;
          object-fit: contain;
          position: absolute;
          top: 0;
          left: 0;
        }
      </style>
    </head>
    <body>
      <div id="video-container">
        <video id="video" autoplay playsinline muted style="display:none;"></video>
        <canvas id="canvas"></canvas>
        <img id="img" style="display:none;" />
      </div>
      <script>
        (function() {
          const wsUrl = '${webStreamUrl}';
          console.log('🔌 Connecting to WebSocket:', wsUrl);
          
          const video = document.getElementById('video');
          const canvas = document.getElementById('canvas');
          const img = document.getElementById('img');
          const ctx = canvas.getContext('2d');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          
          let ws = null;
          let frameCount = 0;
          let streamStartTime = null;
          let lastFrameTime = null;
          let audioChunkCount = 0;
          let totalAudioBytes = 0;
          let firstAudioChunkTime = null;
          let firstFrameReceived = false;
          let firstAudioChunkReceived = false;
          
          // Simple audio context for playing stream audio
          let audioContext = null;
          let currentSampleRate = 16000;
          let currentChannels = 1;
          let nextPlayTime = 0;
          
          function initAudioContext(sampleRate, channels) {
            if (!audioContext) {
              try {
                audioContext = new (window.AudioContext || window.webkitAudioContext)({
                  sampleRate: sampleRate
                });
                currentSampleRate = sampleRate;
                currentChannels = channels;
                nextPlayTime = audioContext.currentTime + 0.1;
                console.log('✅ AudioContext initialized with sample rate:', sampleRate, 'channels:', channels);
                
                if (audioContext.state === 'suspended') {
                  audioContext.resume().then(() => {
                    console.log('✅ AudioContext resumed');
                    nextPlayTime = audioContext.currentTime + 0.1;
                  }).catch((error) => {
                    console.error('❌ AudioContext resume hatası:', error);
                  });
                }
              } catch (error) {
                console.error('❌ AudioContext oluşturulamadı:', error);
                try {
                  audioContext = new (window.AudioContext || window.webkitAudioContext)();
                  currentSampleRate = audioContext.sampleRate;
                  currentChannels = channels;
                  nextPlayTime = audioContext.currentTime + 0.1;
                } catch (e) {
                  console.error('❌ Fallback AudioContext oluşturulamadı:', e);
                }
              }
            } else if (audioContext.sampleRate !== sampleRate || currentChannels !== channels) {
              // Sample rate veya channel değiştiyse yeniden oluştur
              try {
                audioContext.close();
              } catch (e) {}
              audioContext = null;
              initAudioContext(sampleRate, channels);
            }
            return audioContext;
          }
          
          async function playAudioChunk(pcmData, sampleRate, channels) {
            // Initialize AudioContext if needed
            if (!audioContext || audioContext.sampleRate !== sampleRate || currentChannels !== channels) {
              initAudioContext(sampleRate, channels);
            }
            
            if (!audioContext) {
              console.warn('⚠️ AudioContext yok, audio oynatılamıyor');
              return;
            }
            
            // Resume AudioContext if suspended
            if (audioContext.state === 'suspended') {
              try {
                await audioContext.resume();
                nextPlayTime = audioContext.currentTime + 0.1;
              } catch (error) {
                console.error('❌ AudioContext resume hatası:', error);
                return;
              }
            }
            
            try {
              // PCM16 to Float32Array conversion
              const samples = new Int16Array(pcmData);
              const frameCount = samples.length / channels;
              const float32Samples = new Float32Array(samples.length);
              
              // Convert with proper normalization and 3x volume boost
              // 3 katına çıkar ama clipping önle
              const volumeBoost = 3.0;
              for (let i = 0; i < samples.length; i++) {
                const normalized = samples[i] / 32767.0;
                const boosted = normalized * volumeBoost;
                float32Samples[i] = Math.max(-1.0, Math.min(1.0, boosted));
              }
              
              // Create AudioBuffer
              const audioBuffer = audioContext.createBuffer(channels, frameCount, sampleRate);
              
              if (channels === 1) {
                const channelData = audioBuffer.getChannelData(0);
                channelData.set(float32Samples);
              } else {
                const leftChannel = audioBuffer.getChannelData(0);
                const rightChannel = audioBuffer.getChannelData(1);
                for (let i = 0; i < frameCount; i++) {
                  leftChannel[i] = float32Samples[i * channels];
                  rightChannel[i] = float32Samples[i * channels + 1];
                }
              }
              
              // Schedule playback for seamless audio
              const playAt = Math.max(nextPlayTime, audioContext.currentTime);
              const source = audioContext.createBufferSource();
              source.buffer = audioBuffer;
              source.connect(audioContext.destination);
              source.start(playAt);
              
              console.log('▶️ Audio chunk playing (3x volume):', 'Duration:', audioBuffer.duration.toFixed(3) + 's', 'Play at:', playAt.toFixed(3), 'Current time:', audioContext.currentTime.toFixed(3));
              
              // Update next play time
              nextPlayTime = playAt + audioBuffer.duration;
              
            } catch (error) {
              console.error('❌ Audio oynatma hatası:', error);
            }
          }
          
          function connectWebSocket() {
            try {
              console.log('🔌 Connecting to WebSocket...');
              ws = new WebSocket(wsUrl);
              
              ws.binaryType = 'arraybuffer'; // Binary data için
              
              ws.onopen = function() {
                console.log('✅ WebSocket connected');
                streamStartTime = Date.now();
                // Initialize AudioContext with default values (will be updated when first audio chunk arrives)
                initAudioContext(16000, 1);
                // React Native'e mesaj gönder
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ws_status',
                  status: 'connected'
                }));
              };
              
              ws.onmessage = function(event) {
                // Binary data kontrolü
                if (event.data instanceof ArrayBuffer) {
                  handleBinaryData(event.data);
                } else if (event.data instanceof Blob) {
                  event.data.arrayBuffer().then(buffer => handleBinaryData(buffer));
                } else if (typeof event.data === 'string') {
                  console.log('📝 String data received:', event.data.substring(0, 100));
                  handleStringData(event.data);
                }
              };
              
              ws.onerror = function(error) {
                console.error('❌ WebSocket error:', error);
                // React Native'e mesaj gönder
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ws_status',
                  status: 'error',
                  error: String(error)
                }));
                // Reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
              };
              
              ws.onclose = function(event) {
                console.log('🔌 WebSocket closed, code:', event.code, 'reason:', event.reason, '- Reconnecting...');
                // React Native'e mesaj gönder
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'ws_status',
                  status: 'closed',
                  code: event.code,
                  reason: event.reason
                }));
                // Reconnect after 3 seconds
                setTimeout(connectWebSocket, 3000);
              };
            } catch (error) {
              console.error('❌ WebSocket connection error:', error);
              setTimeout(connectWebSocket, 3000);
            }
          }
          
          function handleStringData(data) {
            // Text mesajları genellikle status update'leri için kullanılır
            console.log('📝 Text message:', data);
            try {
              const json = JSON.parse(data);
              console.log('📋 JSON message:', json);
            } catch (e) {
              // JSON değilse direkt text mesajı
            }
          }
          
          function handleBinaryData(buffer) {
            try {
              const view = new DataView(buffer);
              
              // İlk byte type indicator: 0 = video frame, 1 = audio chunk
              const type = view.getUint8(0);
              
              if (type === 0) {
                // Video frame (JPEG) - ilk byte'ı atla, kalanı JPEG olarak göster
                frameCount++;
                lastFrameTime = Date.now();
                if (frameCount % 30 === 0) {
                  const elapsed = streamStartTime ? (lastFrameTime - streamStartTime) / 1000 : 0;
                  console.log('📹 Receiving frames... (' + frameCount + ') Elapsed: ' + elapsed.toFixed(2) + 's');
                }
                
                const jpegData = buffer.slice(1); // İlk byte'ı atla
                const jpeg = new Blob([jpegData], { type: 'image/jpeg' });
                const url = URL.createObjectURL(jpeg);
                
                img.onload = function() {
                  // Canvas'ı temizle
                  ctx.clearRect(0, 0, canvas.width, canvas.height);
                  
                  // Image boyutlarını al
                  const imgWidth = img.naturalWidth;
                  const imgHeight = img.naturalHeight;
                  
                  // Aspect ratio'yu koruyarak canvas'a sığdır (contain)
                  const canvasAspect = canvas.width / canvas.height;
                  const imgAspect = imgWidth / imgHeight;
                  
                  let drawWidth, drawHeight, drawX, drawY;
                  
                  if (imgAspect > canvasAspect) {
                    // Image daha geniş, yatay
                    drawWidth = canvas.width;
                    drawHeight = canvas.width / imgAspect;
                    drawX = 0;
                    drawY = (canvas.height - drawHeight) / 2;
                  } else {
                    // Image daha yüksek, dikey
                    drawHeight = canvas.height;
                    drawWidth = canvas.height * imgAspect;
                    drawX = (canvas.width - drawWidth) / 2;
                    drawY = 0;
                  }
                  
                  ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
                  
                  // Eski blob URL'ini temizle
                  setTimeout(() => URL.revokeObjectURL(url), 2000);
                };
                img.onerror = function() {
                  console.error('❌ Image load error');
                  URL.revokeObjectURL(url);
                };
                img.src = url;
                
                if (frameCount === 1) {
                  console.log('✅ First video frame received');
                  streamStartTime = Date.now();
                  firstFrameReceived = true;
                  // React Native'e ilk frame geldiğini bildir
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'first_frame',
                    timestamp: streamStartTime,
                    frameCount: frameCount,
                    audioChunkCount: audioChunkCount
                  }));
                } else if (frameCount > 1) {
                  // Her frame'de güncel sayıları gönder
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'frame_received',
                    frameCount: frameCount,
                    audioChunkCount: audioChunkCount
                  }));
                }
                
              } else if (type === 1) {
                // Audio chunk (PCM16) - Stream'den gelen ses chunk'larını oynat
                const sampleRate = view.getUint32(1, false);
                const channels = view.getUint8(5);
                const pcmData = buffer.slice(6);
                
                audioChunkCount++;
                totalAudioBytes += pcmData.byteLength;
                
                console.log('🔊 Audio chunk received:', audioChunkCount, 'Sample rate:', sampleRate, 'Channels:', channels, 'Size:', pcmData.byteLength, 'bytes');
                
                // Play audio chunk
                playAudioChunk(pcmData, sampleRate, channels);
                
                if (!firstAudioChunkTime) {
                  firstAudioChunkTime = Date.now();
                  firstAudioChunkReceived = true;
                  console.log('✅ First audio chunk received and playing');
                  // React Native'e ilk audio chunk geldiğini bildir
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'first_audio_chunk',
                    timestamp: firstAudioChunkTime,
                    frameCount: frameCount,
                    audioChunkCount: audioChunkCount
                  }));
                }
                
                // Her audio chunk'ta güncel sayıları gönder
                window.ReactNativeWebView.postMessage(JSON.stringify({
                  type: 'audio_chunk_received',
                  frameCount: frameCount,
                  audioChunkCount: audioChunkCount
                }));
                
                // Her 10 chunk'ta bir log ve stream süresini güncelle
                if (audioChunkCount % 10 === 0) {
                  const elapsed = firstAudioChunkTime ? (Date.now() - firstAudioChunkTime) / 1000 : 0;
                  const estimatedDuration = (totalAudioBytes / 2 / channels / sampleRate); // PCM16 = 2 bytes per sample
                  
                  // Stream süresini tahmin et: elapsed time (gerçek geçen süre) + gelecek tahmini
                  // Elapsed time stream'in gerçek süresini gösterir (boşluklar dahil)
                  // Gelecek için: kalan audio chunk'ların tahmini süresi
                  // Daha konservatif tahmin: elapsed time'ın 1.2-1.5 katı (boşluklar için buffer)
                  const streamDurationEstimate = elapsed * 1.3; // Gerçek geçen sürenin 1.3 katı (boşluklar için)
                  
                  console.log('🔇 Audio chunks received:', audioChunkCount, 'Total bytes:', totalAudioBytes, 'Elapsed:', elapsed.toFixed(2) + 's', 'Est. duration:', estimatedDuration.toFixed(2) + 's', 'Stream est:', streamDurationEstimate.toFixed(2) + 's');
                  
                  // React Native'e audio chunk bilgilerini gönder (elapsed time'ı stream süresi olarak kullan)
                  window.ReactNativeWebView.postMessage(JSON.stringify({
                    type: 'audio_chunk_info',
                    chunkCount: audioChunkCount,
                    totalBytes: totalAudioBytes,
                    elapsed: elapsed,
                    estimatedDuration: estimatedDuration,
                    streamDurationEstimate: streamDurationEstimate // Gerçek stream süresi tahmini
                  }));
                }
                
              } else {
                // Bilinmeyen type, direkt JPEG olarak dene
                const bytes = new Uint8Array(buffer);
                if (bytes[0] === 0xFF && bytes[1] === 0xD8 && bytes[2] === 0xFF) {
                  // JPEG magic number - direkt JPEG
                  const blob = new Blob([buffer], { type: 'image/jpeg' });
                  displayBlobImage(blob);
                } else {
                  console.log('⚠️ Unknown binary data type:', type, 'Size:', buffer.byteLength);
                }
              }
            } catch (error) {
              console.error('❌ Binary data handling error:', error);
            }
          }
          
          function displayBlobImage(blob) {
            const url = URL.createObjectURL(blob);
            img.onload = function() {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              setTimeout(() => URL.revokeObjectURL(url), 2000);
            };
            img.onerror = function() {
              console.error('❌ Blob image load error');
              URL.revokeObjectURL(url);
            };
            img.src = url;
          }
          
          // Bağlantıyı başlat
          connectWebSocket();
          
          // Window resize
          window.addEventListener('resize', function() {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
          });
        })();
      </script>
    </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      {/* WebView Background */}
      <WebView
        source={{ html: htmlContent }}
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
        onConsoleMessage={(event: any) => {
          console.log('🌐 WebView Console:', event.nativeEvent.message);
        }}
        userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1"
      />

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={onGoBack}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={24} color={Colors.lightWhite} />
          </TouchableOpacity>

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
              family="regular"
              size={20}
              color={Colors.lightWhite}
              style={styles.nameText}
            />
          </View>

          <View style={styles.liveChatContainer}>
            <View style={styles.liveIndicator} />
            <ReusableText
              text={t('ai.liveChat')}
              family="medium"
              size={16}
              color={Colors.lightWhite}
              style={styles.liveChatText}
            />
          </View>
        </View>
      </SafeAreaView>

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
                isRecording && styles.recordingButton,
                isProcessing && styles.processingButton,
                !isRecording && !isProcessing && styles.pausedButton,
              ]}
              onPress={handleMicrophonePress}
              activeOpacity={0.7}
            >
              {isRecording ? (
                <Ionicons name="stop" size={28} color="white" />
              ) : isProcessing ? (
                <Ionicons name="hourglass-outline" size={28} color="white" />
              ) : selectedDetectionMethod === 'hand' ? (
                <Ionicons name="hand-left-outline" size={28} color="white" />
              ) : (
                <Ionicons name="mic-outline" size={28} color="white" />
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
    paddingHorizontal: 10,
    paddingTop: 10,
    paddingBottom: 20,
  },
  liveChatContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
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
  profileSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 10,
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
    backgroundColor: 'rgba(255, 0, 0, 0.6)',
    borderColor: 'rgba(255, 0, 0, 0.8)',
  },
  processingButton: {
    backgroundColor: 'rgba(255, 165, 0, 0.6)',
    borderColor: 'rgba(255, 165, 0, 0.8)',
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
});

export default AIDetailVideoView;
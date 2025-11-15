import React, { useRef, useEffect } from 'react';
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
  Keyboard,
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
  const textInputRef = useRef<TextInput>(null);
  const bottomAreaTranslateY = React.useRef(new Animated.Value(0)).current;
  const inputAreaTranslateY = React.useRef(new Animated.Value(0)).current;
  const [isInfinityMode, setIsInfinityMode] = React.useState(false);
  const infinityModeIntervalRef = React.useRef<NodeJS.Timeout | null>(null);
  const [pendingTTSAudioUrl, setPendingTTSAudioUrl] = React.useState<string | null>(null);
  const pendingTTSAudioUrlRef = React.useRef<string | null>(null);
  const ttsStartedRef = React.useRef(false);
  const wsConnectedRef = React.useRef(false);
  const isManuallyOpeningKeyboardRef = React.useRef(false);
  const voiceApiStartTimeRef = React.useRef<number | null>(null);
  const streamStartTimeRef = React.useRef<number | null>(null);
  const totalStartTimeRef = React.useRef<number | null>(null);
  const sendAudioStartTimeRef = React.useRef<number | null>(null);
  const streamTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isProcessingMicrophoneRef = React.useRef(false);
  
  // pendingTTSAudioUrl state'i değiştiğinde ref'i güncelle
  React.useEffect(() => {
    pendingTTSAudioUrlRef.current = pendingTTSAudioUrl;
  }, [pendingTTSAudioUrl]);

  const handleKeyboardPress = () => {
    if (!isKeyboardVisible) {
      isManuallyOpeningKeyboardRef.current = true;
      setIsKeyboardVisible(true);
      // Kısa bir gecikme ile focus yap ki klavye açılsın
      setTimeout(() => {
        textInputRef.current?.focus();
        // Focus yapıldıktan sonra flag'i sıfırla
        setTimeout(() => {
          isManuallyOpeningKeyboardRef.current = false;
        }, 500);
      }, 150);
    } else {
      // Eğer zaten açıksa, focus yap
      textInputRef.current?.focus();
    }
  };

  // isKeyboardVisible true olduğunda TextInput'a focus yap
  useEffect(() => {
    if (isKeyboardVisible && textInputRef.current && !isManuallyOpeningKeyboardRef.current) {
      // requestAnimationFrame ile bir sonraki render cycle'da focus yap
      requestAnimationFrame(() => {
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 100);
      });
    }
  }, [isKeyboardVisible]);

  // Sonsuzluk modu - S2S sürekli kayıt
  useEffect(() => {
    let isMounted = true;
    
    if (isInfinityMode && !isRecording) {
      // Sonsuzluk modu aktifse, S2S sürekli kayıt başlat
      const startInfinityS2S = async () => {
        if (!isMounted) return;
        
        try {
          const voice = item.voice || 'alloy';
          
          if (!aiState.conversation.conversation_id) {
            console.error('🔄 [Infinity S2S] Conversation ID bulunamadı');
            return;
          }
          
          const success = await aiService.startContinuousRecording(
            aiState.conversation.conversation_id,
            voice,
            2000, // İlk chunk 2 saniye sonra gönder
            2000  // Sonraki chunk'lar her 2 saniyede bir (VAD backend'de)
          );
          
          if (success && isMounted) {
            setIsRecording(true);
            console.log('🔄 [Infinity S2S] Sürekli kayıt başlatıldı');
          }
        } catch (error) {
          console.error('🔄 [Infinity S2S] Kayıt başlatma hatası:', error);
        }
      };
      
      // Kısa bir gecikme ile başlat
      setTimeout(() => {
        startInfinityS2S();
      }, 500);
    } else if (!isInfinityMode && isRecording) {
      // Sonsuzluk modu kapatıldıysa, sürekli kayıt durdur
      aiService.stopContinuousRecording().then(() => {
        if (isMounted) {
          setIsRecording(false);
        }
      });
    }
    
    return () => {
      isMounted = false;
      if (!isInfinityMode) {
        aiService.stopContinuousRecording();
      }
    };
  }, [isInfinityMode]);

  // Klavye açılıp kapanma durumlarını dinle
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        setIsKeyboardVisible(true);
        const height = event.endCoordinates.height;
        // Input alanı yüksekliği yaklaşık 80px (padding + input + button)
        const inputAreaHeight = 80;
        const totalOffset = height + inputAreaHeight;
        
        // Butonları yukarı taşı
        Animated.timing(bottomAreaTranslateY, {
          toValue: -totalOffset,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          useNativeDriver: true,
        }).start();
        
        // Input alanını klavye yüksekliği kadar yukarı taşı
        Animated.timing(inputAreaTranslateY, {
          toValue: -height,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          useNativeDriver: true,
        }).start();
      }
    );
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      (event) => {
        // Eğer manuel olarak açılıyorsa, kapanma event'ini ignore et
        if (isManuallyOpeningKeyboardRef.current) {
          return;
        }
        
        // Klavye kapanınca input alanını gizle
        setIsKeyboardVisible(false);
        
        // Butonları eski pozisyonuna getir
        Animated.timing(bottomAreaTranslateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          useNativeDriver: true,
        }).start();
        
        // Input alanını eski pozisyonuna getir
        Animated.timing(inputAreaTranslateY, {
          toValue: 0,
          duration: Platform.OS === 'ios' ? event.duration || 250 : 250,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, [setIsKeyboardVisible, bottomAreaTranslateY, inputAreaTranslateY]);

  const handleMicrophonePress = async () => {
    // Sonsuzluk modu aktifse, normal mikrofon butonu çalışmasın
    if (isInfinityMode) {
      return;
    }
    
    // Çift basışı önle
    if (isProcessingMicrophoneRef.current) {
      return;
    }
    
    if (isRecording) {
      // Sürekli kayıt durdur
      isProcessingMicrophoneRef.current = true;
      try {
        await aiService.stopContinuousRecording();
        setIsRecording(false);
      } finally {
        isProcessingMicrophoneRef.current = false;
      }
    } else {
      // Sürekli kayıt başlat (S2S)
      isProcessingMicrophoneRef.current = true;
      try {
        await startContinuousRecording();
      } finally {
        isProcessingMicrophoneRef.current = false;
      }
    }
  };

  const startContinuousRecording = async () => {
    try {
      const voice = item.voice || 'alloy';
      
      // Sürekli kayıt başlat - WebSocket S2S ile
      if (!aiState.conversation.conversation_id) {
        Alert.alert('Hata', 'Conversation ID bulunamadı');
        return;
      }
      
      const success = await aiService.startContinuousRecording(
        aiState.conversation.conversation_id,
        voice,
        1000, // İlk chunk 1 saniye sonra gönder (hızlandırıldı)
        1000  // Sonraki chunk'lar her 1 saniyede bir (hızlandırıldı)
      );
      
      if (success) {
        setIsRecording(true);
        console.log('🔄 [S2S] Sürekli kayıt başlatıldı');
      } else {
        Alert.alert('Hata', 'Kayıt başlatılamadı');
      }
    } catch (error) {
      console.error('Kayıt başlatma hatası:', error);
      Alert.alert('Hata', 'Kayıt başlatılamadı');
    }
  };

  const stopRecording = async () => {
    const processingStartTime = Date.now();
    try {
      setIsRecording(false);
      setIsProcessing(true);

      const audioUri = await aiService.stopRecording();
      if (audioUri) {
        // Toplam süre başlangıcı
        totalStartTimeRef.current = Date.now();
        voiceApiStartTimeRef.current = Date.now();
        streamStartTimeRef.current = null;
        
        // Karaktere özel voice'u kullan
        const voice = item.voice || 'alloy';
        const response = await aiService.sendVoiceToAI(audioUri, voice);
        
        if (response.success && response.data) {
          if (response.data.audioUrl && aiState.conversation.conversation_id) {
            // sendAudio çağrıldığında timestamp al
            sendAudioStartTimeRef.current = Date.now();
            
            // Önceki timeout'u temizle
            if (streamTimeoutRef.current) {
              clearTimeout(streamTimeoutRef.current);
            }
            
            // Stream başlamazsa 5 saniye sonra toplam süreyi logla
            streamTimeoutRef.current = setTimeout(() => {
              if (!streamStartTimeRef.current && totalStartTimeRef.current) {
                const now = Date.now();
                const totalDuration = ((now - totalStartTimeRef.current) / 1000).toFixed(2);
                console.log(`⏱️ Toplam (timeout): ${totalDuration}s (stream başlamadı)`);
              }
            }, 5000);
            
            dispatch(sendAudio({
              conversation_id: aiState.conversation.conversation_id,
              audio: response.data.audioUrl,
            }) as any).then(() => {
              // sendAudio tamamlandığında, eğer stream başlamadıysa süreyi logla
              setTimeout(() => {
                if (!streamStartTimeRef.current && sendAudioStartTimeRef.current) {
                  const now = Date.now();
                  const sendAudioToNowDuration = ((now - sendAudioStartTimeRef.current) / 1000).toFixed(2);
                  console.log(`⏱️ sendAudio → Şimdi: ${sendAudioToNowDuration}s (stream bekleniyor)`);
                }
              }, 1000);
            });
            
            await aiService.stopAudio();
            if (response.data?.audioUrl) {
              setPendingTTSAudioUrl(response.data.audioUrl);
              ttsStartedRef.current = false;
              
              // TTS'i direkt başlat (stream beklemeden)
              try {
                ttsStartedRef.current = true;
                await aiService.playAudioFromUrl(response.data.audioUrl);
              } catch (error) {
                console.error('❌ TTS oynatma hatası:', error);
                ttsStartedRef.current = false;
              }
            }
          }
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
      const processingDuration = ((Date.now() - processingStartTime) / 1000).toFixed(2);
      console.log(`⏱️ Processing (sarı ikon) süresi: ${processingDuration}s`);
    }
  };

  const handleTextPress = async () => {
    // Sonsuzluk ikonu butonu - toggle yap
    setIsInfinityMode(prev => !prev);
  };

  const handleSendText = async () => {
    const textToSend = conversationText.trim();
    if (textToSend) {
      const processingStartTime = Date.now();
      setIsProcessing(true);
      try {
        // Toplam süre başlangıcı
        totalStartTimeRef.current = Date.now();
        voiceApiStartTimeRef.current = Date.now();
        streamStartTimeRef.current = null;
        
        // Önceki timeout'u temizle
        if (streamTimeoutRef.current) {
          clearTimeout(streamTimeoutRef.current);
        }
        
        const voice = item.voice || 'alloy';
        const response = await aiService.sendTextToAI(textToSend, voice);
        if (response.success && response.data) {
          setConversationText('');
          setIsKeyboardVisible(false);
          
          if (response.data?.audioUrl) {
            // Stream başlamazsa 5 saniye sonra toplam süreyi logla
            streamTimeoutRef.current = setTimeout(() => {
              if (!streamStartTimeRef.current && totalStartTimeRef.current) {
                const now = Date.now();
                const totalDuration = ((now - totalStartTimeRef.current) / 1000).toFixed(2);
                console.log(`⏱️ Toplam (timeout): ${totalDuration}s (stream başlamadı)`);
              }
            }, 5000);
            
            await aiService.stopAudio();
            setPendingTTSAudioUrl(response.data.audioUrl);
            ttsStartedRef.current = false;
            
            // TTS'i direkt başlat (stream beklemeden)
            try {
              ttsStartedRef.current = true;
              await aiService.playAudioFromUrl(response.data.audioUrl);
            } catch (error) {
              console.error('❌ TTS oynatma hatası:', error);
              ttsStartedRef.current = false;
            }
          }
        } else {
          Alert.alert('Hata', response.message || 'Metin işlenirken hata oluştu');
        }
      } catch (error) {
        console.error('Metin gönderme hatası:', error);
        Alert.alert('Hata', 'Metin gönderilemedi');
      } finally {
        setIsProcessing(false);
        const processingDuration = ((Date.now() - processingStartTime) / 1000).toFixed(2);
        console.log(`⏱️ Processing (sarı ikon) süresi: ${processingDuration}s`);
      }
    } else {
      setIsKeyboardVisible(true);
    }
  };

  // WebSocket URL kontrolü
  if (!webStreamUrl) {
    console.error('❌ WebSocket URL is missing!');
  } else {
    console.log('✅ WebSocket URL:', webStreamUrl);
  }

  // WebSocket URL'ini kullanarak HTML sayfası oluştur
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
          // Audio context kaldırıldı - stream'den ses gelmeyecek
          
          function connectWebSocket() {
            try {
              console.log('🔌 Connecting to WebSocket...');
              ws = new WebSocket(wsUrl);
              
              ws.binaryType = 'arraybuffer'; // Binary data için
              
              ws.onopen = function() {
                console.log('✅ WebSocket connected');
                streamStartTime = Date.now();
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
                // Audio chunk (PCM16) - Stream'den gelen ses chunk'larını takip et
                const sampleRate = view.getUint32(1, false);
                const channels = view.getUint8(5);
                const pcmData = buffer.slice(6);
                
                audioChunkCount++;
                totalAudioBytes += pcmData.byteLength;
                
                if (!firstAudioChunkTime) {
                  firstAudioChunkTime = Date.now();
                  firstAudioChunkReceived = true;
                  console.log('✅ First audio chunk received');
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
        onMessage={async (event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'ws_status') {
              if (data.status === 'connected') {
                wsConnectedRef.current = true;
              }
            } else if (data.type === 'first_audio_chunk') {
              // Stream başlangıç zamanını kaydet (TTS zaten başladı, sadece log için)
              if (!streamStartTimeRef.current) {
                streamStartTimeRef.current = Date.now();
                
                // Timeout'u temizle
                if (streamTimeoutRef.current) {
                  clearTimeout(streamTimeoutRef.current);
                  streamTimeoutRef.current = null;
                }
                
                // Süre hesaplamaları
                if (sendAudioStartTimeRef.current) {
                  const sendAudioToStreamDuration = ((streamStartTimeRef.current - sendAudioStartTimeRef.current) / 1000).toFixed(2);
                  console.log(`⏱️ sendAudio → Stream: ${sendAudioToStreamDuration}s`);
                }
                
                if (totalStartTimeRef.current) {
                  const totalDuration = ((streamStartTimeRef.current - totalStartTimeRef.current) / 1000).toFixed(2);
                  console.log(`⏱️ Toplam: ${totalDuration}s`);
                }
              }
            }
          } catch (e) {
            // Ignore parse errors
          }
        }}
        onConsoleMessage={(event: any) => {
          console.log('🌐 WebView Console:', event.nativeEvent.message);
        }}
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
        { 
          opacity: bottomAreaOpacity,
          transform: [{ translateY: bottomAreaTranslateY }],
        },
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
                isProcessing && styles.processingButton,
                isInfinityMode && styles.infinityModeMicrophone
              ]} 
              onPress={handleMicrophonePress}
              disabled={isProcessing || isInfinityMode}
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
            <TouchableOpacity 
              style={[
                styles.circleButton,
                isInfinityMode && styles.infinityModeActive
              ]} 
              onPress={handleTextPress}
            >
              <Ionicons 
                name={isInfinityMode ? "infinite" : "text-outline"} 
                size={28} 
                color={isInfinityMode ? Colors.primary : "white"} 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.circleButton, styles.redCircleButton]}
              onPress={() => {
                // Telefon kapatma butonu - tabs/tabs'a git
                router.push('/(tabs)/tabs');
              }}
            >
              <Ionicons name="call" size={28} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>

      {/* Keyboard Input */}
      <Animated.View 
        style={[
          styles.keyboardInputContainer,
          { 
            transform: [{ translateY: inputAreaTranslateY }],
            opacity: isKeyboardVisible ? 1 : 0,
          }
        ]}
        pointerEvents={isKeyboardVisible ? 'auto' : 'none'}
      >
        <View style={styles.keyboardInputWrapper}>
          <TextInput
            ref={textInputRef}
            style={styles.keyboardInput}
            placeholder="Mesajınızı yazın..."
            placeholderTextColor="rgba(11, 11, 11, 0.5)"
            multiline
            value={conversationText}
            onChangeText={setConversationText}
            onSubmitEditing={handleSendText}
            blurOnSubmit={false}
            onBlur={() => {
              // Klavye kapanınca input alanını gizle
              // Sadece kullanıcı manuel olarak blur yaptıysa (klavye kapanınca otomatik blur)
              // Keyboard event listener zaten handle edecek, burada sadece fallback
            }}
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
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.2)',
    zIndex: 10000,
  },
  keyboardInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  keyboardInput: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    paddingTop: 12,
    color: 'black',
    fontSize: 16,
    maxHeight: 100,
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
  infinityModeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: Colors.primary,
    borderWidth: 2,
  },
  infinityModeMicrophone: {
    opacity: 0.5,
  },
});

export default AIDetailVideoView;

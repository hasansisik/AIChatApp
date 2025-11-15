import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const API_BASE_URL = 'http://localhost:5001/v1/ai'; // Backend URL'inizi buraya yazın
const WS_BASE_URL = 'ws://localhost:5001'; // WebSocket base URL

export interface VoiceResponse {
  success: boolean;
  data?: {
    transcription: string;
    aiResponse: string;
    audioUrl: string;
  };
  message?: string;
}

export interface TextResponse {
  success: boolean;
  data?: {
    aiResponse: string;
    audioUrl?: string;
  };
  message?: string;
}

class AIService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private recordingStartTime: number = 0;
  private lastSoundTime: number = 0;
  private currentConversationId: string | null = null; // Mevcut conversation ID
  private autoStopTimeout: ReturnType<typeof setTimeout> | null = null;
  private onAutoStopCallback: (() => void) | null = null;
  private voiceActivityCheckInterval: ReturnType<typeof setInterval> | null = null;
  private minRecordingDuration: number = 1000; // Minimum 1 saniye kayıt
  private autoStopSilenceThreshold: number = 2000; // 2 saniye daha kayıt (toplam 3 saniye) - otomatik durdurma için
  private audioPlaybackStartTime: number = 0;
  private audioDuration: number = 0;
  private streamDuration: number = 0; // Stream'in tahmini süresi
  private streamDurationSet: boolean = false; // Stream süresi bir kez ayarlandı mı?
  private continuousRecordingInterval: ReturnType<typeof setInterval> | null = null;
  private firstChunkTimeout: ReturnType<typeof setTimeout> | null = null;
  private onChunkCallback: ((audioUri: string) => Promise<void>) | null = null;
  private chunkInterval: number = 2000; // Her 2 saniyede bir chunk gönder
  private ttsPlaybackQueue: string[] = []; // TTS yanıt kuyruğu
  private isPlayingQueue: boolean = false; // Kuyruk oynatılıyor mu?
  // VAD kontrolü backend'de yapılıyor - frontend sadece audio chunk gönderiyor
  private isFirstChunk: boolean = true; // İlk chunk kontrolü için flag
  private isStartingRecording: boolean = false; // Kayıt başlatma işlemi devam ediyor mu?
  private s2sWebSocket: WebSocket | null = null; // S2S WebSocket bağlantısı
  private sttChunks: string[] = []; // STT chunk'larını biriktir (konuşma bitince birleştir)
  private isRecordingSpeech: boolean = false; // Konuşma kaydediliyor mu?
  private silenceStartTime: number | null = null; // Sessizlik ne zaman başladı?
  private silenceThreshold: number = 2000; // 2 saniye sessizlik = konuşma bitti

  // Ses kaydını başlat
  async startRecording(): Promise<boolean> {
    // Eğer zaten kayıt başlatma işlemi devam ediyorsa, bekle
    if (this.isStartingRecording) {
      return false;
    }
    
    // TTS oynatılıyorsa kayıt başlatma
    if (this.sound || this.isPlayingQueue) {
      return false;
    }
    
    try {
      this.isStartingRecording = true;
      
      // Eğer zaten bir kayıt varsa, önce temizle
      if (this.recording) {
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (e) {
          // Kayıt zaten durmuş olabilir, hata yok say
        }
        this.recording = null;
        // Kısa bir gecikme ekle (önceki kayıt tamamen temizlensin)
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mikrofon izni iste (sadece ilk seferinde log)
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('❌ Frontend: Mikrofon izni reddedildi');
        throw new Error('Mikrofon izni gerekli!');
      }

      // Ses modunu ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Kayıt oluştur - daha hızlı için düşük kalite
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.recordingStartTime = Date.now();
      this.lastSoundTime = Date.now();
      
      this.isStartingRecording = false;
      return true;
    } catch (error) {
      console.error('❌ Frontend: Kayıt başlatılamadı:', error);
      // Hata durumunda kayıt referansını temizle
      this.recording = null;
      this.isStartingRecording = false;
      return false;
    }
  }

  // Otomatik durdurma için callback ayarla (sonsuzluk modu için - ses seviyesine göre)
  setAutoStopCallback(callback: (() => void) | null, delayMs: number = 3000) {
    // Önceki timeout'u temizle
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }
    
    // Önceki interval'i temizle
    if (this.voiceActivityCheckInterval) {
      clearInterval(this.voiceActivityCheckInterval);
      this.voiceActivityCheckInterval = null;
    }
    
    this.onAutoStopCallback = callback;
    
    // Eğer kayıt aktifse ve callback varsa, ses seviyesine göre otomatik durdurma ayarla
    if (this.recording && callback) {
      this.recordingStartTime = Date.now();
      this.lastSoundTime = Date.now();
      
      // Ses aktivitesini kontrol et (her 500ms'de bir)
      // Not: Expo AV'de gerçek ses seviyesi bilgisi yok, bu yüzden kayıt süresini kullanıyoruz
      // Kayıt başladıktan sonra belirli bir süre (örneğin 2-3 saniye) sonra otomatik durdur
      this.voiceActivityCheckInterval = setInterval(() => {
        if (!this.recording || !this.onAutoStopCallback) {
          if (this.voiceActivityCheckInterval) {
            clearInterval(this.voiceActivityCheckInterval);
            this.voiceActivityCheckInterval = null;
          }
          return;
        }
        
        const now = Date.now();
        const recordingDuration = now - this.recordingStartTime;
        
        // Minimum kayıt süresi geçtiyse otomatik durdur (gerçek zamanlı sohbet için)
        // Bu süre kullanıcının cümlesini bitirmesi için yeterli olmalı
        if (recordingDuration >= this.minRecordingDuration + this.autoStopSilenceThreshold) {
          console.log('🔄 [Voice Activity] Kayıt süresi doldu, otomatik durduruluyor');
          if (this.voiceActivityCheckInterval) {
            clearInterval(this.voiceActivityCheckInterval);
            this.voiceActivityCheckInterval = null;
          }
          if (this.onAutoStopCallback) {
            this.onAutoStopCallback();
            this.onAutoStopCallback = null;
          }
        }
      }, 500); // Her 500ms'de bir kontrol et
      
      console.log(`🔄 [Voice Activity] Ses seviyesi izleme başlatıldı (min: ${this.minRecordingDuration}ms, silence: ${this.autoStopSilenceThreshold}ms)`);
    }
  }

  // Otomatik durdurma timeout'unu iptal et
  clearAutoStop() {
    if (this.autoStopTimeout) {
      clearTimeout(this.autoStopTimeout);
      this.autoStopTimeout = null;
    }
    if (this.voiceActivityCheckInterval) {
      clearInterval(this.voiceActivityCheckInterval);
      this.voiceActivityCheckInterval = null;
    }
    this.onAutoStopCallback = null;
  }
  
  // Ses aktivitesi algılandı (kayıt sırasında çağrılmalı)
  updateVoiceActivity() {
    this.lastSoundTime = Date.now();
  }

  // VAD (Voice Activity Detection) - Konuşma aktivitesi kontrolü
  // Kayıt durdurulduktan sonra dosya boyutu ve kayıt süresine göre kontrol yapar
  async checkVoiceActivity(recordingDuration: number, fileSize: number): Promise<boolean> {
    try {
      // Minimum kayıt süresi kontrolü - daha uzun süre gerekli (gürültüyü filtrelemek için)
      if (recordingDuration < 1500) { // En az 1.5 saniye kayıt gerekli
        console.log(`🔇 VAD: Kayıt süresi çok kısa (${recordingDuration}ms < 1500ms), sessizlik/gürültü olabilir`);
        return false;
      }

      // Dosya boyutu kontrolü - kayıt süresine göre minimum dosya boyutu hesapla
      // Normal konuşma için: ~25KB/saniye (m4a formatı) - gürültüyü filtrelemek için daha yüksek eşik
      // Arka plan gürültüsü genellikle 10-15KB/saniye civarında, gerçek konuşma 25-50KB/saniye
      const minSizePerSecond = 25000; // bytes/second (daha yüksek eşik - gürültüyü filtrelemek için)
      const expectedMinSize = (recordingDuration / 1000) * minSizePerSecond;
      
      // Eğer dosya boyutu beklenen minimum boyuttan çok küçükse sessizlik/gürültü
      // %70 tolerans (daha sıkı kontrol - gürültüyü filtrelemek için)
      const minRequiredSize = expectedMinSize * 0.7;
      if (fileSize < minRequiredSize) {
        const actualRate = (fileSize / (recordingDuration / 1000)).toFixed(0);
        console.log(`🔇 VAD: Dosya boyutu düşük (${fileSize} bytes, ${actualRate} bytes/s < ${(minSizePerSecond * 0.7).toFixed(0)} bytes/s), sessizlik/gürültü`);
        return false; // Konuşma yok
      }

      // Dosya boyutu yeterliyse konuşma var
      const actualRate = (fileSize / (recordingDuration / 1000)).toFixed(0);
      console.log(`✅ VAD: Konuşma algılandı (${fileSize} bytes, ${actualRate} bytes/s)`);
      return true; // Konuşma var
    } catch (error) {
      console.error('❌ VAD kontrol hatası:', error);
      return false;
    }
  }

  // WebSocket S2S bağlantısı kur
  async connectS2SWebSocket(conversationId: string, voice: string = 'alloy'): Promise<boolean> {
    try {
      // Mevcut bağlantıyı kapat
      if (this.s2sWebSocket) {
        this.s2sWebSocket.close();
        this.s2sWebSocket = null;
      }

      // WebSocket URL'i oluştur
      const wsUrl = `${WS_BASE_URL}/ws/s2s?conversation_id=${conversationId}&voice=${voice}`;
      console.log('🔌 S2S WebSocket bağlantısı kuruluyor:', wsUrl);

      // WebSocket bağlantısı kur
      this.s2sWebSocket = new WebSocket(wsUrl);

      // Bağlantı açıldığında
      this.s2sWebSocket.onopen = () => {
        console.log('✅ S2S WebSocket bağlantısı kuruldu');
        // State'i resetle
        this.sttChunks = [];
        this.isRecordingSpeech = false;
        this.silenceStartTime = null;
      };

      // Mesaj geldiğinde
      this.s2sWebSocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleS2SMessage(message);
        } catch (error) {
          console.error('❌ S2S WebSocket mesaj parse hatası:', error);
        }
      };

      // Hata durumu
      this.s2sWebSocket.onerror = (error) => {
        console.error('❌ S2S WebSocket hatası:', error);
      };

      // Bağlantı kapandığında
      this.s2sWebSocket.onclose = () => {
        console.log('🔌 S2S WebSocket bağlantısı kapandı');
        this.s2sWebSocket = null;
      };

      return true;
    } catch (error) {
      console.error('❌ S2S WebSocket bağlantı hatası:', error);
      return false;
    }
  }

  // S2S WebSocket mesajlarını işle
  private handleS2SMessage(message: any) {
    switch (message.type) {
      case 'connected':
        console.log('✅ S2S WebSocket bağlantısı onaylandı');
        break;
      case 'speech_started':
        console.log('🎤 Konuşma başladı (backend)');
        this.isRecordingSpeech = true;
        this.silenceStartTime = null;
        break;
      case 'stt_chunk':
        // STT chunk'ı biriktir (frontend'de gösterim için)
        console.log(`📝 STT Chunk (${message.chunkIndex}): "${message.text}"`);
        break;
      case 'speech_complete':
        // Konuşma tamamlandı - STT chunk'ları birleştirildi
        console.log(`✅ Konuşma tamamlandı: "${message.fullText}"`);
        this.isRecordingSpeech = false;
        this.silenceStartTime = null;
        break;
      case 'llm_chunk':
        // LLM streaming yanıt
        console.log(`🤖 LLM Chunk (${message.chunkIndex}): "${message.text}"`);
        break;
      case 'tts_chunk':
        // TTS chunk'ı al ve oynat
        this.handleTTSCunk(message);
        break;
      case 'response_complete':
        console.log(`✅ Yanıt tamamlandı (${message.totalChunks} chunk)`);
        break;
      case 'error':
        console.error('❌ S2S WebSocket hatası:', message.message);
        break;
      default:
        console.log('⚠️ Bilinmeyen S2S mesaj tipi:', message.type);
    }
  }

  // TTS chunk'ı işle ve oynat
  private async handleTTSCunk(message: any) {
    try {
      // Base64'ten dosyaya kaydet
      const tempFilePath = `${FileSystem.cacheDirectory}tts_chunk_${message.chunkIndex}_${Date.now()}.mp3`;
      await FileSystem.writeAsStringAsync(tempFilePath, message.audioBuffer, {
        encoding: FileSystem.EncodingType.Base64
      });

      const audioUri = `file://${tempFilePath}`;

      // TTS kuyruğuna ekle (oynatma için)
      await this.addToPlaybackQueue(audioUri);

      // Stream'a gönder (sendAudio ile)
      if (this.currentConversationId) {
        this.sendTTSToStream(audioUri, this.currentConversationId).catch((error) => {
          console.error('❌ TTS stream gönderme hatası:', error);
        });
      }
    } catch (error) {
      console.error('❌ TTS chunk işleme hatası:', error);
    }
  }

  // TTS sesini stream'a gönder (sendAudio ile)
  private async sendTTSToStream(audioUri: string, conversationId: string) {
    try {
      // sendAudio action'ını dinamik olarak import et
      const { sendAudio } = await import('@/redux/actions/aiActions');
      const { store } = await import('@/redux/store');
      
      // sendAudio action'ını dispatch et
      store.dispatch(sendAudio({
        conversation_id: conversationId,
        audio: audioUri
      }));
      
      console.log(`📤 TTS chunk stream'a gönderildi (chunk: ${audioUri})`);
    } catch (error) {
      console.error('❌ TTS stream gönderme hatası:', error);
    }
  }

  // Audio chunk'ı WebSocket'e gönder
  private sendAudioChunkToWebSocket(audioBuffer: ArrayBuffer) {
    if (this.s2sWebSocket && this.s2sWebSocket.readyState === WebSocket.OPEN) {
      this.s2sWebSocket.send(audioBuffer);
    } else {
      console.error('❌ S2S WebSocket bağlantısı yok veya açık değil');
    }
  }

  // Sürekli kayıt başlat (S2S için - WebSocket ile)
  async startContinuousRecording(
    conversationId: string,
    voice: string = 'alloy',
    firstChunkDelay: number = 1000, // İlk chunk için gecikme (1 saniye - hızlandırıldı)
    intervalMs: number = 1000 // Sonraki chunk'lar için interval (1 saniye - hızlandırıldı)
  ): Promise<boolean> {
    try {
      // Conversation ID'yi sakla (TTS chunk'larını stream'a göndermek için)
      this.currentConversationId = conversationId;
      
      // WebSocket bağlantısı kur
      const wsConnected = await this.connectS2SWebSocket(conversationId, voice);
      if (!wsConnected) {
        console.error('❌ WebSocket bağlantısı kurulamadı');
        return false;
      }

      this.chunkInterval = intervalMs;
      this.isFirstChunk = true;
      
      // İlk kaydı başlat
      const success = await this.startRecording();
      if (!success) {
        return false;
      }
      
      // İlk chunk'ı gönder (gecikme ile)
      this.firstChunkTimeout = setTimeout(async () => {
        this.firstChunkTimeout = null;
        // TTS oynatılıyorsa kayıt yapma
        if (this.sound || this.isPlayingQueue) {
          console.log('🔇 TTS oynatılıyor, ilk chunk atlanıyor');
          return;
        }
        
        if (this.recording) {
          try {
            const audioUri = await this.stopRecording();
            if (audioUri) {
              // Audio dosyasını oku ve WebSocket'e gönder
              await this.sendAudioFileToWebSocket(audioUri);
            }
            
            // Yeni kayıt başlat
            if (!this.sound && !this.isPlayingQueue) {
              await this.startRecording();
            }
            
            // Sonraki chunk'lar için interval başlat
            this.continuousRecordingInterval = setInterval(async () => {
              // TTS oynatılıyorsa kayıt yapma (feedback loop'u önlemek için)
              if (this.sound || this.isPlayingQueue) {
                if (this.recording) {
                  try {
                    await this.stopRecording();
                  } catch (error) {
                    // Sessizce geç
                  }
                }
                // TTS bitene kadar bekle, kayıt başlatma
                return;
              }
              
              if (this.recording) {
                try {
                  const audioUri = await this.stopRecording();
                  if (audioUri) {
                    // VAD kontrolü backend'de yapılacak - direkt gönder
                    await this.sendAudioFileToWebSocket(audioUri);
                  }
                  
                  // Yeni kayıt başlat (TTS oynatılmıyorsa ve kayıt başlatma işlemi yoksa)
                  if (!this.sound && !this.isPlayingQueue && !this.isStartingRecording) {
                    // Kısa bir gecikme ekle (TTS feedback'ini önlemek için)
                    await new Promise(resolve => setTimeout(resolve, 300));
                    if (!this.sound && !this.isPlayingQueue && !this.isStartingRecording) {
                      await this.startRecording();
                    }
                  }
                } catch (error) {
                  // Sessizce geç
                }
              } else if (!this.recording && !this.sound && !this.isPlayingQueue && !this.isStartingRecording) {
                // Kısa bir gecikme ekle (TTS feedback'ini önlemek için)
                await new Promise(resolve => setTimeout(resolve, 300));
                if (!this.sound && !this.isPlayingQueue && !this.isStartingRecording) {
                  await this.startRecording();
                }
              }
            }, this.chunkInterval);
          } catch (error) {
            console.error('❌ İlk chunk gönderme hatası:', error);
          }
        }
      }, firstChunkDelay);
      
      console.log(`🔄 [S2S WebSocket] Sürekli kayıt başlatıldı (ilk chunk: ${firstChunkDelay}ms, sonraki: ${intervalMs}ms)`);
      return true;
    } catch (error) {
      console.error('❌ Sürekli kayıt başlatma hatası:', error);
      return false;
    }
  }

  // Audio dosyasını oku ve WebSocket'e gönder
  private async sendAudioFileToWebSocket(audioUri: string) {
    try {
      // Dosyayı base64 olarak oku
      const base64Data = await FileSystem.readAsStringAsync(audioUri, {
        encoding: FileSystem.EncodingType.Base64
      });
      
      // Base64'ten ArrayBuffer'a çevir
      const binaryString = atob(base64Data);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      
      // WebSocket'e gönder
      this.sendAudioChunkToWebSocket(bytes.buffer);
    } catch (error) {
      console.error('❌ Audio dosyası gönderme hatası:', error);
    }
  }

  // Sürekli kayıt durdur
  async stopContinuousRecording(): Promise<void> {
    // İlk chunk timeout'unu temizle
    if (this.firstChunkTimeout) {
      clearTimeout(this.firstChunkTimeout);
      this.firstChunkTimeout = null;
    }
    
    // Periyodik interval'i temizle
    if (this.continuousRecordingInterval) {
      clearInterval(this.continuousRecordingInterval);
      this.continuousRecordingInterval = null;
    }
    
    // Callback'i temizle
    this.onChunkCallback = null;
    
    // İlk chunk flag'ini resetle
    this.isFirstChunk = true;
    
    // Aktif kaydı da durdur
    if (this.recording) {
      try {
        await this.stopRecording();
      } catch (error) {
        console.error('❌ Kayıt durdurma hatası:', error);
      }
    }
    
    // WebSocket'i kapat
    if (this.s2sWebSocket) {
      this.s2sWebSocket.close();
      this.s2sWebSocket = null;
    }
    
    // Conversation ID'yi temizle
    this.currentConversationId = null;
    
    console.log('🛑 [S2S] Sürekli kayıt durduruldu');
  }

  // TTS yanıtını kuyruğa ekle ve oynat
  async addToPlaybackQueue(audioUrl: string): Promise<void> {
    this.ttsPlaybackQueue.push(audioUrl);
    if (!this.isPlayingQueue) {
      this.playNextInQueue();
    }
  }

  // Kuyruktaki bir sonraki sesi oynat
  private async playNextInQueue(): Promise<void> {
    if (this.ttsPlaybackQueue.length === 0) {
      this.isPlayingQueue = false;
      return;
    }
    
    this.isPlayingQueue = true;
    const audioUrl = this.ttsPlaybackQueue.shift();
    
    if (audioUrl) {
      try {
        // playAudioFromUrl async olarak başlat, callback'te playNextInQueue çağrılacak
        this.playAudioFromUrl(audioUrl).catch((error) => {
          console.error('❌ Kuyruk oynatma hatası:', error);
          // Hata olsa bile bir sonrakini dene
          setTimeout(() => {
            this.playNextInQueue();
          }, 100);
        });
      } catch (error) {
        console.error('❌ Kuyruk oynatma hatası:', error);
        // Hata olsa bile bir sonrakini dene
        setTimeout(() => {
          this.playNextInQueue();
        }, 100);
      }
    } else {
      this.isPlayingQueue = false;
    }
  }

  // Ses kaydını durdur
  async stopRecording(): Promise<string | null> {
    try {
      console.log('🛑 Frontend: Kayıt durduruluyor...');
      
      if (!this.recording) {
        console.log('❌ Frontend: Aktif kayıt bulunamadı');
        throw new Error('Aktif kayıt bulunamadı');
      }

      // Kayıt süresini kontrol et
      // VAD kontrolü backend'de yapılacak - frontend sadece audio chunk gönderiyor
      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      
      if (this.isFirstChunk) {
        this.isFirstChunk = false;
      }
      
      this.recording = null;
      this.recordingStartTime = 0;
      this.lastSoundTime = 0;
      this.clearAutoStop();
      
      return uri;
    } catch (error) {
      console.error('❌ Frontend: Kayıt durdurulamadı:', error);
      return null;
    }
  }

  // Ses dosyasını backend'e gönder ve AI yanıtı al
  async sendVoiceToAI(audioUri: string, voice: string = 'alloy'): Promise<VoiceResponse> {
    const startTime = Date.now();
    try {
      const formData = new FormData();
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      formData.append('voice', voice);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);
      
      const response = await fetch(`${API_BASE_URL}/voice`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      const data = await response.json();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`⏱️ Voice API: ${duration}s`);
      
      return data;
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`❌ Voice API hatası (${duration}s):`, error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: 'Ses gönderilirken hata oluştu'
      };
    }
  }

  // Metin gönder ve AI yanıtı al
  async sendTextToAI(text: string, voice: string = 'alloy'): Promise<TextResponse> {
    const startTime = Date.now();
    try {
      const response = await fetch(`${API_BASE_URL}/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text, voice: voice }),
      });

      const data = await response.json();
      
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`⏱️ Text API: ${duration}s`);
      
      return data;
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`❌ Text API hatası (${duration}s):`, error instanceof Error ? error.message : String(error));
      return {
        success: false,
        message: 'Metin gönderilirken hata oluştu'
      };
    }
  }

  // AI yanıtını sese çevir
  async textToSpeech(text: string, voice: string = 'alloy'): Promise<string | null> {
    try {
      console.log('🔊 Frontend: TTS isteği gönderiliyor:', text);
      console.log('🔊 Frontend: Voice seçildi:', voice);
      
      const response = await fetch(`${API_BASE_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, voice }),
      });

      console.log('🔊 Frontend: TTS yanıtı alındı, status:', response.status);
      const data = await response.json();
      console.log('🔊 Frontend: TTS response:', data);
      
      if (data.success && data.data?.audioUrl) {
        console.log('🔊 Frontend: Ses oynatılıyor...');
        // Ses dosyasını oynat
        await this.playAudioFromUrl(data.data.audioUrl);
        console.log('✅ Frontend: Ses oynatma tamamlandı');
        // AudioUrl'i döndür
        return data.data.audioUrl;
      }
      
      console.log('❌ Frontend: TTS başarısız');
      return null;
    } catch (error) {
      console.error('❌ Frontend: TTS hatası:', error instanceof Error ? error.message : String(error));
      return null;
    }
  }

  // Ses oynatmayı durdur
  async stopAudio(): Promise<void> {
    try {
      if (this.sound) {
        console.log('🛑 Frontend: Ses durduruluyor');
        await this.sound.stopAsync();
        await this.sound.unloadAsync();
        this.sound = null;
      }
    } catch (error) {
      console.error('❌ Frontend: Ses durdurma hatası:', error instanceof Error ? error.message : String(error));
    }
  }

  // Stream süresini ayarla (WebSocket'ten gelen audio chunk bilgilerinden)
  setStreamDuration(duration: number) {
    if (duration > this.streamDuration) {
      this.streamDuration = duration;
      this.streamDurationSet = true;
    }
  }

  // URL'den ses oynat - Stream ile eş zamanlı
  async playAudioFromUrl(audioUrl: string, rate: number = 1.0): Promise<void> {
    const startTime = Date.now();
    try {
      if (!audioUrl || audioUrl.trim().length === 0) {
        throw new Error('audioUrl boş olamaz');
      }
      
      // TTS oynatılırken kayıt yapmayı durdur
      this.isPlayingQueue = true;
      
      await this.stopAudio();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      // Ses dosyasını yükle (shouldPlay: false - manuel başlatacağız)
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: false, // Önce yükle, sonra oynat
          rate: rate,
          shouldCorrectPitch: true,
          isLooping: false,
          volume: 1.0,
        }
      );

      this.sound = sound;
      this.audioPlaybackStartTime = Date.now();
      this.streamDurationSet = false;
      
      // Ses dosyasının tam yüklendiğinden emin ol
      let status = await sound.getStatusAsync();
      let retryCount = 0;
      while (!status.isLoaded && retryCount < 10) {
        await new Promise(resolve => setTimeout(resolve, 100));
        status = await sound.getStatusAsync();
        retryCount++;
      }
      
      if (status.isLoaded) {
        if (status.durationMillis) {
          this.audioDuration = status.durationMillis / 1000;
          console.log(`📊 TTS süresi: ${this.audioDuration.toFixed(2)}s`);
        }
        
        // Ses tam yüklendikten sonra oynat
        await sound.playAsync();
        
        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        console.log(`⏱️ TTS başlatıldı: ${duration}s`);
      } else {
        throw new Error('Ses dosyası yüklenemedi');
      }

      // Playback status update - ses tamamlanana kadar takip et
      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded) {
          if (status.didJustFinish) {
            const elapsed = ((Date.now() - this.audioPlaybackStartTime) / 1000).toFixed(2);
            console.log(`⏱️ TTS tamamlandı: ${elapsed}s`);
            try {
              await sound.unloadAsync();
            } catch (e) {
              // Unload hatası önemli değil
            }
            this.sound = null;
            
            // Kuyruk varsa bir sonrakini oynat
            if (this.ttsPlaybackQueue.length > 0) {
              setTimeout(() => {
                this.playNextInQueue();
              }, 50); // Kısa bir gecikme ile seamless playback
            } else {
              this.isPlayingQueue = false;
              // TTS bitti, interval zaten kayıt başlatacak
              console.log('✅ TTS tamamlandı, kayıt devam edebilir');
            }
          }
        }
      });
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`❌ TTS hatası (${duration}s):`, error instanceof Error ? error.message : String(error));
      // Hata durumunda sound referansını temizle
      if (this.sound) {
        try {
          await this.sound.unloadAsync();
        } catch (e) {
          // Unload hatası önemli değil
        }
        this.sound = null;
      }
      // Hata durumunda kayıt tekrar başlayabilir
      this.isPlayingQueue = false;
    }
  }

  // Kaynakları temizle
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Frontend: Kaynaklar temizleniyor...');
      
      // Sürekli kayıt durdur
      await this.stopContinuousRecording();
      
      if (this.recording) {
        console.log('🧹 Frontend: Recording temizleniyor');
        await this.recording.stopAndUnloadAsync();
        this.recording = null;
      }
      if (this.sound) {
        console.log('🧹 Frontend: Sound temizleniyor');
        await this.sound.unloadAsync();
        this.sound = null;
      }
      
      // Kuyruğu temizle
      this.ttsPlaybackQueue = [];
      this.isPlayingQueue = false;
      
      console.log('✅ Frontend: Kaynaklar temizlendi');
    } catch (error) {
      console.error('❌ Frontend: Cleanup hatası:', error instanceof Error ? error.message : String(error));
    }
  }
}

export default new AIService();

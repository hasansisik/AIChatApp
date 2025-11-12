import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';

const API_BASE_URL = 'http://localhost:5001/v1/ai'; // Backend URL'inizi buraya yazın

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
  };
  message?: string;
}

class AIService {
  private recording: Audio.Recording | null = null;
  private sound: Audio.Sound | null = null;
  private recordingStartTime: number = 0;
  private lastSoundTime: number = 0;
  private autoStopTimeout: ReturnType<typeof setTimeout> | null = null;
  private onAutoStopCallback: (() => void) | null = null;
  private voiceActivityCheckInterval: ReturnType<typeof setInterval> | null = null;
  private minRecordingDuration: number = 1000; // Minimum 1 saniye kayıt
  private silenceThreshold: number = 2000; // 2 saniye daha kayıt (toplam 3 saniye)

  // Ses kaydını başlat
  async startRecording(): Promise<boolean> {
    try {
      console.log('🎤 Frontend: Kayıt başlatılıyor...');
      
      // Eğer zaten bir kayıt varsa, önce temizle
      if (this.recording) {
        console.log('⚠️ Frontend: Mevcut kayıt temizleniyor...');
        try {
          await this.recording.stopAndUnloadAsync();
        } catch (e) {
          // Kayıt zaten durmuş olabilir, hata yok say
          console.log('⚠️ Frontend: Kayıt zaten durmuş');
        }
        this.recording = null;
        // Kısa bir gecikme ekle (önceki kayıt tamamen temizlensin)
        await new Promise(resolve => setTimeout(resolve, 200));
      }
      
      // Mikrofon izni iste
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        console.log('❌ Frontend: Mikrofon izni reddedildi');
        throw new Error('Mikrofon izni gerekli!');
      }
      console.log('✅ Frontend: Mikrofon izni alındı');

      // Ses modunu ayarla
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      console.log('✅ Frontend: Ses modu ayarlandı');

      // Kayıt oluştur - daha hızlı için düşük kalite
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      this.recordingStartTime = Date.now();
      this.lastSoundTime = Date.now();
      console.log('✅ Frontend: Kayıt başlatıldı');
      return true;
    } catch (error) {
      console.error('❌ Frontend: Kayıt başlatılamadı:', error);
      // Hata durumunda kayıt referansını temizle
      this.recording = null;
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
        if (recordingDuration >= this.minRecordingDuration + this.silenceThreshold) {
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
      
      console.log(`🔄 [Voice Activity] Ses seviyesi izleme başlatıldı (min: ${this.minRecordingDuration}ms, silence: ${this.silenceThreshold}ms)`);
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

  // Ses kaydını durdur
  async stopRecording(): Promise<string | null> {
    try {
      console.log('🛑 Frontend: Kayıt durduruluyor...');
      
      if (!this.recording) {
        console.log('❌ Frontend: Aktif kayıt bulunamadı');
        throw new Error('Aktif kayıt bulunamadı');
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      this.recordingStartTime = 0;
      this.lastSoundTime = 0;
      
      // Otomatik durdurma timeout'unu temizle
      this.clearAutoStop();

      console.log('✅ Frontend: Kayıt durduruldu, URI:', uri);
      return uri;
    } catch (error) {
      console.error('❌ Frontend: Kayıt durdurulamadı:', error);
      return null;
    }
  }

  // Ses dosyasını backend'e gönder ve AI yanıtı al
  async sendVoiceToAI(audioUri: string, voice: string = 'alloy'): Promise<VoiceResponse> {
    try {
      console.log('📱 Frontend: Ses dosyası gönderiliyor:', audioUri);
      console.log('📱 Frontend: Voice seçildi:', voice);
      
      // FormData oluştur
      const formData = new FormData();
      
      // Ses dosyasını FormData'ya ekle
      formData.append('audio', {
        uri: audioUri,
        type: 'audio/m4a',
        name: 'audio.m4a',
      } as any);
      
      // Voice bilgisini ekle
      formData.append('voice', voice);

      console.log('📱 Frontend: FormData oluşturuldu, backend\'e gönderiliyor...');
      console.log('📱 Frontend: API URL:', `${API_BASE_URL}/voice`);

      // Backend'e gönder - Content-Type'ı manuel ayarlama, tarayıcı otomatik ayarlar
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000); // 90 saniye timeout (STT + AI + TTS için yeterli)
      
      const response = await fetch(`${API_BASE_URL}/voice`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        // Content-Type'ı kaldırdık - tarayıcı otomatik ayarlayacak
      });
      
      clearTimeout(timeoutId);

      console.log('📱 Frontend: Backend yanıtı alındı, status:', response.status);
      console.log('📱 Frontend: Response headers:', response.headers);

      const data = await response.json();
      console.log('📱 Frontend: Parsed response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Frontend: Ses gönderimi hatası:', error);
      console.error('❌ Frontend: Error details:', {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return {
        success: false,
        message: 'Ses gönderilirken hata oluştu'
      };
    }
  }

  // Metin gönder ve AI yanıtı al
  async sendTextToAI(text: string, voice: string = 'alloy'): Promise<TextResponse> {
    try {
      console.log('📝 Frontend: Metin gönderiliyor:', text);
      console.log('📝 Frontend: Voice seçildi:', voice);
      
      const response = await fetch(`${API_BASE_URL}/text`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: text, voice: voice }),
      });

      console.log('📝 Frontend: Backend yanıtı alındı, status:', response.status);
      const data = await response.json();
      console.log('📝 Frontend: Parsed response:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Frontend: Metin gönderimi hatası:', error instanceof Error ? error.message : String(error));
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

  // URL'den ses oynat
  async playAudioFromUrl(audioUrl: string): Promise<void> {
    try {
      console.log('🎵 Frontend: Ses oynatma başlatılıyor:', audioUrl.substring(0, 50) + '...');
      
      // Önceki sesi durdur
      if (this.sound) {
        console.log('🛑 Frontend: Önceki ses durduruluyor');
        await this.sound.unloadAsync();
      }

      // Yeni ses oluştur
      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { shouldPlay: true }
      );

      this.sound = sound;
      console.log('✅ Frontend: Ses oynatma başladı');

      // Ses bittiğinde temizle
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          console.log('🏁 Frontend: Ses oynatma tamamlandı');
          sound.unloadAsync();
          this.sound = null;
        }
      });
    } catch (error) {
      console.error('❌ Frontend: Ses oynatma hatası:', error instanceof Error ? error.message : String(error));
    }
  }

  // Kaynakları temizle
  async cleanup(): Promise<void> {
    try {
      console.log('🧹 Frontend: Kaynaklar temizleniyor...');
      
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
      
      console.log('✅ Frontend: Kaynaklar temizlendi');
    } catch (error) {
      console.error('❌ Frontend: Cleanup hatası:', error instanceof Error ? error.message : String(error));
    }
  }
}

export default new AIService();

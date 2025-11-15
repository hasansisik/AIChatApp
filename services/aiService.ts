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
    audioUrl?: string;
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
  private audioPlaybackStartTime: number = 0;
  private audioDuration: number = 0;
  private streamDuration: number = 0; // Stream'in tahmini süresi
  private streamDurationSet: boolean = false; // Stream süresi bir kez ayarlandı mı?

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
      
      await this.stopAudio();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUrl },
        { 
          shouldPlay: true,
          rate: rate,
          shouldCorrectPitch: true,
          isLooping: false,
          volume: 1.0,
        }
      );

      this.sound = sound;
      this.audioPlaybackStartTime = Date.now();
      this.streamDurationSet = false;
      
      const status = await sound.getStatusAsync();
      if (status.isLoaded) {
        if (status.durationMillis) {
          this.audioDuration = status.durationMillis / 1000;
        }
        if (!status.isPlaying) {
          await sound.playAsync();
        }
      }

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.log(`⏱️ TTS başlatıldı: ${duration}s`);

      sound.setOnPlaybackStatusUpdate(async (status) => {
        if (status.isLoaded && status.didJustFinish) {
          const elapsed = ((Date.now() - this.audioPlaybackStartTime) / 1000).toFixed(2);
          console.log(`⏱️ TTS tamamlandı: ${elapsed}s`);
          sound.unloadAsync();
          this.sound = null;
        }
      });
    } catch (error) {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      console.error(`❌ TTS hatası (${duration}s):`, error instanceof Error ? error.message : String(error));
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

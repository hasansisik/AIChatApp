import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import { server } from '@/config';

// server değişkeninden WebSocket URL'ini dinamik olarak türet
// server: "http://192.168.1.104:5001/v1" -> "ws://192.168.1.104:5001/ws/stt"
const getSTTWebSocketURL = (): string => {
  try {
    const serverUrl = new URL(server);
    const host = serverUrl.hostname;
    const port = serverUrl.port || '5001';
    console.log(`🔌 STT WebSocket URL: ws://${host}:${port}/ws/stt`);
    return `ws://${host}:${port}/ws/stt`;
  } catch (error) {
    console.warn('⚠️ Server URL parse edilemedi, fallback kullanılıyor:', error);
    return 'ws://localhost:5001/ws/stt';
  }
};

// Chunk interval'i artırarak FFmpeg yükünü azalt
// Daha uzun chunk'lar = daha az FFmpeg çağrısı = daha hızlı işleme
const CHUNK_INTERVAL_MS = 500; // 140ms -> 500ms (daha az chunk, daha hızlı)
const FIRST_CHUNK_DELAY_MS = 300; // 60ms -> 300ms (ilk chunk için daha uzun bekleme)

type TranscriptionHandler = (text: string) => void;
type StatusHandler = (status: string) => void;
type TTSAudioHandler = (audioUri: string) => void;
type RecordingForLipsyncHandler = (audioUri: string) => void;

class AIService {
  private recording: Audio.Recording | null = null;
  private sttSocket: WebSocket | null = null;
  private transcriptionHandlers = new Set<TranscriptionHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private ttsAudioHandlers = new Set<TTSAudioHandler>();
  private recordingForLipsyncHandlers = new Set<RecordingForLipsyncHandler>();
  private socketReady: Promise<void> | null = null;
  private chunkTimer: ReturnType<typeof setTimeout> | null = null;
  private isStreaming = false;
  private isStartingRecording = false;
  private currentVoice: string | null = null;
  private voiceConfigSent = false;

  onTranscription(handler: TranscriptionHandler) {
    this.transcriptionHandlers.add(handler);
  }

  offTranscription(handler: TranscriptionHandler) {
    this.transcriptionHandlers.delete(handler);
  }

  onSocketStatus(handler: StatusHandler) {
    this.statusHandlers.add(handler);
  }

  offSocketStatus(handler: StatusHandler) {
    this.statusHandlers.delete(handler);
  }

  onTTSAudio(handler: TTSAudioHandler) {
    this.ttsAudioHandlers.add(handler);
  }

  offTTSAudio(handler: TTSAudioHandler) {
    this.ttsAudioHandlers.delete(handler);
  }

  onRecordingForLipsync(handler: RecordingForLipsyncHandler) {
    this.recordingForLipsyncHandlers.add(handler);
  }

  offRecordingForLipsync(handler: RecordingForLipsyncHandler) {
    this.recordingForLipsyncHandlers.delete(handler);
  }

  private notifyStatus(status: string) {
    this.statusHandlers.forEach(cb => cb(status));
  }

  private notifyTranscription(text: string) {
    this.transcriptionHandlers.forEach(cb => cb(text));
  }

  setVoice(voice: string) {
    if (voice && voice.trim().length > 0) {
      const newVoice = voice.trim();
      // Eğer voice değiştiyse, config'i tekrar gönder
      if (this.currentVoice !== newVoice) {
        this.currentVoice = newVoice;
        this.voiceConfigSent = false; // Yeni voice için config'i tekrar gönder
        console.log(`🎙️ Voice set edildi: ${this.currentVoice}`);
        this.sendVoiceConfig();
      }
    } else {
      console.warn('⚠️ Voice bilgisi boş veya geçersiz');
    }
  }

  async prewarmConnection(voice: string) {
    if (!voice || !voice.trim()) {
      console.warn('⚠️ prewarmConnection: Voice bilgisi boş');
      return;
    }

    this.setVoice(voice);
    try {
      await this.ensureSocket();
    } catch (error) {
      console.warn('⚠️ prewarmConnection: Socket hazır değil:', error);
    }
  }

  private sendVoiceConfig() {
    if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN && this.currentVoice && !this.voiceConfigSent) {
      const configMessage = JSON.stringify({
        type: 'config',
        voice: this.currentVoice
      });
      this.sttSocket.send(configMessage);
      this.voiceConfigSent = true;
      console.log(`📤 Voice config mesajı gönderildi: ${this.currentVoice}`);
    } else {
      if (!this.sttSocket) {
        // Socket henüz oluşturulmamış, sessizce bekle
      } else if (this.sttSocket.readyState !== WebSocket.OPEN) {
        // Socket henüz açık değil, sessizce bekle
      } else if (!this.currentVoice) {
        console.log('⚠️ Voice henüz set edilmemiş, voice config gönderilemedi');
      } else if (this.voiceConfigSent) {
        // Config zaten gönderilmiş, tekrar gönderme
      }
    }
  }

  private connectSttSocket() {
    if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      return;
    }

    this.socketReady = new Promise((resolve, reject) => {
      try {
        // Voice bilgisini query parameter olarak ekle
        const voiceParam = this.currentVoice ? `?voice=${encodeURIComponent(this.currentVoice)}` : '';
        const sttBaseUrl = getSTTWebSocketURL();
        const wsUrl = `${sttBaseUrl}${voiceParam}`;
        console.log(`🔌 WebSocket bağlantısı kuruluyor: ${wsUrl}`);
        this.sttSocket = new WebSocket(wsUrl);
        this.sttSocket.binaryType = 'arraybuffer';

        this.sttSocket.onopen = () => {
          this.notifyStatus('WebSocket bağlandı');
          // Voice config'i hemen gönder (eğer voice set edilmişse)
          // Küçük bir delay ekleyerek mesajın gönderildiğinden emin ol
          setTimeout(() => {
            if (this.currentVoice) {
              this.voiceConfigSent = false; // Socket yeniden bağlandı, config'i tekrar gönder
              this.sendVoiceConfig();
            } else {
              console.warn('⚠️ WebSocket bağlandı ama voice henüz set edilmemiş');
            }
          }, 50); // 50ms delay ile mesajın gönderildiğinden emin ol
          resolve();
        };

        this.sttSocket.onmessage = (event: any) => {
          try {
            if (typeof event.data !== 'string') {
              return;
            }
            const message = JSON.parse(event.data);
            switch (message.type) {
              case 'stt_chunk':
              case 'transcription_complete':
                if (message.text) {
                  this.notifyTranscription(message.text);
                }
                break;
              case 'llm_response':
                if (message.text) {
                  this.notifyStatus(`AI: ${message.text}`);
                }
                break;
              case 'tts_audio':
                if (message.audio) {
                  this.enqueueTTSAudio(message.audio, message.mimeType);
                }
                break;
              case 'error':
                this.notifyStatus(message.message || 'STT hatası');
                break;
              default:
                break;
            }
          } catch (error) {
            console.error('WebSocket mesaj parse hatası:', error);
          }
        };

        this.sttSocket.onerror = () => {
          this.notifyStatus('WebSocket hatası');
          reject(new Error('WebSocket error'));
        };

        this.sttSocket.onclose = () => {
          this.notifyStatus('WebSocket kapandı');
          this.sttSocket = null;
          this.socketReady = null;
          this.voiceConfigSent = false; // Socket kapandı, config'i tekrar göndermek için flag'i sıfırla
        };
      } catch (error) {
        this.notifyStatus('WebSocket oluşturulamadı');
        this.socketReady = null;
        reject(error);
      }
    });
  }

  private disconnectSttSocket() {
    if (this.sttSocket) {
      this.sttSocket.close();
      this.sttSocket = null;
    }
    this.socketReady = null;
  }

  private async ensureSocket() {
    if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      // Socket zaten açıksa, voice config'i gönder (eğer voice set edilmişse ama henüz gönderilmemişse)
      if (this.currentVoice && !this.voiceConfigSent) {
        this.sendVoiceConfig();
      }
      return;
    }

    if (!this.socketReady) {
      this.connectSttSocket();
    }

    if (this.socketReady) {
      await this.socketReady;
      // Socket bağlandıktan sonra OPEN state'ine geçmesini bekle
      // WebSocket bağlantısı kurulduktan sonra OPEN state'ine geçmesi biraz zaman alabilir
      let retries = 0;
      const maxRetries = 10;
      while (retries < maxRetries && (!this.sttSocket || this.sttSocket.readyState !== WebSocket.OPEN)) {
        await new Promise(resolve => setTimeout(resolve, 50));
        retries++;
      }
      
      if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
        // Socket bağlandıktan sonra voice config'i gönder (eğer voice set edilmişse)
        if (this.currentVoice && !this.voiceConfigSent) {
          this.sendVoiceConfig();
        }
      } else {
        console.warn('⚠️ Socket bağlantısı OPEN state\'ine geçemedi');
      }
    }
  }

  private async startRecordingInstance(): Promise<boolean> {
    if (this.isStartingRecording) {
      return false;
    }

    try {
      this.isStartingRecording = true;

      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Mikrofon izni reddedildi');
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.MEDIUM_QUALITY
      );

      this.recording = recording;
      return true;
    } catch (error) {
      return false;
    } finally {
      this.isStartingRecording = false;
    }
  }

  private async stopRecordingInstance(): Promise<string | null> {
    try {
      if (!this.recording) {
        return null;
      }

      await this.recording.stopAndUnloadAsync();
      const uri = this.recording.getURI();
      this.recording = null;
      return uri;
    } catch (error) {
      return null;
    }
  }

  private decodeBase64(base64: string): string {
    if (typeof globalThis.atob === 'function') {
      return globalThis.atob(base64);
    }

    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
    let output = '';
    let buffer: number;
    let bc = 0;
    let bs = 0;
    let idx = 0;
    const sanitized = base64.replace(/=+$/, '');

    if (sanitized.length % 4 === 1) {
      throw new Error('Geçersiz base64 verisi');
    }

    while ((buffer = sanitized.charCodeAt(idx++))) {
      const charIndex = chars.indexOf(String.fromCharCode(buffer));
      if (charIndex === -1) {
        continue;
      }
      bs = bc % 4 ? bs * 64 + charIndex : charIndex;
      if (bc++ % 4) {
        output += String.fromCharCode(0xff & (bs >> ((-2 * bc) & 6)));
      }
    }

    return output;
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = this.decodeBase64(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private async sendBinaryAudio(audioUri: string) {
    await this.ensureSocket();
    if (!this.sttSocket || this.sttSocket.readyState !== WebSocket.OPEN) {
      throw new Error('WebSocket bağlı değil');
    }

    const base64Data = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    const audioBuffer = this.base64ToArrayBuffer(base64Data);
    this.sttSocket.send(audioBuffer);
  }

  private clearChunkTimer() {
    if (this.chunkTimer) {
      clearTimeout(this.chunkTimer);
      this.chunkTimer = null;
    }
  }

  private scheduleChunkDispatch(delay: number = CHUNK_INTERVAL_MS) {
    this.clearChunkTimer();
    this.chunkTimer = setTimeout(async () => {
      if (!this.isStreaming) {
        return;
      }
      try {
        await this.rotateRecording(false);
        // Streaming devam ediyorsa bir sonraki chunk'ı planla
        if (this.isStreaming) {
          this.scheduleChunkDispatch();
        }
      } catch (error) {
        console.warn('⚠️ Chunk gönderilirken hata:', error);
        // Hata olsa bile devam et, bir sonraki chunk'ta tekrar dene
        if (this.isStreaming) {
          this.scheduleChunkDispatch();
        }
      }
    }, delay);
  }

  private async rotateRecording(isFinal: boolean, shouldSendAudio: boolean = true) {
    const audioUri = await this.stopRecordingInstance();
    if (!audioUri) {
      return;
    }

    // Send to STT for transcription (only if shouldSendAudio is true)
    if (shouldSendAudio) {
      try {
        await this.sendBinaryAudio(audioUri);
      } catch (error) {
        console.warn('⚠️ Ses gönderilemedi (STT):', error);
        // Hata olsa bile devam et, dosyayı sil
      }
    }
    
    // If this is the final recording, notify lipsync handlers (only if shouldSendAudio is true)
    if (isFinal && shouldSendAudio) {
      // Copy the file before deleting (for lipsync)
      const lipsyncAudioUri = `${FileSystem.cacheDirectory}lipsync_${Date.now()}.m4a`;
      try {
        const base64Data = await FileSystem.readAsStringAsync(audioUri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        await FileSystem.writeAsStringAsync(lipsyncAudioUri, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });
        // Notify handlers about the recording for lipsync
        this.recordingForLipsyncHandlers.forEach(handler => handler(lipsyncAudioUri));
      } catch (error) {
        console.error('Lipsync audio kopyalanamadı:', error);
      }
      
      if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
        try {
          this.sttSocket.send(JSON.stringify({ type: 'speech_end' }));
        } catch (error) {
          console.warn('⚠️ speech_end mesajı gönderilemedi:', error);
        }
      }
    } else if (isFinal && !shouldSendAudio) {
      // Pause durumunda: Sadece kaydı durdur, gönderme, STT session'ını iptal et
      console.log('⏸️ Kayıt pause edildi, ses gönderilmiyor');
      if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
        try {
          // STT'ye pause sinyali gönder (STT timeout'unu önlemek için)
          this.sttSocket.send(JSON.stringify({ type: 'speech_pause' }));
        } catch (error) {
          console.warn('⚠️ speech_pause mesajı gönderilemedi:', error);
        }
      }
    }
    
    // Dosyayı sil
    try {
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
    } catch (error) {
      console.warn('⚠️ Dosya silinemedi:', error);
    }

    // Eğer final değilse ve streaming devam ediyorsa, yeni kayıt başlat
    if (!isFinal && this.isStreaming) {
      try {
        const restarted = await this.startRecordingInstance();
        if (!restarted) {
          console.warn('⚠️ Yeni kayıt başlatılamadı');
          // Hata olsa bile devam et, bir sonraki chunk'ta tekrar dene
        }
      } catch (error) {
        // Hata olsa bile devam et
      }
    }
  }

  async startLiveTranscription(voice: string): Promise<boolean> {
    if (this.isStreaming) {
      return false;
    }

    if (!voice || !voice.trim()) {
      console.error('❌ Voice bilgisi gerekli');
      return false;
    }

    // Voice'u set et
    this.currentVoice = voice.trim();
    console.log(`🎙️ Voice set edildi: ${this.currentVoice}`);
    
    // Eğer socket zaten açıksa ve voice değiştiyse, yeniden bağlan
    if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      // Voice değiştiyse socket'i kapat ve yeniden bağlan
      if (this.currentVoice) {
        console.log('🔄 Voice değişti, socket yeniden bağlanıyor...');
        this.disconnectSttSocket();
      }
    }
    
    // Socket'i bağla (voice query parameter olarak gönderilecek)
    try {
      await this.ensureSocket();
    } catch (error) {
      console.warn('⚠️ Socket bağlantısı sırasında hata:', error);
      // Hata olsa bile devam et, socket bağlantısı sonra kurulabilir
    }
    
    // Socket'in OPEN state'ine geçtiğinden emin ol
    // Eğer socket bağlı değilse, hata verme, sadece log'la
    if (!this.sttSocket || this.sttSocket.readyState !== WebSocket.OPEN) {
      console.warn('⚠️ Socket henüz bağlı değil, voice config gönderilemedi (kayıt başlatılıyor)');
      // Hata verme, kayıt başlatılmaya devam et
      // Socket bağlandığında config mesajı gönderilecek
    } else {
      // Socket bağlandıktan sonra ek olarak config mesajı da gönder (fallback)
      // Query parameter zaten gönderildi ama ek güvenlik için config mesajı da gönder
      if (!this.voiceConfigSent) {
        try {
          const configMessage = JSON.stringify({
            type: 'config',
            voice: this.currentVoice
          });
          this.sttSocket.send(configMessage);
          this.voiceConfigSent = true;
          console.log(`📤 Voice config mesajı gönderildi (fallback): ${this.currentVoice}`);
          
          // Config mesajının server'a ulaşması için kısa bir bekleme
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn('⚠️ Config mesajı gönderilemedi:', error);
          // Hata olsa bile devam et
        }
      }
    }

    const started = await this.startRecordingInstance();
    if (!started) {
      return false;
    }

    this.isStreaming = true;
    this.scheduleChunkDispatch(FIRST_CHUNK_DELAY_MS);
    return true;
  }

  async stopLiveTranscription(shouldSendAudio: boolean = true): Promise<void> {
    if (!this.isStreaming && !this.recording) {
      return;
    }

    this.isStreaming = false;
    this.clearChunkTimer();

    if (this.recording) {
      try {
        await this.rotateRecording(true, shouldSendAudio);
      } catch (error) {
        // Hata olsa bile kaydı durdur
        try {
          await this.stopRecordingInstance();
        } catch (e) {
          // Ignore
        }
      }
    } else if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      try {
        if (shouldSendAudio) {
          // Normal stop: speech_end gönder
          this.sttSocket.send(JSON.stringify({ type: 'speech_end' }));
        } else {
          // Pause: speech_pause gönder (STT timeout'unu önlemek için)
          this.sttSocket.send(JSON.stringify({ type: 'speech_pause' }));
        }
      } catch (error) {
        console.warn('⚠️ Socket mesajı gönderilemedi:', error);
      }
    }
  }

  async sendTextMessage(text: string): Promise<boolean> {
    if (!text || !text.trim()) {
      return false;
    }

    // Mevcut socket'i kullan, yeni bağlantı kurma
    if (!this.sttSocket || this.sttSocket.readyState !== WebSocket.OPEN) {
      // Socket yoksa veya açık değilse, bağlan
      await this.ensureSocket();
      
      if (!this.sttSocket || this.sttSocket.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ Socket bağlı değil, text mesajı gönderilemedi');
        return false;
      }
    }

    try {
      // Text mesajını server'a gönder (string olarak)
      const message = JSON.stringify({
        type: 'text_message',
        text: text.trim()
      });
      console.log(`📤 Text mesajı gönderiliyor (socket state: ${this.sttSocket.readyState}, ${message.length} bytes): ${text.trim().substring(0, 50)}...`);
      this.sttSocket.send(message);
      console.log(`✅ Text mesajı gönderildi: ${text.trim().substring(0, 50)}...`);
      return true;
    } catch (error) {
      console.error('❌ Text mesajı gönderilemedi:', error);
      return false;
    }
  }

  async cleanup(): Promise<void> {
    await this.stopLiveTranscription();
    this.disconnectSttSocket();
  }

  private async enqueueTTSAudio(base64Audio: string, mimeType: string = 'audio/mpeg') {
    try {
      const extension = mimeType.includes('wav') ? 'wav' : 'mp3';
      const fileUri = `${FileSystem.cacheDirectory}tts_${Date.now()}.${extension}`;
      await FileSystem.writeAsStringAsync(fileUri, base64Audio, {
        encoding: FileSystem.EncodingType.Base64
      });
      this.ttsAudioHandlers.forEach(handler => handler(fileUri));
      setTimeout(() => {
        FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
      }, 5000);
    } catch (error) {
      console.error('TTS dosyası oluşturulamadı:', error);
    }
  }

}

export default new AIService();
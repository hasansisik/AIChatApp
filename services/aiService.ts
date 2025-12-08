import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { server } from '@/config';

const getSTTWebSocketURL = (): string => {
  try {
    const serverUrl = new URL(server);
    const host = serverUrl.hostname;
    const protocol = serverUrl.protocol === 'https:' ? 'wss:' : 'ws:';
    const port = serverUrl.port || (protocol === 'wss:' ? '443' : '5001');
    const wsUrl = `${protocol}//${host}${port && port !== '443' && port !== '80' ? `:${port}` : ''}/ws/stt`;
    console.log(`🔌 STT WebSocket URL: ${wsUrl}`);
    return wsUrl;
  } catch (error) {
    console.warn('⚠️ Server URL parse edilemedi, fallback kullanılıyor:', error);
    return 'ws://localhost:5001/ws/stt';
  }
};

const CHUNK_INTERVAL_MS = 500;
const FIRST_CHUNK_DELAY_MS = 300;

type TranscriptionHandler = (text: string) => void;
type StatusHandler = (status: string) => void;
type TTSAudioHandler = (audioUri: string) => void;
type SocketConnectionHandler = (connected: boolean) => void;
type DemoTimerUpdateHandler = (minutesRemaining: number) => void;

class AIService {
  private recording: Audio.Recording | null = null;
  private sttSocket: WebSocket | null = null;
  private transcriptionHandlers = new Set<TranscriptionHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private ttsAudioHandlers = new Set<TTSAudioHandler>();
  private socketConnectionHandlers = new Set<SocketConnectionHandler>();
  private demoTimerUpdateHandlers = new Set<DemoTimerUpdateHandler>();
  private socketReady: Promise<void> | null = null;
  private chunkTimer: ReturnType<typeof setTimeout> | null = null;
  private isStreaming = false;
  private isStartingRecording = false;
  private currentVoice: string | null = null;
  private currentLanguage: 'tr' | 'en' = 'tr';
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

  onSocketConnection(handler: SocketConnectionHandler) {
    this.socketConnectionHandlers.add(handler);
  }

  offSocketConnection(handler: SocketConnectionHandler) {
    this.socketConnectionHandlers.delete(handler);
  }

  onDemoTimerUpdate(handler: DemoTimerUpdateHandler) {
    this.demoTimerUpdateHandlers.add(handler);
  }

  offDemoTimerUpdate(handler: DemoTimerUpdateHandler) {
    this.demoTimerUpdateHandlers.delete(handler);
  }

  private notifySocketConnection(connected: boolean) {
    this.socketConnectionHandlers.forEach(cb => cb(connected));
  }

  private notifyDemoTimerUpdate(minutesRemaining: number) {
    this.demoTimerUpdateHandlers.forEach(cb => cb(minutesRemaining));
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
      if (this.currentVoice !== newVoice) {
        this.currentVoice = newVoice;
        this.voiceConfigSent = false;
        console.log(`🎙️ Voice set edildi: ${this.currentVoice}`);
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

  private async connectSttSocket() {
    if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      return;
    }

    this.socketReady = new Promise(async (resolve, reject) => {
      try {
        let token = null;
        try {
          token = await AsyncStorage.getItem('accessToken');
        } catch (error) {
          console.warn('⚠️ Token alınamadı:', error);
        }

        const params = new URLSearchParams();
        if (this.currentVoice) {
          params.append('voice', this.currentVoice);
        }
        params.append('language', this.currentLanguage);
        if (token) {
          params.append('token', token);
        }
        const queryString = params.toString();
        const sttBaseUrl = getSTTWebSocketURL();
        const wsUrl = queryString ? `${sttBaseUrl}?${queryString}` : sttBaseUrl;
        console.log(`🔌 WebSocket bağlantısı kuruluyor: ${wsUrl.replace(/token=[^&]+/, 'token=***')}`);
        this.sttSocket = new WebSocket(wsUrl);
        this.sttSocket.binaryType = 'arraybuffer';

        this.sttSocket.onopen = () => {
          console.log(`✅ WebSocket bağlandı (voice: ${this.currentVoice})`);
          if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN && this.currentVoice) {
            try {
              this.sttSocket.send(JSON.stringify({
                type: 'voice_config',
                voice: this.currentVoice
              }));
              this.voiceConfigSent = true;
            } catch (error) {
              console.warn('⚠️ Voice config gönderilemedi:', error);
            }
          }
          this.notifySocketConnection(true);
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
              case 'demo_timer_update':
                if (message.minutesRemaining !== undefined) {
                  this.notifyDemoTimerUpdate(message.minutesRemaining);
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

        this.sttSocket.onerror = (error) => {
          console.error('❌ WebSocket hatası:', error);
          reject(new Error('WebSocket error'));
        };

        this.sttSocket.onclose = () => {
          console.log('🔌 WebSocket bağlantısı kapandı');
          this.notifySocketConnection(false);
          this.sttSocket = null;
          this.socketReady = null;
          this.voiceConfigSent = false;
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
      try {
        if (this.sttSocket.readyState === WebSocket.OPEN || this.sttSocket.readyState === WebSocket.CONNECTING) {
          this.sttSocket.close();
        } else {
          this.notifySocketConnection(false);
        }
        
        this.sttSocket.onopen = null;
        this.sttSocket.onmessage = null;
        this.sttSocket.onerror = null;
        this.sttSocket.onclose = null;
        
        this.sttSocket = null;
        console.log('✅ [Cleanup] WebSocket kapatıldı');
      } catch (error) {
        console.warn('⚠️ [Cleanup] WebSocket kapatılamadı:', error);
        this.sttSocket = null;
      }
    }
    this.socketReady = null;
    this.voiceConfigSent = false;
  }

  private async ensureSocket() {
    if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      return;
    }

    if (!this.socketReady) {
      await this.connectSttSocket();
    }

    if (this.socketReady) {
      await this.socketReady;
    }
  }

  private async startRecordingInstance(): Promise<boolean> {
    if (this.isStartingRecording) {
      return false;
    }

    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
      }
      this.recording = null;
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
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        });
      } catch (e) {
      }
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
        if (this.isStreaming) {
          this.scheduleChunkDispatch();
        }
      } catch (error) {
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

    if (shouldSendAudio) {
      try {
        await this.sendBinaryAudio(audioUri);
        if (isFinal) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      } catch (error) {
      }
    }
    
    if (isFinal && shouldSendAudio) {
      if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
        try {
          this.sttSocket.send(JSON.stringify({ type: 'speech_end' }));
        } catch (error) {
          console.warn('⚠️ speech_end mesajı gönderilemedi:', error);
        }
      }
    } else if (isFinal && !shouldSendAudio) {
      console.log('⏸️ Kayıt pause edildi, ses gönderilmiyor');
      if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
        try {
          this.sttSocket.send(JSON.stringify({ type: 'speech_pause' }));
        } catch (error) {
          console.warn('⚠️ speech_pause mesajı gönderilemedi:', error);
        }
      }
    }
    
    try {
      await FileSystem.deleteAsync(audioUri, { idempotent: true });
    } catch (error) {
      console.warn('⚠️ Dosya silinemedi:', error);
    }

    if (!isFinal && this.isStreaming) {
      await this.startRecordingInstance();
    }
  }

  async startLiveTranscription(voice: string, language: 'tr' | 'en' = 'tr'): Promise<boolean> {
    if (this.isStreaming) {
      return false;
    }
    
    if (!voice || !voice.trim()) {
      console.error('❌ Voice bilgisi gerekli');
      return false;
    }

    this.currentVoice = voice.trim();
    this.currentLanguage = language;
    console.log(`🎙️ Voice: ${this.currentVoice}, Language: ${this.currentLanguage}`);
    
    if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      this.sttSocket.close();
      this.sttSocket = null;
      this.socketReady = null;
    }
    
    await this.ensureSocket();

    const started = await this.startRecordingInstance();
    if (!started) {
      return false;
    }

    this.isStreaming = true;
    this.scheduleChunkDispatch(FIRST_CHUNK_DELAY_MS);
    console.log(`✅ Ses kaydı başlatıldı`);
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
          this.sttSocket.send(JSON.stringify({ type: 'speech_end' }));
        } else {
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

    if (!this.sttSocket || this.sttSocket.readyState !== WebSocket.OPEN) {
      await this.ensureSocket();
      
      if (!this.sttSocket || this.sttSocket.readyState !== WebSocket.OPEN) {
        console.warn('⚠️ Socket bağlı değil, text mesajı gönderilemedi');
        return false;
      }
    }

    try {
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
    this.isStreaming = false;
    this.clearChunkTimer();
    
    if (this.recording) {
      try {
        await this.recording.stopAndUnloadAsync();
      } catch (error) {
      }
      this.recording = null;
    }
    
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
        playsInSilentModeIOS: true,
      });
    } catch (error) {
    }
    
    this.disconnectSttSocket();
    
    this.transcriptionHandlers.clear();
    this.statusHandlers.clear();
    this.ttsAudioHandlers.clear();
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

const aiService = new AIService();
export default aiService;

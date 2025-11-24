import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const STT_WS_URL = 'ws://localhost:5001/ws/stt';
const CHUNK_INTERVAL_MS = 220;
const FIRST_CHUNK_DELAY_MS = 120;

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
        const wsUrl = `${STT_WS_URL}${voiceParam}`;
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
      // Socket bağlandıktan sonra voice config'i gönder (eğer voice set edilmişse)
      // onopen içinde zaten gönderiliyor, burada tekrar göndermeye gerek yok
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
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      this.recording = recording;
      return true;
    } catch (error) {
      console.error('Kayıt başlatma hatası:', error);
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
      console.error('Kayıt durdurma hatası:', error);
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
        this.scheduleChunkDispatch();
      } catch (error) {
        console.error('Chunk gönderilirken hata:', error);
        this.notifyStatus('Ses gönderilemedi');
        await this.stopLiveTranscription();
      }
    }, delay);
  }

  private async rotateRecording(isFinal: boolean) {
    const audioUri = await this.stopRecordingInstance();
    if (!audioUri) {
      return;
    }

    // Send to STT for transcription
    await this.sendBinaryAudio(audioUri);
    
    // If this is the final recording, notify lipsync handlers
    if (isFinal) {
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
        this.sttSocket.send(JSON.stringify({ type: 'speech_end' }));
      }
    }
    
    await FileSystem.deleteAsync(audioUri, { idempotent: true });

    if (!isFinal) {
      const restarted = await this.startRecordingInstance();
      if (!restarted) {
        throw new Error('Yeni kayıt başlatılamadı');
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
    await this.ensureSocket();
    
    // Socket bağlandıktan sonra ek olarak config mesajı da gönder (fallback)
    if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      // Config mesajını da gönder (query parameter yeterli olmayabilir)
      const configMessage = JSON.stringify({
        type: 'config',
        voice: this.currentVoice
      });
      this.sttSocket.send(configMessage);
      this.voiceConfigSent = true;
      console.log(`📤 Voice config mesajı gönderildi (fallback): ${this.currentVoice}`);
      
      // Config mesajının server'a ulaşması için kısa bir bekleme
      await new Promise(resolve => setTimeout(resolve, 100));
    } else {
      console.error('❌ Socket bağlı değil, voice config gönderilemedi');
      return false;
    }

    const started = await this.startRecordingInstance();
    if (!started) {
      return false;
    }

    this.isStreaming = true;
    this.scheduleChunkDispatch(FIRST_CHUNK_DELAY_MS);
    return true;
  }

  async stopLiveTranscription(): Promise<void> {
    if (!this.isStreaming && !this.recording) {
      return;
    }

    this.isStreaming = false;
    this.clearChunkTimer();

    if (this.recording) {
      await this.rotateRecording(true);
    } else if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      this.sttSocket.send(JSON.stringify({ type: 'speech_end' }));
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
      // Notify handlers about the TTS audio file (for sending to conversation)
      // Local playback disabled - audio will come from stream
      this.ttsAudioHandlers.forEach(handler => handler(fileUri));
      // Clean up file after a delay (handlers should have sent it by then)
      setTimeout(() => {
        FileSystem.deleteAsync(fileUri, { idempotent: true }).catch(() => {});
      }, 5000);
    } catch (error) {
      console.error('TTS dosyası oluşturulamadı:', error);
    }
  }

}

export default new AIService();

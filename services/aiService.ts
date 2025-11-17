import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system/legacy';

const STT_WS_URL = 'ws://localhost:5001/ws/stt';
const CHUNK_INTERVAL_MS = 350;
const FIRST_CHUNK_DELAY_MS = 200;

type TranscriptionHandler = (text: string) => void;
type StatusHandler = (status: string) => void;

class AIService {
  private recording: Audio.Recording | null = null;
  private sttSocket: WebSocket | null = null;
  private transcriptionHandlers = new Set<TranscriptionHandler>();
  private statusHandlers = new Set<StatusHandler>();
  private socketReady: Promise<void> | null = null;
  private chunkTimer: ReturnType<typeof setTimeout> | null = null;
  private isStreaming = false;
  private isStartingRecording = false;

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

  private notifyStatus(status: string) {
    this.statusHandlers.forEach(cb => cb(status));
  }

  private notifyTranscription(text: string) {
    this.transcriptionHandlers.forEach(cb => cb(text));
  }

  private connectSttSocket() {
    if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      return;
    }

    this.socketReady = new Promise((resolve, reject) => {
      try {
        this.sttSocket = new WebSocket(STT_WS_URL);
        this.sttSocket.binaryType = 'arraybuffer';

        this.sttSocket.onopen = () => {
          this.notifyStatus('WebSocket bağlandı');
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
      return;
    }

    if (!this.socketReady) {
      this.connectSttSocket();
    }

    if (this.socketReady) {
      await this.socketReady;
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

    await this.sendBinaryAudio(audioUri);
    await FileSystem.deleteAsync(audioUri, { idempotent: true });

    if (!isFinal) {
      const restarted = await this.startRecordingInstance();
      if (!restarted) {
        throw new Error('Yeni kayıt başlatılamadı');
      }
    } else if (this.sttSocket && this.sttSocket.readyState === WebSocket.OPEN) {
      this.sttSocket.send(JSON.stringify({ type: 'speech_end' }));
    }
  }

  async startLiveTranscription(): Promise<boolean> {
    if (this.isStreaming) {
      return false;
    }

    await this.ensureSocket();

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
}

export default new AIService();
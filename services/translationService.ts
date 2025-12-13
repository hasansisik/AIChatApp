/**
 * Translation Service
 * Backend üzerinden Google Translate API kullanarak metin çevirisi yapar
 */

import { server } from '@/config';

interface TranslationResponse {
  translatedText: string;
  detectedSourceLanguage?: string;
}

class TranslationService {
  /**
   * Metni belirtilen dile çevirir
   * @param text Çevrilecek metin
   * @param targetLang Hedef dil kodu (tr, en, vb.)
   * @param sourceLang Kaynak dil kodu (opsiyonel, otomatik algılanır)
   */
  async translateText(
    text: string,
    targetLang: string = 'tr',
    sourceLang?: string
  ): Promise<string> {
    if (!text || text.trim() === '') {
      return text;
    }

    try {
      // Backend üzerinden çeviri yap
      const url = `${server}/translate`;
      
      const body: any = {
        text: text,
        target: targetLang,
      };
      
      if (sourceLang) {
        body.source = sourceLang;
      }

      console.log('🌍 Çeviri isteği gönderiliyor:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error('❌ Çeviri API hatası:', response.status, response.statusText, errorData);
        return text; // Hata durumunda orijinal metni döndür
      }

      const data = await response.json();
      
      if (data.translatedText) {
        console.log('✅ Çeviri başarılı:', text.substring(0, 50), '→', data.translatedText.substring(0, 50));
        return data.translatedText;
      }

      return text;
    } catch (error) {
      console.error('❌ Çeviri hatası:', error);
      return text; // Hata durumunda orijinal metni döndür
    }
  }

  /**
   * İngilizce metni Türkçeye çevirir
   */
  async translateToTurkish(text: string): Promise<string> {
    return this.translateText(text, 'tr', 'en');
  }

  /**
   * Türkçe metni İngilizceye çevirir
   */
  async translateToEnglish(text: string): Promise<string> {
    return this.translateText(text, 'en', 'tr');
  }
}

const translationService = new TranslationService();
export default translationService;


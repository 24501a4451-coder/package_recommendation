/**
 * FOODPACK-AI: Voice & Conversation Provider Abstractions
 * 
 * Supports open-weight and real AI providers:
 * - STT: Browser Web Speech API, Whisper API / Faster-Whisper, and Gemini Audio
 * - TTS: Browser Web Speech Synthesis, Piper / Kokoro TTS, and Gemini TTS
 * - Conversation: Gemini 3.8 Flash / Qwen-family / Open-Weight LLMs
 */

import { GoogleGenAI } from '@google/genai';

// -------------------------------------------------------------
// Types
// -------------------------------------------------------------

export interface STTResult {
  text: string;
  languageDetected?: string;
  confidence?: number;
  provider: string;
}

export interface TTSResult {
  audioBase64?: string;
  audioMimeType?: string;
  clientFallbackText?: string;
  provider: string;
}

export interface STTProvider {
  readonly name: string;
  transcribe(audioBuffer: Buffer, mimeType: string, languageHint?: string): Promise<STTResult>;
}

export interface TTSProvider {
  readonly name: string;
  synthesize(text: string, language?: string): Promise<TTSResult>;
}

// -------------------------------------------------------------
// 1. STT Providers
// -------------------------------------------------------------

/**
 * Gemini Audio STT Provider
 * Uses Gemini's native multimodal audio perception for speech-to-text.
 */
export class GeminiAudioSTTProvider implements STTProvider {
  public readonly name = 'Gemini-3.8-Flash-Audio (Multilingual)';
  private ai: GoogleGenAI | null = null;

  constructor() {
    if (process.env.GEMINI_API_KEY) {
      try {
        this.ai = new GoogleGenAI({
          apiKey: process.env.GEMINI_API_KEY,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
      } catch (err) {
        this.ai = null;
      }
    }
  }

  public async transcribe(audioBuffer: Buffer, mimeType: string, languageHint?: string): Promise<STTResult> {
    if (!this.ai || !process.env.GEMINI_API_KEY) {
      throw new Error('Gemini API key is not configured for Audio STT.');
    }

    const base64Data = audioBuffer.toString('base64');
    const prompt = `Transcribe the speech in this audio exactly as spoken.
Language hint: ${languageHint || 'Detect automatically (English, Hindi, Telugu, Tamil, etc.)'}.
Return ONLY the transcribed text. Do not add commentary or quotes.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || 'audio/webm',
              data: base64Data
            }
          },
          { text: prompt }
        ]
      }
    });

    const text = response.text?.trim() || '';
    return {
      text,
      languageDetected: languageHint,
      provider: this.name
    };
  }
}

/**
 * Whisper / Faster-Whisper Compatible Provider
 * Connects to open Whisper or faster-whisper server if WHISPER_ENDPOINT is configured.
 */
export class WhisperSTTProvider implements STTProvider {
  public readonly name = 'Whisper (OpenAI/Faster-Whisper Open Architecture)';
  private endpoint: string;

  constructor() {
    this.endpoint = process.env.WHISPER_ENDPOINT || '';
  }

  public async transcribe(audioBuffer: Buffer, mimeType: string, languageHint?: string): Promise<STTResult> {
    if (!this.endpoint) {
      throw new Error('WHISPER_ENDPOINT not configured.');
    }

    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: mimeType });
    formData.append('file', blob, 'audio.webm');
    formData.append('model', 'whisper-large-v3');
    if (languageHint) {
      formData.append('language', languageHint);
    }

    const res = await fetch(this.endpoint, {
      method: 'POST',
      headers: process.env.WHISPER_API_KEY ? { 'Authorization': `Bearer ${process.env.WHISPER_API_KEY}` } : {},
      body: formData
    });

    if (!res.ok) {
      throw new Error(`Whisper server responded with HTTP ${res.status}`);
    }

    const data = await res.json();
    return {
      text: data.text || '',
      languageDetected: data.language || languageHint,
      provider: this.name
    };
  }
}

// -------------------------------------------------------------
// 2. TTS Providers
// -------------------------------------------------------------

/**
 * Web Speech & Piper/Kokoro Compatible TTS Provider
 * Generates speech or instructs client Web Speech Synthesis with locale tagging.
 */
export class PiperKokoroTTSProvider implements TTSProvider {
  public readonly name = 'Kokoro / Piper Open TTS Adapter';
  private endpoint: string;

  constructor() {
    this.endpoint = process.env.TTS_ENDPOINT || '';
  }

  public async synthesize(text: string, language: string = 'en'): Promise<TTSResult> {
    if (this.endpoint) {
      try {
        const res = await fetch(this.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, language, voice: 'af_heart' })
        });
        if (res.ok) {
          const arrayBuf = await res.arrayBuffer();
          const base64 = Buffer.from(arrayBuf).toString('base64');
          return {
            audioBase64: base64,
            audioMimeType: 'audio/wav',
            provider: this.name
          };
        }
      } catch (e) {
        console.warn('External TTS endpoint failed, using client speech fallback:', e);
      }
    }

    // High quality client-side fallback via standard Web Speech Synthesis API
    return {
      clientFallbackText: text,
      provider: 'Browser Web Speech Synthesis (Zero-Latency Local TTS)'
    };
  }
}

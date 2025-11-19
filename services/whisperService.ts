/**
 * Whisper Service (Premium Feature)
 *
 * This service provides integration with OpenAI's Whisper API for premium voice transcription.
 *
 * Benefits over Web Speech API:
 * - Works in ALL browsers (server-side processing)
 * - Better accuracy (especially with accents, technical terms)
 * - Multi-language support (90+ languages)
 * - More reliable in noisy environments
 *
 * Implementation Notes:
 * 1. User records audio in browser using MediaRecorder API
 * 2. Audio blob is sent to backend API endpoint
 * 3. Backend forwards to OpenAI Whisper API
 * 4. Transcription is returned to frontend
 *
 * Cost: ~$0.006 per minute of audio (as of 2024)
 *
 * Usage:
 * ```typescript
 * import { transcribeAudio } from './services/whisperService';
 *
 * const audioBlob = await recordAudio(); // Your recording logic
 * const transcript = await transcribeAudio(audioBlob);
 * ```
 */

export interface WhisperTranscriptionOptions {
  language?: string; // e.g., 'en', 'es', 'fr', 'de'
  temperature?: number; // 0-1, higher = more creative/random
  prompt?: string; // Optional context to improve accuracy
}

export interface WhisperTranscriptionResult {
  text: string;
  language?: string;
  duration?: number;
}

/**
 * Transcribe audio using Whisper API (server-side endpoint)
 *
 * @param audioBlob - Audio file (supports mp3, mp4, mpeg, mpga, m4a, wav, webm)
 * @param options - Transcription options
 * @returns Transcription result
 */
export async function transcribeAudio(
  audioBlob: Blob,
  options: WhisperTranscriptionOptions = {}
): Promise<WhisperTranscriptionResult> {
  // Create form data
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.webm');

  if (options.language) {
    formData.append('language', options.language);
  }
  if (options.temperature !== undefined) {
    formData.append('temperature', options.temperature.toString());
  }
  if (options.prompt) {
    formData.append('prompt', options.prompt);
  }

  try {
    const response = await fetch('/api/voice/transcribe', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Transcription failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('[WhisperService] Transcription error:', error);
    throw error;
  }
}

/**
 * Record audio from user's microphone
 * Returns a promise that resolves with audio blob when recording stops
 */
export async function recordAudio(): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        stream.getTracks().forEach((track) => track.stop()); // Stop mic access
        resolve(audioBlob);
      };

      mediaRecorder.onerror = (error) => {
        reject(error);
      };

      mediaRecorder.start();

      // Store recorder reference so it can be stopped externally
      (window as any).__activeRecorder = mediaRecorder;
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Stop active recording
 */
export function stopRecording(): void {
  const recorder = (window as any).__activeRecorder;
  if (recorder && recorder.state === 'recording') {
    recorder.stop();
  }
}

// ============================================================================
// BACKEND ENDPOINT IMPLEMENTATION (For reference)
// ============================================================================

/**
 * Backend API endpoint: /api/voice/transcribe
 *
 * This is what your backend developer will implement:
 *
 * ```typescript
 * import OpenAI from 'openai';
 * import formidable from 'formidable';
 *
 * export default async function handler(req: VercelRequest, res: VercelResponse) {
 *   if (req.method !== 'POST') {
 *     return res.status(405).json({ error: 'Method not allowed' });
 *   }
 *
 *   // Parse multipart form data
 *   const form = formidable({ multiples: false });
 *   const [fields, files] = await form.parse(req);
 *
 *   const audioFile = files.audio[0];
 *
 *   // Initialize OpenAI client
 *   const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
 *
 *   // Transcribe with Whisper
 *   const transcription = await openai.audio.transcriptions.create({
 *     file: fs.createReadStream(audioFile.filepath),
 *     model: 'whisper-1',
 *     language: fields.language?.[0],
 *     temperature: fields.temperature ? parseFloat(fields.temperature[0]) : 0,
 *     prompt: fields.prompt?.[0],
 *   });
 *
 *   // Clean up temp file
 *   fs.unlinkSync(audioFile.filepath);
 *
 *   return res.status(200).json({
 *     text: transcription.text,
 *     language: transcription.language,
 *   });
 * }
 * ```
 *
 * Required packages:
 * - npm install openai formidable
 *
 * Environment variables:
 * - OPENAI_API_KEY: Your OpenAI API key
 */

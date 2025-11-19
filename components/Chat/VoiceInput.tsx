import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader } from 'lucide-react';
import { cn } from '../../lib/utils';
import { analytics } from '../../lib/analytics';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onError?: (error: string) => void;
  className?: string;
  autoSend?: boolean; // If true, sends immediately on recognition complete
}

/**
 * VoiceInput Component
 * Uses Web Speech API for browser-based speech recognition
 *
 * Browser Support:
 * - Chrome/Edge: Full support
 * - Safari: Supported on iOS 14.5+
 * - Firefox: Not supported (returns error)
 *
 * Premium Feature: Whisper API Integration
 * For production deployments, this component can be upgraded to use OpenAI's Whisper API:
 * - Better accuracy
 * - Multi-language support (90+ languages)
 * - Works in all browsers (sends audio to server for processing)
 * - See /services/whisperService.ts for implementation details
 */
export const VoiceInput: React.FC<VoiceInputProps> = ({
  onTranscript,
  onError,
  className,
  autoSend = false,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    // Check if Web Speech API is supported
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      console.warn('[VoiceInput] Web Speech API not supported in this browser');
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = true; // Keep listening until manually stopped
    recognition.interimResults = true; // Show interim results as user speaks
    recognition.lang = 'en-US'; // TODO: Make this configurable per tenant

    recognition.onstart = () => {
      console.log('[VoiceInput] Started listening');
      setIsListening(true);
      setIsProcessing(false);
      analytics.trackEvent('voice_input_start', {});
    };

    recognition.onresult = (event: any) => {
      let interim = '';
      let final = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          final += transcript + ' ';
        } else {
          interim += transcript;
        }
      }

      // Update interim transcript for real-time display
      setInterimTranscript(interim);

      // When final result is available, pass it to parent
      if (final) {
        const cleanedTranscript = final.trim();
        console.log('[VoiceInput] Final transcript:', cleanedTranscript);
        onTranscript(cleanedTranscript);
        setInterimTranscript('');

        // Track successful recognition
        analytics.trackEvent('voice_input_success', {
          transcriptLength: cleanedTranscript.length,
          wordCount: cleanedTranscript.split(' ').length,
        });

        // If autoSend is enabled, stop listening after receiving final result
        if (autoSend) {
          recognition.stop();
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[VoiceInput] Error:', event.error);
      setIsListening(false);
      setIsProcessing(false);

      let errorMessage = 'Voice recognition error';

      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please enable in browser settings.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Voice recognition error: ${event.error}`;
      }

      if (onError) {
        onError(errorMessage);
      }

      // Track error for analytics
      analytics.trackEvent('voice_input_error', {
        errorType: event.error,
        errorMessage,
      });
    };

    recognition.onend = () => {
      console.log('[VoiceInput] Stopped listening');
      setIsListening(false);
      setIsProcessing(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript, onError, autoSend]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('[VoiceInput] Failed to start:', error);
        if (onError) {
          onError('Failed to start voice input. Please try again.');
        }
      }
    }
  };

  if (!isSupported) {
    return (
      <button
        disabled
        className={cn(
          'p-2 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed',
          className
        )}
        title="Voice input not supported in this browser. Try Chrome or Edge."
      >
        <MicOff className="w-5 h-5" />
      </button>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleListening}
        className={cn(
          'p-2 rounded-lg transition-all relative',
          isListening
            ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
            : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300',
          isProcessing && 'opacity-50 cursor-not-allowed',
          className
        )}
        disabled={isProcessing}
        title={isListening ? 'Stop recording' : 'Start voice input'}
      >
        {isProcessing ? (
          <Loader className="w-5 h-5 animate-spin" />
        ) : isListening ? (
          <Mic className="w-5 h-5" />
        ) : (
          <Mic className="w-5 h-5" />
        )}

        {/* Recording indicator */}
        {isListening && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-slate-900 animate-ping" />
        )}
      </button>

      {/* Interim transcript display (optional - can be shown in a tooltip or modal) */}
      {interimTranscript && (
        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 px-3 py-2 bg-slate-900 dark:bg-slate-800 text-white text-sm rounded-lg whitespace-nowrap shadow-lg">
          {interimTranscript}
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900 dark:border-t-slate-800" />
        </div>
      )}
    </div>
  );
};

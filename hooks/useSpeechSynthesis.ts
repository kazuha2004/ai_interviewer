'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechSynthesisOptions {
  rate?: number; // 0.1 to 10
  pitch?: number; // 0 to 2
  volume?: number; // 0 to 1
  lang?: string;
  voiceIndex?: number;
}

interface SpeechSynthesisResult {
  isSpeaking: boolean;
  isSupported: boolean;
  isPaused: boolean;
  speak: (text: string, options?: Partial<UseSpeechSynthesisOptions>) => void;
  pause: () => void;
  resume: () => void;
  cancel: () => void;
  setRate: (rate: number) => void;
  setPitch: (pitch: number) => void;
  setVolume: (volume: number) => void;
  error: string | null;
}

export function useSpeechSynthesis(
  options: UseSpeechSynthesisOptions = {}
): SpeechSynthesisResult {
  const {
    rate = 1,
    pitch = 1,
    volume = 1,
    lang = 'en-US',
    voiceIndex = 0,
  } = options;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const synthesisRef = useRef<any>(null);
  const optionsRef = useRef({
    rate: Math.max(0.1, Math.min(10, rate)),
    pitch: Math.max(0, Math.min(2, pitch)),
    volume: Math.max(0, Math.min(1, volume)),
    lang,
    voiceIndex,
  });

  useEffect(() => {
    // Check browser support
    if (typeof window !== 'undefined') {
      const SpeechSynthesisUtterance = window.SpeechSynthesisUtterance;

      if (SpeechSynthesisUtterance && window.speechSynthesis) {
        setIsSupported(true);
      } else {
        setIsSupported(false);
      }
    }
  }, []);

  const speak = useCallback(
    (text: string, customOptions?: Partial<UseSpeechSynthesisOptions>) => {
      if (!isSupported || !text) return;

      // Cancel any ongoing speech
      window.speechSynthesis.cancel();

      const finalOptions = {
        ...optionsRef.current,
        ...customOptions,
      };

      // Update ref for future use
      optionsRef.current = finalOptions;

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = finalOptions.rate;
      utterance.pitch = finalOptions.pitch;
      utterance.volume = finalOptions.volume;
      utterance.lang = finalOptions.lang;

      // Get available voices
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        utterance.voice = voices[finalOptions.voiceIndex % voices.length];
      }

      // Handle events
      utterance.onstart = () => {
        setIsSpeaking(true);
        setIsPaused(false);
        setError(null);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsPaused(false);
      };

      utterance.onerror = (event) => {
        const errorMessage = getErrorMessage(event.error);
        setError(errorMessage);
        setIsSpeaking(false);
        setIsPaused(false);
        console.error('Speech synthesis error:', event.error);
      };

      utterance.onpause = () => {
        setIsPaused(true);
      };

      utterance.onresume = () => {
        setIsPaused(false);
      };

      synthesisRef.current = utterance;
      setError(null);

      try {
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        setError('Failed to speak');
        console.error('Error speaking:', err);
      }
    },
    [isSupported]
  );

  const pause = useCallback(() => {
    if (isSupported && isSpeaking && !isPaused) {
      window.speechSynthesis.pause();
    }
  }, [isSupported, isSpeaking, isPaused]);

  const resume = useCallback(() => {
    if (isSupported && isPaused) {
      window.speechSynthesis.resume();
    }
  }, [isSupported, isPaused]);

  const cancel = useCallback(() => {
    if (isSupported) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setIsPaused(false);
    }
  }, [isSupported]);

  const setRate = useCallback((newRate: number) => {
    const clamped = Math.max(0.1, Math.min(10, newRate));
    optionsRef.current.rate = clamped;
    if (synthesisRef.current) {
      synthesisRef.current.rate = clamped;
    }
  }, []);

  const setPitch = useCallback((newPitch: number) => {
    const clamped = Math.max(0, Math.min(2, newPitch));
    optionsRef.current.pitch = clamped;
    if (synthesisRef.current) {
      synthesisRef.current.pitch = clamped;
    }
  }, []);

  const setVolume = useCallback((newVolume: number) => {
    const clamped = Math.max(0, Math.min(1, newVolume));
    optionsRef.current.volume = clamped;
    if (synthesisRef.current) {
      synthesisRef.current.volume = clamped;
    }
  }, []);

  return {
    isSpeaking,
    isSupported,
    isPaused,
    speak,
    pause,
    resume,
    cancel,
    setRate,
    setPitch,
    setVolume,
    error,
  };
}

// Helper function to provide user-friendly error messages
function getErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'canceled': 'Speech synthesis was canceled.',
    'interrupted': 'Speech synthesis was interrupted.',
    'invalid-argument': 'Invalid argument provided.',
    'network': 'Network error occurred.',
    'synthesis-unavailable': 'Speech synthesis is not available.',
    'synthesis-failed': 'Speech synthesis failed.',
  };

  return errorMap[error] || `Error: ${error}`;
}

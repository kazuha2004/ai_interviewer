'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  language?: string;
  continuous?: boolean;
  interimResults?: boolean;
  maxAlternatives?: number;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
  abort: () => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): SpeechRecognitionResult {
  const {
    language = 'en-US',
    continuous = true, // CHANGED: Force continuous mode to stay listening through pauses
    interimResults = true,
    maxAlternatives = 1,
  } = options;

  const [transcript, setTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(false);

  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>('');
  const shouldBeListeningRef = useRef<boolean>(false); // Track if user wants to listen

  useEffect(() => {
    // Check browser support
    if (typeof window !== 'undefined') {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (SpeechRecognition) {
        try {
          recognitionRef.current = new SpeechRecognition();
          setIsSupported(true);
          console.log('[SpeechRecognition] ✅ Web Speech API is supported in this browser');
        } catch (err) {
          console.error('[SpeechRecognition] ❌ Failed to initialize:', err);
          setIsSupported(false);
          return;
        }

        const recognition = recognitionRef.current;

        // Configure recognition
        recognition.continuous = continuous;
        recognition.interimResults = interimResults;
        recognition.lang = language;
        recognition.maxAlternatives = maxAlternatives;

        // Handle results
        recognition.onresult = (event: any) => {
          let interimTranscript = '';
          let newFinalTranscript = '';
          let maxConfidence = 0;

          // Process all results from the last checkpoint
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            const confidence = event.results[i][0].confidence;

            if (confidence > maxConfidence) {
              maxConfidence = confidence;
            }

            if (event.results[i].isFinal) {
              // Result became final - add to permanent transcript
              newFinalTranscript += transcript + ' ';
            } else {
              // Still interim/temporary - collect for current display
              interimTranscript += transcript;
            }
          }

          // Important: Add newly finalized text to our ref immediately
          // This prevents losing words when there are pauses
          transcriptRef.current += newFinalTranscript;

          // Display: accumulated finals + current interim
          // This ensures we show all words even across pauses
          const fullTranscript = (transcriptRef.current + interimTranscript).trim();
          setTranscript(fullTranscript);
          setConfidence(maxConfidence);

          console.log('[DEBUG-Speech] Accumulated finals:', transcriptRef.current.trim(), 'Current interim:', interimTranscript.trim());
        };

        // Handle end (auto-stop due to silence or browser limitation)
        recognition.onend = () => {
          console.log('[SpeechRecognition] Ended - shouldBeListening:', shouldBeListeningRef.current);
          // Restart if user hasn't manually stopped
          if (shouldBeListeningRef.current && recognitionRef.current) {
            try {
              console.log('[SpeechRecognition] Restarting due to timeout...');
              setTimeout(() => {
                if (shouldBeListeningRef.current && recognitionRef.current) {
                  recognitionRef.current.start();
                }
              }, 100);
            } catch (err) {
              console.error('[SpeechRecognition] Error restarting:', err);
              setIsListening(false);
            }
          } else {
            setIsListening(false);
          }
        };

        // Handle speech end (pause detected) - keep listening for more speech
        recognition.onspeechend = () => {
          console.log('[SpeechRecognition] Speech pause detected - staying active for more input...');
          // Don't stop - let continuous mode keep the mic open
        };

        // Handle errors
        recognition.onerror = (event: any) => {
          const errorMessage = getErrorMessage(event.error);
          setError(errorMessage);
          console.log('Speech recognition error:', event.error);
        };

        // Handle start
        recognition.onstart = () => {
          transcriptRef.current = '';
          setIsListening(true);
          setError(null);
          setTranscript('');
          setConfidence(0);
        };

        // Prevent memory leaks
        return () => {
          shouldBeListeningRef.current = false;
          if (recognitionRef.current) {
            recognitionRef.current.abort();
          }
        };
      } else {
        setIsSupported(false);
        console.warn('[SpeechRecognition] ❌ Web Speech API not available in this browser');
        console.warn('[Browser Info]', {
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          hasWebkitSpeechRecognition: !!(window as any).webkitSpeechRecognition,
          hasSpeechRecognition: !!(window as any).SpeechRecognition,
        });
      }
    }
  }, [language, continuous, interimResults, maxAlternatives]);

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      shouldBeListeningRef.current = true; // Mark that user wants to listen
      setTranscript('');
      setConfidence(0);
      setError(null);
      try {
        recognitionRef.current.start();
      } catch (err) {
        setError('Failed to start listening');
        console.error('Error starting recognition:', err);
        shouldBeListeningRef.current = false;
      }
    }
  }, [isListening]);

  const stopListening = useCallback(() => {
    shouldBeListeningRef.current = false; // Mark that user stopped listening
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  const resetTranscript = useCallback(() => {
    transcriptRef.current = '';
    setTranscript('');
    setConfidence(0);
  }, []);

  const abort = useCallback(() => {
    shouldBeListeningRef.current = false; // Make sure we stop
    if (recognitionRef.current) {
      recognitionRef.current.abort();
    }
    setIsListening(false);
    setError(null);
  }, []);

  return {
    transcript,
    confidence,
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
    abort,
  };
}

// Helper function to provide user-friendly error messages
function getErrorMessage(error: string): string {
  const errorMap: Record<string, string> = {
    'no-speech':
      'No speech was detected. Please try again or speak louder.',
    'audio-capture':
      'No microphone found. Ensure it is connected and permitted.',
    'network': 'Network error occurred. Please check your connection.',
    'not-allowed':
      'Microphone permission was denied. Please allow microphone access.',
    'bad-grammar':
      'Speech grammar error. Please try again.',
    'service-not-allowed':
      'Speech recognition is not allowed. Please check your settings.',
    'aborted': 'Speech recognition was aborted.',
    'timeout': 'Speech recognition timed out.',
  };

  return errorMap[error] || `Error: ${error}`;
}

'use client';

/**
 * Interview Client Component
 * Separated from page.tsx to avoid Suspense boundary issues
 */

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { InterviewLayout } from '@/components/InterviewLayout';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { AvatarSection } from '@/components/AvatarSection';
import { ControlBar } from '@/components/ControlBar';
import { GET, POST } from '@/utils/api-client';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { Session, Message, InterviewMode } from '@/lib/types';

export function InterviewClientComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  // State management
  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTranscript, setCurrentTranscript] = useState('');
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('interviewer');
  const [showVoiceUnsupported, setShowVoiceUnsupported] = useState(false);
  const [toastMessage, setToastMessage] = useState(''); // NEW: For non-critical messages
  const [textInput, setTextInput] = useState(''); // NEW: For text input fallback when voice unavailable
  const [autoSubmitTimer, setAutoSubmitTimer] = useState<NodeJS.Timeout | null>(null); // NEW: Auto-submit timer

  // Web Speech API hooks
  const speechRecognition = useSpeechRecognition({
    language: 'en-US',
    continuous: true,  // Keep listening through pauses until user stops
    interimResults: true,
  });

  const speechSynthesis = useSpeechSynthesis({
    rate: 1,
    pitch: 1,
    volume: 0.8,
  });

  // Check browser support - only require speech recognition for core functionality
  useEffect(() => {
    if (!speechRecognition.isSupported) {
      setShowVoiceUnsupported(true);
      console.warn('[Interview] Speech recognition not supported');
    } else {
      setShowVoiceUnsupported(false);
    }
  }, [speechRecognition.isSupported, speechSynthesis.isSupported]);

  // Initialize session
  useEffect(() => {
    if (!sessionId) {
      setError('No session ID found. Please start from the home page.');
      return;
    }

    const initializeSession = async () => {
      try {
        console.log('Fetching session with ID:', sessionId);
        const response = await GET<Session & { messages?: Message[] }>(
          `/sessions/${sessionId}`
        );

        console.log('Session response:', response);

        if (!response.success || !response.data) {
          throw new Error(response.error || 'Failed to load session');
        }

        setSession(response.data);
        const loadedMessages = response.data.messages || [];
        setMessages(loadedMessages);

        // If no messages yet, generate opening question from interviewer
        if (loadedMessages.length === 0) {
          await generateOpeningQuestion(sessionId, response.data);
        }
      } catch (err) {
        console.error('Session initialization error:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize session');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSession();
  }, [sessionId]);

  // Generate opening question from interviewer
  const generateOpeningQuestion = async (sId: string, sess: Session) => {
    try {
      setIsProcessing(true);

      // Initial interviewer message to get the conversation started
      const response = await fetch(`/api/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage:
            'Hello, I am ready to begin my tutoring interview. Please introduce yourself and ask me about my teaching experience.',
          sessionId: sId,
          mode: 'interviewer',
        }),
      });

      if (!response.ok) {
        console.error('Failed to generate opening question:', response.status);
        setError('Failed to load AI interviewer. Please refresh.');
        return;
      }

      let aiResponse = '';
      const reader = response.body?.getReader();
      if (!reader) {
        console.error('No response body');
        return;
      }

      const decoder = new TextDecoder();

      // Stream the response
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        aiResponse += chunk;
      }

      if (!aiResponse.trim()) {
        console.error('Empty response from AI');
        return;
      }

      // Reload messages to get the new AI greeting
      const messagesResponse = await GET<Session & { messages?: Message[] }>(
        `/sessions/${sId}`
      );

      if (messagesResponse.success && messagesResponse.data?.messages) {
        setMessages(messagesResponse.data.messages);

        // Speak the opening question
        if (speechSynthesis.isSupported && aiResponse.trim()) {
          speechSynthesis.speak(aiResponse.trim(), {
            rate: 0.85,
          });
        }
      }
    } catch (err) {
      console.error('Error generating opening question:', err);
      // Don't fail - let user continue anyway
    } finally {
      setIsProcessing(false);
    }
  };

  // Monitor for speech recognition errors
  useEffect(() => {
    if (speechRecognition.error) {
      console.log('[DEBUG] Speech recognition error:', speechRecognition.error);
      
      // Non-critical errors (no-speech, timeout) -> show as toast, not full-screen error
      if (speechRecognition.error.toLowerCase().includes('no-speech') ||
          speechRecognition.error.toLowerCase().includes('timeout')) {
        setToastMessage(speechRecognition.error);
        // Auto-clear toast after 4 seconds
        setTimeout(() => {
          setToastMessage('');
        }, 4000);
      } else {
        // Critical errors (permission denied, network, etc.) -> show as full error
        setError(speechRecognition.error);
      }
    }
  }, [speechRecognition.error]);

  // Timer for interview duration
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStartRecording = () => {
    if (!speechRecognition.isSupported) {
      const message = 'Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.';
      setError(message);
      console.error('[Interview]', message);
      console.warn('[Browser]', {
        hasWebApi: typeof window !== 'undefined',
        recognition: (window as any)?.SpeechRecognition || (window as any)?.webkitSpeechRecognition,
      });
      return;
    }

    console.log('[Interview] Starting recording...');
    setError(''); // Clear any previous errors
    setToastMessage(''); // Clear any previous toast messages
    speechRecognition.resetTranscript(); // Clear any old transcript
    
    try {
      speechRecognition.startListening();
    } catch (err) {
      const message = `Failed to start mic: ${err instanceof Error ? err.message : String(err)}`;
      setError(message);
      console.error('[Interview]', message);
    }
  };

  const handleStopRecording = async () => {
    console.log('[Interview] Stop recording clicked');
    speechRecognition.stopListening();
    
    // Wait a short moment for final transcript to settle
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const transcript = speechRecognition.transcript.trim();
    console.log('[Interview] Transcript captured:', transcript, 'Length:', transcript.length);
    console.log('[Interview] Speech recognition state:', {
      isListening: speechRecognition.isListening,
      confidence: speechRecognition.confidence,
      error: speechRecognition.error,
    });
    
    if (!transcript) {
      console.warn('[Interview] No transcript detected');
      if (speechRecognition.error) {
        setToastMessage(`Recording error: ${speechRecognition.error}`);
      } else {
        setToastMessage('No speech detected. Please click the mic button again and speak clearly.');
      }
      // Auto-clear toast after 4 seconds
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    console.log('[Interview] Starting processing with transcript:', transcript);
    setCurrentTranscript(transcript);
    setIsProcessing(true);
    setError(''); // Clear any previous errors

    try {
      if (!sessionId) {
        throw new Error('No session ID');
      }

      console.log('[DEBUG] Calling conversation API with:', { userMessage: transcript, sessionId, mode: interviewMode });

      // Call conversation API
      const response = await fetch(`/api/conversation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: transcript,
          sessionId,
          mode: interviewMode,
        }),
      });

      console.log('[DEBUG] API response status:', response.status, response.ok);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[DEBUG] API error response:', errorText);
        throw new Error('Failed to get response from AI');
      }

      let aiResponse = '';
      const reader = response.body?.getReader();
      if (!reader) {
        console.error('[DEBUG] No response body reader');
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();

      // Stream the response
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log('[DEBUG] Streaming complete. Total response length:', aiResponse.length);
          break;
        }

        const chunk = decoder.decode(value);
        console.log('[DEBUG] Received chunk:', chunk.substring(0, 50) + '...');
        aiResponse += chunk;
      }

      console.log('[DEBUG] Full AI response:', aiResponse.substring(0, 100) + '...');

      // Reload messages to get updated conversation
      const messagesResponse = await GET<Session & { messages?: Message[] }>(
        `/sessions/${sessionId}`
      );

      console.log('[DEBUG] Messages response:', { success: messagesResponse.success, messageCount: messagesResponse.data?.messages?.length });

      if (messagesResponse.success && messagesResponse.data?.messages) {
        setMessages(messagesResponse.data.messages);

        // Speak the AI response if speech synthesis is supported
        if (speechSynthesis.isSupported && aiResponse.trim()) {
          console.log('[DEBUG] Speaking AI response');
          speechSynthesis.speak(aiResponse.trim(), {
            rate: 0.9, // Slightly slower for clarity
          });
        }
      }

      // Toggle mode after each exchange
      if (Math.random() > 0.5) {
        setInterviewMode(interviewMode === 'interviewer' ? 'student' : 'interviewer');
      }

      // FULLY STOP the speech recognition before next question
      console.log('[DEBUG] Fully stopping speech recognition for next question...');
      speechRecognition.abort();
      speechRecognition.resetTranscript();
    } catch (err) {
      console.error('[DEBUG] Error in handleStopRecording:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to process response'
      );
      // Even on error, stop listening
      speechRecognition.abort();
    } finally {
      setIsProcessing(false);
      setCurrentTranscript('');
    }
  };

  const handleTextSubmit = async () => {
    const text = textInput.trim();
    
    if (!text) {
      setToastMessage('Please enter some text before submitting.');
      setTimeout(() => setToastMessage(''), 4000);
      return;
    }

    console.log('[Interview] Text submitted:', text);
    setTextInput(''); // Clear input
    setCurrentTranscript(text);
    setIsProcessing(true);

    try {
      // Send the text response to the AI
      const response = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          sessionId: sessionId,
          mode: interviewMode === 'interviewer' ? 'student' : 'interviewer',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit response');
      }

      let aiResponse = '';
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        aiResponse += decoder.decode(value);
      }

      // Reload messages to get updated conversation
      const messagesResponse = await GET<Session & { messages?: Message[] }>(
        `/sessions/${sessionId}`
      );

      if (messagesResponse.success && messagesResponse.data?.messages) {
        setMessages(messagesResponse.data.messages);

        // Speak the AI response if speech synthesis is supported
        if (speechSynthesis.isSupported && aiResponse.trim()) {
          speechSynthesis.speak(aiResponse.trim(), {
            rate: 0.9,
          });
        }
      }

      // Toggle mode after each exchange
      if (Math.random() > 0.5) {
        setInterviewMode(interviewMode === 'interviewer' ? 'student' : 'interviewer');
      }
    } catch (err) {
      console.error('[Interview] Error submitting text:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to process response'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinishInterview = async () => {
    if (!sessionId || !session) return;

    try {
      setIsProcessing(true);
      console.log('[DEBUG] Finishing interview for session:', sessionId);

      // Mark session as completed using PUT (not POST)
      const updateResponse = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          endedAt: new Date().toISOString(),
        }),
      });

      if (!updateResponse.ok) {
        const error = await updateResponse.text();
        console.error('[DEBUG] Update session error:', error);
        throw new Error('Failed to mark session as completed');
      }

      console.log('[DEBUG] Session updated, triggering evaluation');

      // Trigger evaluation
      const evalResponse = await fetch(`/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      console.log('[DEBUG] Evaluation response status:', evalResponse.status);

      if (!evalResponse.ok) {
        const error = await evalResponse.text();
        console.error('[DEBUG] Evaluation error:', error);
        throw new Error('Failed to generate evaluation');
      }

      console.log('[DEBUG] Evaluation complete, navigating to results');

      // Navigate to results
      router.push(`/results/${sessionId}`);
    } catch (err) {
      console.error('[DEBUG] Error finishing interview:', err);
      setError(err instanceof Error ? err.message : 'Failed to finish interview');
    } finally {
      setIsProcessing(false);
    }
  };

  // Keyboard shortcuts for recording (defined after all handler functions)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Spacebar to submit when recording (if voice is supported)
      if (e.code === 'Space' && speechRecognition.isListening && !isProcessing) {
        e.preventDefault();
        handleStopRecording();
      }
      // Escape to cancel recording
      if (e.code === 'Escape' && speechRecognition.isListening) {
        speechRecognition.abort();
        speechRecognition.resetTranscript();
        console.log('[Interview] Recording cancelled via Escape key');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [speechRecognition.isListening, isProcessing, handleStopRecording]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
          <div className="text-4xl">🎓</div>
        </motion.div>
        <p className="ml-4 text-gray-400">Loading interview...</p>
      </div>
    );
  }

  if ((error && !speechRecognition.error && error !== toastMessage) || (!session && isLoading === false)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="bg-red-900 bg-opacity-50 border border-red-700 rounded-lg p-6 max-w-md">
          <h2 className="text-xl font-semibold text-red-200 mb-2">Error</h2>
          <p className="text-red-100 mb-4">{error || 'An error occurred'}</p>
          <button
            onClick={() => router.push('/')}
            className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded transition"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden pb-24">
      {/* Error Toast - Speech/Microphone Issues */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 bg-red-900 bg-opacity-75 border border-red-700 rounded-lg p-4 max-w-sm z-50 shadow-xl"
        >
          <p className="text-red-100 text-sm">
            ⚠️ {error}
          </p>
        </motion.div>
      )}

      {/* Toast Notification - Non-critical messages */}
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-4 right-4 bg-amber-900 bg-opacity-75 border border-amber-700 rounded-lg p-4 max-w-sm z-50 shadow-xl"
        >
          <p className="text-amber-100 text-sm">
            💬 {toastMessage}
          </p>
        </motion.div>
      )}

      {showVoiceUnsupported && (
        <div className="fixed top-4 right-4 bg-yellow-900 bg-opacity-75 border border-yellow-700 rounded-lg p-4 max-w-sm z-50">
          <p className="text-yellow-200 text-sm">
            ⚠️ Voice features not available. Don't worry! You can type your responses instead using the text input below.
          </p>
        </div>
      )}

      {speechRecognition.error && (
        <div className="fixed top-4 right-4 bg-red-900 bg-opacity-75 border border-red-700 rounded-lg p-4 max-w-sm z-50">
          <p className="text-red-200 text-sm">
            🎤 {speechRecognition.error}
          </p>
        </div>
      )}

      <InterviewLayout
        transcript={
          <TranscriptPanel
            messages={messages}
            isLoading={isProcessing}
            currentMode={interviewMode}
            liveTranscript={speechRecognition.transcript}
            isRecording={speechRecognition.isListening}
            confidence={speechRecognition.confidence}
          />
        }
        avatar={
          <AvatarSection
            isListening={speechRecognition.isListening}
            isSpeaking={isProcessing || speechSynthesis.isSpeaking}
            currentMode={interviewMode}
            confidence={speechRecognition.confidence}
          />
        }
        controls={
          speechRecognition.isSupported ? (
            <ControlBar
              isRecording={speechRecognition.isListening}
              isProcessing={isProcessing}
              duration={duration}
              onStartRecording={handleStartRecording}
              onStopRecording={handleStopRecording}
              onFinishInterview={handleFinishInterview}
              canFinish={messages.length > 2}
              hasTranscript={speechRecognition.transcript.length > 0}
              confidence={speechRecognition.confidence}
            />
          ) : (
            <div className="flex items-center justify-between gap-6 px-8 py-5 max-w-7xl mx-auto w-full">
              {/* Timer */}
              <div className="flex flex-col items-center justify-center min-w-24">
                <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold mb-1">Duration</div>
                <div className="text-3xl font-mono font-bold text-white bg-gray-800 px-4 py-2 rounded-lg border border-gray-700 shadow-inner">
                  {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
                </div>
              </div>

              {/* Text Input Area */}
              <div className="flex-1 flex flex-col gap-3">
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !isProcessing && handleTextSubmit()}
                  placeholder="Type your response here..."
                  disabled={isProcessing}
                  className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition disabled:opacity-50"
                />
                <motion.button
                  whileHover={!isProcessing ? { scale: 1.05 } : {}}
                  whileTap={!isProcessing ? { scale: 0.95 } : {}}
                  onClick={handleTextSubmit}
                  disabled={isProcessing || !textInput.trim()}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white font-semibold rounded-lg transition"
                >
                  {isProcessing ? '⏳ Processing...' : '📤 Submit'}
                </motion.button>
              </div>

              {/* Finish Button */}
              <motion.button
                whileHover={messages.length > 2 && !isProcessing ? { scale: 1.05 } : {}}
                whileTap={messages.length > 2 && !isProcessing ? { scale: 0.95 } : {}}
                onClick={handleFinishInterview}
                disabled={messages.length <= 2 || isProcessing}
                className={`px-8 py-3 rounded-xl font-bold text-lg transition-all shadow-lg border-2 min-w-32 text-center ${
                  messages.length > 2 && !isProcessing
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-green-500 shadow-green-600/50 cursor-pointer'
                    : 'bg-gray-700 text-gray-400 border-gray-600 cursor-not-allowed'
                }`}
              >
                ✓ Finish Interview
              </motion.button>
            </div>
          )
        }
        isInterview={true}
      />
    </div>
  );
}
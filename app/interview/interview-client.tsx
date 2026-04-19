'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { InterviewLayout } from '@/components/InterviewLayout';
import { TranscriptPanel } from '@/components/TranscriptPanel';
import { AvatarSection } from '@/components/AvatarSection';
import { ControlBar } from '@/components/ControlBar';
import { GET } from '@/utils/api-client';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import type { Session, Message, InterviewMode } from '@/lib/types';

export function InterviewClientComponent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const sessionId = searchParams.get('sessionId');

  const [session, setSession] = useState<Session | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [duration, setDuration] = useState(0);
  const [interviewMode, setInterviewMode] = useState<InterviewMode>('interviewer');

  const speechRecognition = useSpeechRecognition({
    language: 'en-US',
    continuous: true,
    interimResults: true,
  });

  const speechSynthesis = useSpeechSynthesis({
    rate: 1,
    pitch: 1,
    volume: 0.8,
  });

  // ── Load session ──
  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      try {
        const res = await GET<Session & { messages?: Message[] }>(`/sessions/${sessionId}`);
        if (!res.success || !res.data) throw new Error('Failed to load session');
        setSession(res.data);
        setMessages(res.data.messages || []);
      } catch {
        setError('Failed to load interview session');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [sessionId]);

  // ── Timer ──
  useEffect(() => {
    const interval = setInterval(() => setDuration((d) => d + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  // ── Spacebar shortcut to toggle recording ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        if (speechRecognition.isListening) {
          handleStopRecording();
        } else if (!isProcessing) {
          handleStartRecording();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [speechRecognition.isListening, isProcessing]);

  // ── Start recording ──
  const handleStartRecording = useCallback(() => {
    if (!speechRecognition.isSupported) {
      setError('Speech recognition is not supported in this browser');
      return;
    }
    setError('');
    speechRecognition.resetTranscript();
    speechRecognition.startListening();
  }, [speechRecognition]);

  // ── Stop recording + send ──
  const handleStopRecording = useCallback(async () => {
    speechRecognition.stopListening();

    // Brief delay to let the final transcript settle
    await new Promise((r) => setTimeout(r, 400));

    const text = speechRecognition.transcript.trim();
    if (!text) return;

    setIsProcessing(true);

    try {
      const res = await fetch('/api/conversation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userMessage: text,
          sessionId,
          mode: interviewMode,
        }),
      });

      if (!res.ok) throw new Error('Conversation API error');

      // Stream AI response
      let ai = '';
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        ai += decoder.decode(value);
      }

      // Refresh messages
      const updated = await GET<Session & { messages?: Message[] }>(`/sessions/${sessionId}`);
      if (updated.success && updated.data?.messages) {
        setMessages(updated.data.messages);
        if (speechSynthesis.isSupported && ai) {
          speechSynthesis.speak(ai);
        }
      }

      // Alternate mode each turn
      setInterviewMode((prev) => (prev === 'interviewer' ? 'student' : 'interviewer'));
    } catch {
      setError('Failed to process response — please try again');
    } finally {
      setIsProcessing(false);
      speechRecognition.resetTranscript();
    }
  }, [speechRecognition, interviewMode, sessionId, speechSynthesis]);

  // ── Finish interview ──
  const handleFinishInterview = useCallback(async () => {
    if (!sessionId || !session || isFinishing) return;

    try {
      setIsFinishing(true);
      setIsProcessing(true);

      const updateRes = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          endedAt: new Date().toISOString(),
        }),
      });
      if (!updateRes.ok) throw new Error('Failed to update session');

      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      if (!evalRes.ok) throw new Error('Failed to evaluate session');

      router.push(`/results/${sessionId}`);
    } catch {
      setError('Failed to finish interview — please try again');
    } finally {
      setIsProcessing(false);
      setIsFinishing(false);
    }
  }, [sessionId, session, isFinishing, router]);

  // ── Loading screen ──
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4 bg-[#050508]">
        <div
          className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin"
          aria-hidden
        />
        <p className="text-slate-500 text-sm font-medium">Loading interview…</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">

      {/* ── Error banner ── */}
      {error && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-red-950/70 border-b border-red-800/40 z-30">
          <svg
            className="w-4 h-4 text-red-400 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
            aria-hidden
          >
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-9V7a1 1 0 10-2 0v2a1 1 0 102 0zm0 4a1 1 0 11-2 0 1 1 0 012 0z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-red-300 text-sm flex-1 min-w-0 truncate">{error}</span>
          <button
            onClick={() => setError('')}
            className="flex-shrink-0 text-red-500 hover:text-red-300 transition-colors p-0.5 rounded"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>
      )}

      {/* ── Main layout ── */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <InterviewLayout
          isInterview={true}
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
          }
        />
      </div>
    </div>
  );
}
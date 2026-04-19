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

  const [hasStarted, setHasStarted] = useState(false); // 🔥 ADDED

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

  // ── 🔥 AUTO START INTERVIEW (FIX DEAD TALK) ──
  useEffect(() => {
    const startInterview = async () => {
      if (!sessionId || hasStarted || messages.length > 0) return;

      try {
        setIsProcessing(true);

        const res = await fetch('/api/conversation', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: '__start__',
            sessionId,
            mode: 'interviewer',
          }),
        });

        if (!res.ok) throw new Error('Failed to start interview');

        let ai = '';
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader!.read();
          if (done) break;
          ai += decoder.decode(value);
        }

        const updated = await GET<Session & { messages?: Message[] }>(`/sessions/${sessionId}`);
        if (updated.success && updated.data?.messages) {
          setMessages(updated.data.messages);

          // 🔊 AI speaks first question
          if (speechSynthesis.isSupported && ai) {
            speechSynthesis.speak(ai);
          }
        }

        setHasStarted(true);
      } catch (err) {
        console.error('Auto start error:', err);
      } finally {
        setIsProcessing(false);
      }
    };

    startInterview();
  }, [sessionId, messages, hasStarted, speechSynthesis]);

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

      let ai = '';
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        ai += decoder.decode(value);
      }

      const updated = await GET<Session & { messages?: Message[] }>(`/sessions/${sessionId}`);
      if (updated.success && updated.data?.messages) {
        setMessages(updated.data.messages);
        if (speechSynthesis.isSupported && ai) {
          speechSynthesis.speak(ai);
        }
      }

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

      const evalRes = await fetch('/api/evaluate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

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
        <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Loading interview…</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden flex flex-col">

      {error && (
        <div className="flex-shrink-0 flex items-center gap-3 px-4 py-3 bg-red-950/70 border-b border-red-800/40 z-30">
          <span className="text-red-300 text-sm flex-1 truncate">{error}</span>
        </div>
      )}

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
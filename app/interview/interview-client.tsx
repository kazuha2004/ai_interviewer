'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
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
  const [isFinishing, setIsFinishing] = useState(false); // 🔥 NEW FIX
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

  // Load session
  useEffect(() => {
    if (!sessionId) return;

    const load = async () => {
      try {
        const res = await GET<Session & { messages?: Message[] }>(
          `/sessions/${sessionId}`
        );

        if (!res.success || !res.data) {
          throw new Error('Failed to load session');
        }

        setSession(res.data);
        setMessages(res.data.messages || []);
      } catch (err) {
        setError('Failed to load interview');
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [sessionId]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setDuration((d) => d + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // 🎤 Start Recording
  const handleStartRecording = () => {
    if (!speechRecognition.isSupported) {
      setError('Speech not supported');
      return;
    }
    speechRecognition.resetTranscript();
    speechRecognition.startListening();
  };

  // 🛑 Stop Recording + Send
  const handleStopRecording = async () => {
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

      if (!res.ok) throw new Error();

      let ai = '';
      const reader = res.body?.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        ai += decoder.decode(value);
      }

      const updated = await GET<Session & { messages?: Message[] }>(
        `/sessions/${sessionId}`
      );

      if (updated.success && updated.data?.messages) {
        setMessages(updated.data.messages);
        if (speechSynthesis.isSupported) {
          speechSynthesis.speak(ai);
        }
      }

      // Toggle mode
      setInterviewMode((prev) =>
        prev === 'interviewer' ? 'student' : 'interviewer'
      );
    } catch {
      setError('Failed to process response');
    } finally {
      setIsProcessing(false);
      speechRecognition.resetTranscript();
    }
  };

  // ✅ 🔥 FIXED FINISH FUNCTION
  const handleFinishInterview = async () => {
    if (!sessionId || !session || isFinishing) return;

    try {
      setIsFinishing(true);
      setIsProcessing(true);

      // Update session
      const updateRes = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          endedAt: new Date().toISOString(),
        }),
      });

      if (!updateRes.ok) throw new Error();

      // Call evaluation (SAFE now)
      const evalRes = await fetch(`/api/evaluate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!evalRes.ok) throw new Error();

      router.push(`/results/${sessionId}`);
    } catch (err) {
      console.error(err);
      setError('Failed to finish interview');
    } finally {
      setIsProcessing(false);
      setIsFinishing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden pb-24">
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
        isInterview={true}
      />
    </div>
  );
}
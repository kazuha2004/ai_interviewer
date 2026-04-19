'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from '@/lib/types';

interface TranscriptPanelProps {
  messages: Message[];
  isLoading?: boolean;
  currentMode?: 'interviewer' | 'student';
  liveTranscript?: string;
  isRecording?: boolean;
  confidence?: number;
}

export function TranscriptPanel({
  messages,
  isLoading = false,
  currentMode,
  liveTranscript = '',
  isRecording = false,
  confidence = 0,
}: TranscriptPanelProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRecording, isLoading, liveTranscript]);

  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'user':
        return {
          bubble: 'bg-indigo-600/90 border-indigo-500/40',
          badge: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
          avatar: 'bg-indigo-700 border-indigo-500/50',
          icon: '👤',
          label: 'You',
          isUser: true,
        };
      case 'interviewer':
        return {
          bubble: 'bg-white/[0.06] border-white/[0.1]',
          badge: 'bg-violet-500/15 text-violet-300 border-violet-500/25',
          avatar: 'bg-violet-800 border-violet-500/50',
          icon: '🤵',
          label: 'Interviewer',
          isUser: false,
        };
      case 'student':
        return {
          bubble: 'bg-white/[0.06] border-white/[0.1]',
          badge: 'bg-amber-500/15 text-amber-300 border-amber-500/25',
          avatar: 'bg-amber-700 border-amber-500/50',
          icon: '🧒',
          label: 'Student',
          isUser: false,
        };
      default:
        return {
          bubble: 'bg-white/[0.04] border-white/[0.08]',
          badge: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
          avatar: 'bg-slate-700 border-slate-500/50',
          icon: '💬',
          label: role,
          isUser: false,
        };
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#050508] overflow-hidden">

      {/* ── Header ── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 md:px-6 py-3 md:py-4 border-b border-white/[0.06] bg-[#08080f]">
        <div>
          <h2 className="text-white font-semibold text-sm md:text-base tracking-tight">
            Conversation
          </h2>
          <p className="text-slate-600 text-xs mt-0.5">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>

        {currentMode && (
          <div
            className={`flex items-center gap-1.5 md:gap-2 px-2.5 md:px-3 py-1 md:py-1.5 rounded-full border text-xs font-semibold ${
              currentMode === 'interviewer'
                ? 'bg-violet-500/10 border-violet-500/25 text-violet-300'
                : 'bg-amber-500/10 border-amber-500/25 text-amber-300'
            }`}
          >
            <span className="text-sm">{currentMode === 'interviewer' ? '🤵' : '🧒'}</span>
            <span className="capitalize hidden sm:inline">{currentMode} Mode</span>
            <span className="capitalize sm:hidden">{currentMode === 'interviewer' ? 'Int.' : 'Stu.'}</span>
          </div>
        )}
      </div>

      {/* ── Message list ── */}
      <div
        className="flex-1 overflow-y-auto px-3 md:px-5 py-4 md:py-6 space-y-4 md:space-y-5"
        style={{ scrollbarWidth: 'thin', scrollbarColor: 'rgba(255,255,255,0.07) transparent' }}
      >
        {/* Empty state */}
        {messages.length === 0 && !isLoading && !isRecording ? (
          <div className="flex items-center justify-center h-full min-h-[200px]">
            <div className="text-center py-10">
              <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-2xl md:text-3xl mx-auto mb-4">
                💬
              </div>
              <p className="text-slate-400 font-medium text-sm">
                Waiting for conversation to start
              </p>
              <p className="text-slate-600 text-xs mt-1.5 max-w-[180px] mx-auto leading-relaxed">
                The AI interviewer will greet you shortly
              </p>
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {messages.map((msg, idx) => {
              const cfg = getRoleConfig(msg.role);

              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.26, ease: 'easeOut' }}
                  className={`flex gap-2 md:gap-3 items-end ${cfg.isUser ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  {/* Avatar dot */}
                  <div
                    className={`flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full ${cfg.avatar} border flex items-center justify-center text-xs md:text-sm`}
                  >
                    {cfg.icon}
                  </div>

                  <div
                    className={`flex flex-col gap-1.5 min-w-0 ${
                      cfg.isUser ? 'items-end max-w-[80%] md:max-w-[75%]' : 'items-start max-w-[80%] md:max-w-[75%]'
                    }`}
                  >
                    {/* Role badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border text-[0.65rem] md:text-[0.7rem] font-semibold ${cfg.badge}`}
                    >
                      {cfg.label}
                      {msg.speechConfidence != null && msg.speechConfidence > 0 && (
                        <span className="opacity-55">
                          · {Math.round(msg.speechConfidence * 100)}%
                        </span>
                      )}
                    </div>

                    {/* Message bubble */}
                    <div
                      className={`${cfg.bubble} border rounded-2xl px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-[0.9rem] text-slate-100 leading-relaxed break-words shadow-lg w-full`}
                    >
                      {msg.content}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}

        {/* AI typing indicator */}
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 md:gap-3 items-end"
          >
            <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-violet-800 border border-violet-500/50 flex items-center justify-center text-xs md:text-sm">
              🤵
            </div>
            <div className="bg-white/[0.06] border border-white/[0.1] rounded-2xl px-4 md:px-5 py-3 md:py-4">
              <div className="flex gap-1.5 items-center">
                {[0, 0.18, 0.36].map((delay, i) => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.65, repeat: Infinity, delay, ease: 'easeInOut' }}
                    className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-violet-400"
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Live recording bubble */}
        {isRecording && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-2 md:gap-3 flex-row-reverse items-end"
          >
            <div className="flex-shrink-0 w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-700 border border-indigo-500/50 flex items-center justify-center text-xs md:text-sm">
              🎤
            </div>
            <div className="flex flex-col gap-1.5 items-end max-w-[80%] md:max-w-[75%] min-w-0">
              {/* Recording badge */}
              <div className="inline-flex items-center gap-1.5 px-2 md:px-2.5 py-0.5 md:py-1 rounded-full border bg-red-500/15 border-red-500/25 text-red-300 text-[0.65rem] md:text-[0.7rem] font-semibold">
                <motion.span
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity }}
                  className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block flex-shrink-0"
                />
                Recording
                {confidence > 0 && (
                  <span className="opacity-55">· {Math.round(confidence * 100)}%</span>
                )}
              </div>

              {/* Live transcript bubble */}
              <div className="bg-indigo-700/80 border border-indigo-500/40 rounded-2xl px-3.5 md:px-4 py-2.5 md:py-3 text-sm md:text-[0.9rem] text-white leading-relaxed break-words min-h-[2.5rem] flex items-center w-full">
                {liveTranscript ? (
                  <span>
                    {liveTranscript}
                    <motion.span
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.55, repeat: Infinity }}
                      className="ml-0.5 inline-block text-indigo-300"
                    >
                      ▌
                    </motion.span>
                  </span>
                ) : (
                  <span className="text-indigo-300/60 italic text-xs md:text-sm">
                    Listening… speak now
                  </span>
                )}
              </div>
            </div>
          </motion.div>
        )}

        <div ref={endRef} />
      </div>
    </div>
  );
}
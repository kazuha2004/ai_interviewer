'use client';

import React, { ReactNode, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface InterviewLayoutProps {
  transcript: ReactNode;
  avatar: ReactNode;
  controls: ReactNode;
  isInterview: boolean;
}

type MobileTab = 'transcript' | 'avatar';

export function InterviewLayout({ transcript, avatar, controls, isInterview }: InterviewLayoutProps) {
  const [activeTab, setActiveTab] = useState<MobileTab>('avatar');

  if (!isInterview) {
    return (
      <div className="flex h-screen bg-[#050508] overflow-hidden">
        <div className="flex-1 flex flex-col min-w-0">{transcript}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-[#050508] overflow-hidden">

      {/* ─── Desktop Layout (md+) ─── */}
      <div className="hidden md:flex flex-1 overflow-hidden min-h-0">

        {/* Left: Transcript */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.06]">
          {transcript}
        </div>

        {/* Right: Avatar */}
        <div
          className="w-80 xl:w-96 flex flex-col flex-shrink-0 border-l border-white/[0.06]"
          style={{ background: 'linear-gradient(160deg, #08080f 0%, #0c0916 100%)' }}
        >
          <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
            {avatar}
          </div>
        </div>
      </div>

      {/* ─── Mobile Tab Bar ─── */}
      <div className="md:hidden flex-shrink-0 flex border-b border-white/[0.07] bg-[#08080f]">
        {(['avatar', 'transcript'] as MobileTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`
              flex-1 relative py-3.5 text-xs font-semibold uppercase tracking-widest
              transition-colors duration-200
              ${activeTab === tab ? 'text-white' : 'text-slate-600 hover:text-slate-400'}
            `}
          >
            <span className="flex items-center justify-center gap-2">
              <span>{tab === 'avatar' ? '🤵' : '💬'}</span>
              <span>{tab === 'avatar' ? 'Interviewer' : 'Transcript'}</span>
            </span>
            {activeTab === tab && (
              <motion.div
                layoutId="tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t-full"
              />
            )}
          </button>
        ))}
      </div>

      {/* ─── Mobile Content ─── */}
      <div className="md:hidden flex-1 overflow-hidden min-h-0 relative">
        <AnimatePresence mode="wait" initial={false}>
          {activeTab === 'avatar' ? (
            <motion.div
              key="avatar"
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="absolute inset-0 flex items-center justify-center p-6 overflow-y-auto"
              style={{ background: 'linear-gradient(160deg, #08080f 0%, #0c0916 100%)' }}
            >
              {avatar}
            </motion.div>
          ) : (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
              className="absolute inset-0 flex flex-col overflow-hidden"
            >
              {transcript}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Bottom Control Bar (shared) ─── */}
      <div
        className="flex-shrink-0 border-t border-white/[0.07] z-20"
        style={{
          background: 'rgba(5,5,8,0.97)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
        }}
      >
        {controls}
      </div>
    </div>
  );
}
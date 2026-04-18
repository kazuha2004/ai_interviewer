'use client';

import React, { ReactNode } from 'react';

interface InterviewLayoutProps {
  transcript: ReactNode;
  avatar: ReactNode;
  controls: ReactNode;
  isInterview: boolean;
}

export function InterviewLayout({ transcript, avatar, controls, isInterview }: InterviewLayoutProps) {
  return (
    <div className="flex h-screen bg-[#050508] overflow-hidden">

      {/* Left Panel - Transcript */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-white/[0.06]">
        {transcript}
      </div>

      {/* Right Panel - Avatar */}
      {isInterview && (
        <div className="w-80 xl:w-96 flex flex-col bg-[#08080f] border-l border-white/[0.06] flex-shrink-0">
          <div className="flex-1 flex items-center justify-center p-8">
            {avatar}
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      {isInterview && (
        <div className="fixed bottom-0 left-0 right-0 z-20 bg-[#050508]/95 backdrop-blur-xl border-t border-white/[0.07]"
          style={{ boxShadow: '0 -20px 60px rgba(0,0,0,0.6)' }}
        >
          {controls}
        </div>
      )}
    </div>
  );
}
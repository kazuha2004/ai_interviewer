'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDuration } from '@/utils/helpers';

interface ControlBarProps {
  isRecording: boolean;
  isProcessing: boolean;
  duration: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
  onFinishInterview: () => void;
  canFinish?: boolean;
  hasTranscript?: boolean;
  confidence?: number;
}

export function ControlBar({
  isRecording,
  isProcessing,
  duration,
  onStartRecording,
  onStopRecording,
  onFinishInterview,
  canFinish = true,
  hasTranscript = false,
  confidence = 0,
}: ControlBarProps) {
  const canRecord = !isProcessing;
  const canEnd = canFinish && !isRecording && !isProcessing;

  return (
    <div className="flex items-center justify-between gap-4 px-6 py-4 max-w-7xl mx-auto w-full">

      {/* Left: Timer */}
      <div className="flex flex-col items-start gap-1 min-w-[80px]">
        <span className="text-[0.62rem] text-slate-600 uppercase tracking-widest font-bold">Duration</span>
        <div
          className="font-mono text-2xl font-bold text-white px-3 py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04]"
          style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
        >
          {formatDuration(duration)}
        </div>
      </div>

      {/* Center: Mic button + status */}
      <div className="flex flex-col items-center gap-3 flex-1">
        <div className="flex items-center gap-5">

          {/* Mic button */}
          <div className="relative">
            {/* Recording pulse rings */}
            <AnimatePresence>
              {isRecording && (
                <>
                  <motion.div
                    key="pr1"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{ scale: 1.7, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeOut' }}
                    className="absolute inset-0 rounded-full border border-red-500/70"
                  />
                  <motion.div
                    key="pr2"
                    initial={{ scale: 1, opacity: 0.4 }}
                    animate={{ scale: 2.2, opacity: 0 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'easeOut', delay: 0.25 }}
                    className="absolute inset-0 rounded-full border border-red-500/40"
                  />
                </>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={canRecord ? { scale: 1.07 } : {}}
              whileTap={canRecord ? { scale: 0.92 } : {}}
              onClick={isRecording ? onStopRecording : onStartRecording}
              disabled={!canRecord}
              className="relative w-16 h-16 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              style={
                isRecording
                  ? {
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      boxShadow: '0 0 0 3px rgba(239,68,68,0.3), 0 0 30px rgba(239,68,68,0.4)',
                      border: '2px solid rgba(239,68,68,0.6)',
                    }
                  : {
                      background: 'linear-gradient(135deg, #4f63e8, #7c3aed)',
                      boxShadow: '0 0 0 3px rgba(99,102,241,0.25), 0 0 30px rgba(99,102,241,0.3)',
                      border: '2px solid rgba(99,102,241,0.5)',
                    }
              }
            >
              <span className="text-2xl">
                {isRecording ? '⏹' : '🎙️'}
              </span>
            </motion.button>
          </div>

          {/* Status badge */}
          <div className="flex flex-col items-start gap-1 min-w-[130px]">
            <span className="text-[0.62rem] text-slate-600 uppercase tracking-widest font-bold">Status</span>
            <div className={`flex items-center gap-2 px-3.5 py-2 rounded-full border text-xs font-semibold ${
              isProcessing
                ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-300'
                : isRecording
                ? 'bg-red-500/10 border-red-500/25 text-red-300'
                : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
            }`}>
              <motion.span
                animate={isRecording || isProcessing ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                transition={{ duration: 0.8, repeat: isRecording || isProcessing ? Infinity : 0 }}
                className={`w-1.5 h-1.5 rounded-full ${
                  isProcessing ? 'bg-yellow-400' : isRecording ? 'bg-red-400' : 'bg-emerald-400'
                }`}
              />
              {isProcessing ? 'Processing...' : isRecording ? `Recording${confidence > 0 ? ` · ${Math.round(confidence * 100)}%` : ''}` : 'Ready'}
            </div>
          </div>
        </div>

        {/* Hint */}
        <AnimatePresence>
          {isRecording && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="text-slate-600 text-[0.72rem] text-center"
            >
              Press <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.1] rounded text-slate-400 font-mono">Space</kbd> or click stop to submit
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Right: Finish */}
      <motion.button
        whileHover={canEnd ? { scale: 1.04 } : {}}
        whileTap={canEnd ? { scale: 0.96 } : {}}
        onClick={onFinishInterview}
        disabled={!canEnd}
        className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-semibold text-sm transition-all border disabled:opacity-35 disabled:cursor-not-allowed"
        style={canEnd ? {
          background: 'linear-gradient(135deg, #059669, #047857)',
          border: '1px solid rgba(16,185,129,0.4)',
          boxShadow: '0 0 20px rgba(16,185,129,0.2)',
          color: 'white',
        } : {
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.08)',
          color: 'rgba(255,255,255,0.3)',
        }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        Finish Interview
      </motion.button>
    </div>
  );
}
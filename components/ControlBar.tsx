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
    <div className="w-full max-w-4xl mx-auto px-4 md:px-6 py-3 md:py-4">

      {/* ── Main row ── */}
      <div className="flex items-center gap-3 md:gap-5">

        {/* ── Left: Duration ── */}
        <div className="flex flex-col items-start gap-0.5 flex-shrink-0">
          <span className="text-[0.58rem] md:text-[0.62rem] text-slate-600 uppercase tracking-widest font-bold">
            Duration
          </span>
          <div
            className="font-mono text-lg md:text-2xl font-bold text-white px-2.5 md:px-3 py-1 md:py-1.5 rounded-lg border border-white/[0.08] bg-white/[0.04]"
            style={{ fontVariantNumeric: 'tabular-nums', letterSpacing: '-0.02em' }}
          >
            {formatDuration(duration)}
          </div>
        </div>

        {/* ── Center: Mic + status ── */}
        <div className="flex-1 flex flex-col items-center gap-2">

          <div className="flex items-center gap-3 md:gap-5">

            {/* Mic button */}
            <div className="relative flex-shrink-0">
              {/* Pulse rings while recording */}
              <AnimatePresence>
                {isRecording && (
                  <>
                    <motion.div
                      key="pr1"
                      initial={{ scale: 1, opacity: 0.6 }}
                      animate={{ scale: 1.75, opacity: 0 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                      className="absolute inset-0 rounded-full border border-red-500/70"
                    />
                    <motion.div
                      key="pr2"
                      initial={{ scale: 1, opacity: 0.35 }}
                      animate={{ scale: 2.3, opacity: 0 }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut', delay: 0.3 }}
                      className="absolute inset-0 rounded-full border border-red-500/40"
                    />
                  </>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={canRecord ? { scale: 1.07 } : {}}
                whileTap={canRecord ? { scale: 0.91 } : {}}
                onClick={isRecording ? onStopRecording : onStartRecording}
                disabled={!canRecord}
                aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                className="relative w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-shadow"
                style={
                  isRecording
                    ? {
                        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                        boxShadow: '0 0 0 3px rgba(239,68,68,0.28), 0 0 32px rgba(239,68,68,0.4)',
                        border: '2px solid rgba(239,68,68,0.55)',
                      }
                    : {
                        background: 'linear-gradient(135deg, #4f63e8, #7c3aed)',
                        boxShadow: '0 0 0 3px rgba(99,102,241,0.22), 0 0 32px rgba(99,102,241,0.3)',
                        border: '2px solid rgba(99,102,241,0.45)',
                      }
                }
              >
                {isProcessing ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full"
                  />
                ) : (
                  <span className="text-2xl md:text-3xl leading-none">
                    {isRecording ? '⏹' : '🎙️'}
                  </span>
                )}
              </motion.button>
            </div>

            {/* Status badge */}
            <div className="flex flex-col items-start gap-0.5">
              <span className="text-[0.58rem] md:text-[0.62rem] text-slate-600 uppercase tracking-widest font-bold">
                Status
              </span>
              <div
                className={`flex items-center gap-2 px-3 md:px-3.5 py-1.5 md:py-2 rounded-full border text-xs font-semibold whitespace-nowrap ${
                  isProcessing
                    ? 'bg-yellow-500/10 border-yellow-500/25 text-yellow-300'
                    : isRecording
                    ? 'bg-red-500/10 border-red-500/25 text-red-300'
                    : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-300'
                }`}
              >
                <motion.span
                  animate={isRecording || isProcessing ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
                  transition={{ duration: 0.8, repeat: isRecording || isProcessing ? Infinity : 0 }}
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isProcessing ? 'bg-yellow-400' : isRecording ? 'bg-red-400' : 'bg-emerald-400'
                  }`}
                />
                <span>
                  {isProcessing
                    ? 'Processing...'
                    : isRecording
                    ? `Recording${confidence > 0 ? ` · ${Math.round(confidence * 100)}%` : ''}`
                    : 'Ready'}
                </span>
              </div>
            </div>
          </div>

          {/* Recording hint — desktop only */}
          <AnimatePresence>
            {isRecording && (
              <motion.p
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="hidden md:block text-slate-600 text-[0.7rem] text-center"
              >
                Press{' '}
                <kbd className="px-1.5 py-0.5 bg-white/[0.06] border border-white/[0.1] rounded text-slate-400 font-mono">
                  Space
                </kbd>{' '}
                or click stop to submit
              </motion.p>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right: Finish button ── */}
        <motion.button
          whileHover={canEnd ? { scale: 1.04 } : {}}
          whileTap={canEnd ? { scale: 0.96 } : {}}
          onClick={onFinishInterview}
          disabled={!canEnd}
          aria-label="Finish interview"
          className="flex-shrink-0 flex items-center gap-1.5 md:gap-2.5 rounded-xl font-semibold text-xs md:text-sm transition-all border disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            padding: 'clamp(8px, 2vw, 12px) clamp(12px, 3vw, 20px)',
            ...(canEnd
              ? {
                  background: 'linear-gradient(135deg, #059669, #047857)',
                  border: '1px solid rgba(16,185,129,0.4)',
                  boxShadow: '0 0 20px rgba(16,185,129,0.2)',
                  color: 'white',
                }
              : {
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'rgba(255,255,255,0.3)',
                }),
          }}
        >
          <svg className="w-3.5 h-3.5 md:w-4 md:h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          {/* Hide text on very small screens, show on sm+ */}
          <span className="hidden xs:inline">Finish</span>
          <span className="hidden md:inline"> Interview</span>
        </motion.button>
      </div>
    </div>
  );
}
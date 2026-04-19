'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarSectionProps {
  isListening: boolean;
  isSpeaking: boolean;
  currentMode: 'interviewer' | 'student';
  confidence?: number;
}

export function AvatarSection({
  isListening,
  isSpeaking,
  currentMode,
  confidence = 0,
}: AvatarSectionProps) {
  const isActive = isListening || isSpeaking;

  const modeConfig = {
    interviewer: {
      icon: '🤵',
      label: 'Interviewer',
      accent: '#7c3aed',
      accentRgb: '124,58,237',
      accentLight: 'rgba(124,58,237,0.25)',
      ring: 'rgba(124,58,237,0.45)',
      modeBadge: 'bg-violet-500/10 border-violet-500/20 text-violet-300',
      modeText: 'text-violet-400',
      barColor: 'from-violet-600 to-purple-400',
    },
    student: {
      icon: '🧒',
      label: 'Student',
      accent: '#d97706',
      accentRgb: '217,119,6',
      accentLight: 'rgba(217,119,6,0.25)',
      ring: 'rgba(217,119,6,0.45)',
      modeBadge: 'bg-amber-500/10 border-amber-500/20 text-amber-300',
      modeText: 'text-amber-400',
      barColor: 'from-amber-600 to-amber-400',
    },
  };

  const cfg = modeConfig[currentMode];

  type StatusKey = 'speaking' | 'listening' | 'idle';
  const statusConfig: Record<StatusKey, { label: string; color: string; dot: string }> = {
    speaking: {
      label: 'Speaking',
      color: 'bg-blue-500/10 border-blue-500/25 text-blue-300',
      dot: 'bg-blue-400',
    },
    listening: {
      label: 'Listening',
      color: 'bg-red-500/10 border-red-500/25 text-red-300',
      dot: 'bg-red-400',
    },
    idle: {
      label: 'Idle',
      color: 'bg-slate-500/10 border-slate-500/20 text-slate-500',
      dot: 'bg-slate-600',
    },
  };

  const statusKey: StatusKey = isSpeaking ? 'speaking' : isListening ? 'listening' : 'idle';
  const status = statusConfig[statusKey];

  return (
    <div className="flex flex-col items-center gap-6 md:gap-8 w-full select-none py-4">

      {/* ── Avatar Orb ── */}
      <div className="relative flex items-center justify-center">
        {/* Outer animated rings */}
        <AnimatePresence>
          {isActive && (
            <>
              <motion.div
                key="ring1"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [1, 1.4], opacity: [0.45, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut' }}
                className="absolute rounded-full border"
                style={{ width: 128, height: 128, borderColor: cfg.ring }}
              />
              <motion.div
                key="ring2"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [1, 1.75], opacity: [0.25, 0] }}
                transition={{ duration: 1.6, repeat: Infinity, ease: 'easeOut', delay: 0.45 }}
                className="absolute rounded-full border"
                style={{ width: 128, height: 128, borderColor: cfg.ring }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Core avatar circle */}
        <motion.div
          animate={isActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 2, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
          className="relative w-28 h-28 md:w-32 md:h-32 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 35% 30%, ${cfg.accentLight}, rgba(${cfg.accentRgb},0.4) 65%, rgba(${cfg.accentRgb},0.15))`,
            border: `2px solid ${cfg.ring}`,
            boxShadow: isActive
              ? `0 0 0 4px rgba(${cfg.accentRgb},0.15), 0 0 50px rgba(${cfg.accentRgb},0.3), inset 0 1px 0 rgba(255,255,255,0.1)`
              : `0 0 24px rgba(${cfg.accentRgb},0.2), inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          <span className="text-5xl md:text-6xl">{cfg.icon}</span>

          {/* Speaking wave bars */}
          <AnimatePresence>
            {isSpeaking && (
              <div className="absolute -bottom-4 flex items-end gap-0.5 justify-center">
                {[4, 7, 11, 7, 4].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [0.3, 1, 0.3] }}
                    transition={{ duration: 0.55, repeat: Infinity, delay: i * 0.09, ease: 'easeInOut' }}
                    className="w-1 rounded-full origin-bottom"
                    style={{ height: `${h}px`, background: cfg.accent, opacity: 0.85 }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* ── Name + status ── */}
      <div className="text-center flex flex-col items-center gap-2.5">
        <h3 className="text-xl md:text-2xl font-bold text-white tracking-tight">{cfg.label}</h3>

        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${status.color}`}>
          <motion.span
            animate={isActive ? { opacity: [1, 0.25, 1] } : { opacity: 1 }}
            transition={{ duration: 0.85, repeat: isActive ? Infinity : 0 }}
            className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${status.dot}`}
          />
          {status.label}
        </div>

        {/* Confidence bar */}
        <AnimatePresence>
          {isListening && confidence > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col items-center gap-1.5 w-full overflow-hidden"
            >
              <p className="text-slate-600 text-[0.65rem] uppercase tracking-widest font-semibold">
                Confidence
              </p>
              <div className="w-28 md:w-36 h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.round(confidence * 100)}%` }}
                  transition={{ duration: 0.3 }}
                  className={`h-full rounded-full bg-gradient-to-r ${cfg.barColor}`}
                />
              </div>
              <p className="text-white text-xs font-bold">{Math.round(confidence * 100)}%</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Mode card ── */}
      <div
        className="w-full max-w-[240px] md:max-w-full rounded-2xl px-5 py-4 border text-center"
        style={{
          background: `linear-gradient(135deg, rgba(${cfg.accentRgb},0.12), rgba(${cfg.accentRgb},0.04))`,
          borderColor: `rgba(${cfg.accentRgb},0.3)`,
        }}
      >
        <p className={`text-[0.6rem] uppercase tracking-widest font-bold mb-1.5 ${cfg.modeText}`}>
          Current Mode
        </p>
        <p className="text-white font-bold text-sm md:text-base capitalize">
          {currentMode} Mode
        </p>
      </div>

      {/* ── Ambient waveform (active only) ── */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.3 }}
            exit={{ opacity: 0 }}
            className="flex items-center justify-center gap-0.5 h-8"
          >
            {Array.from({ length: 20 }).map((_, i) => (
              <motion.div
                key={i}
                animate={{ scaleY: [0.3, 1, 0.3] }}
                transition={{
                  duration: 0.5 + (i % 5) * 0.1,
                  repeat: Infinity,
                  delay: i * 0.05,
                  ease: 'easeInOut',
                }}
                className="w-0.5 rounded-full origin-center"
                style={{ height: 24, background: cfg.accent }}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
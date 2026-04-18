'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AvatarSectionProps {
  isListening: boolean;
  isSpeaking: boolean;
  currentMode: 'interviewer' | 'student';
  confidence?: number;
}

export function AvatarSection({ isListening, isSpeaking, currentMode, confidence = 0 }: AvatarSectionProps) {
  const isActive = isListening || isSpeaking;

  const modeConfig = {
    interviewer: {
      icon: '🤵',
      label: 'Interviewer',
      accent: '#7c3aed',
      accentLight: 'rgba(124,58,237,0.3)',
      ring: 'rgba(124,58,237,0.5)',
      badge: 'bg-violet-500/15 border-violet-500/25 text-violet-300',
      activeBadge: 'bg-violet-500/25 border-violet-400/40 text-violet-200',
    },
    student: {
      icon: '🧒',
      label: 'Student',
      accent: '#d97706',
      accentLight: 'rgba(217,119,6,0.3)',
      ring: 'rgba(217,119,6,0.5)',
      badge: 'bg-amber-500/15 border-amber-500/25 text-amber-300',
      activeBadge: 'bg-amber-500/25 border-amber-400/40 text-amber-200',
    },
  };

  const cfg = modeConfig[currentMode];

  const statusConfig = {
    speaking: { label: 'Speaking', color: 'bg-blue-500/15 border-blue-500/25 text-blue-300', dot: 'bg-blue-400' },
    listening: { label: 'Listening', color: 'bg-red-500/15 border-red-500/25 text-red-300', dot: 'bg-red-400' },
    idle: { label: 'Idle', color: 'bg-slate-500/15 border-slate-500/25 text-slate-400', dot: 'bg-slate-500' },
  };

  const status = isSpeaking ? statusConfig.speaking : isListening ? statusConfig.listening : statusConfig.idle;

  return (
    <div className="flex flex-col items-center gap-8 select-none">

      {/* Avatar orb */}
      <div className="relative flex items-center justify-center">
        {/* Outer glow rings when active */}
        <AnimatePresence>
          {isActive && (
            <>
              <motion.div
                key="ring1"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [1, 1.35], opacity: [0.4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut' }}
                className="absolute w-36 h-36 rounded-full border"
                style={{ borderColor: cfg.ring }}
              />
              <motion.div
                key="ring2"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: [1, 1.6], opacity: [0.25, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeOut', delay: 0.4 }}
                className="absolute w-36 h-36 rounded-full border"
                style={{ borderColor: cfg.ring }}
              />
            </>
          )}
        </AnimatePresence>

        {/* Core avatar circle */}
        <motion.div
          animate={isActive ? { scale: [1, 1.04, 1] } : { scale: 1 }}
          transition={{ duration: 1.8, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
          className="relative w-28 h-28 rounded-full flex items-center justify-center"
          style={{
            background: `radial-gradient(circle at 35% 35%, ${cfg.accentLight}, ${cfg.accent}66 60%, ${cfg.accent}33)`,
            border: `2px solid ${cfg.ring}`,
            boxShadow: isActive
              ? `0 0 0 4px ${cfg.accentLight}, 0 0 40px ${cfg.accentLight}, inset 0 1px 0 rgba(255,255,255,0.1)`
              : `0 0 20px ${cfg.accentLight}, inset 0 1px 0 rgba(255,255,255,0.05)`,
          }}
        >
          <span className="text-5xl">{cfg.icon}</span>

          {/* Speaking wave bars */}
          <AnimatePresence>
            {isSpeaking && (
              <div className="absolute -bottom-3 flex items-end gap-0.5 justify-center">
                {[3, 6, 9, 6, 3].map((h, i) => (
                  <motion.div
                    key={i}
                    animate={{ scaleY: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.5, repeat: Infinity, delay: i * 0.08, ease: 'easeInOut' }}
                    className="w-1 rounded-full origin-bottom"
                    style={{ height: `${h}px`, background: cfg.accent, opacity: 0.8 }}
                  />
                ))}
              </div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Name + status */}
      <div className="text-center space-y-3">
        <h3 className="text-xl font-bold text-white tracking-tight">{cfg.label}</h3>

        {/* Status pill */}
        <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border text-xs font-semibold ${status.color}`}>
          <motion.span
            animate={isActive ? { opacity: [1, 0.3, 1] } : { opacity: 1 }}
            transition={{ duration: 0.8, repeat: isActive ? Infinity : 0 }}
            className={`w-1.5 h-1.5 rounded-full ${status.dot}`}
          />
          {status.label}
        </div>

        {/* Confidence */}
        <AnimatePresence>
          {isListening && confidence > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="flex flex-col items-center gap-1.5"
            >
              <p className="text-slate-500 text-[0.7rem] uppercase tracking-widest font-semibold">Confidence</p>
              <div className="w-24 h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: `${Math.round(confidence * 100)}%` }}
                  transition={{ duration: 0.3 }}
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${cfg.accent}, ${cfg.accent}cc)` }}
                />
              </div>
              <p className="text-white text-xs font-bold">{Math.round(confidence * 100)}%</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mode card */}
      <div
        className="w-full rounded-2xl px-5 py-4 border text-center"
        style={{
          background: `linear-gradient(135deg, ${cfg.accentLight}, transparent)`,
          borderColor: `${cfg.ring}`,
        }}
      >
        <p className="text-[0.65rem] uppercase tracking-widest font-bold mb-1.5" style={{ color: cfg.accent }}>
          Current Mode
        </p>
        <p className="text-white font-bold text-base capitalize">
          {currentMode} Mode
        </p>
      </div>
    </div>
  );
}
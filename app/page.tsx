'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { isValidEmail } from '@/utils/helpers';
import { POST } from '@/utils/api-client';
import type { Session } from '@/lib/types';

export default function Home() {
  const router = useRouter();
  const [candidateName, setCandidateName] = useState('');
  const [candidateEmail, setCandidateEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const handleStartInterview = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!candidateName.trim()) { setError('Please enter your name'); return; }
    if (!isValidEmail(candidateEmail)) { setError('Please enter a valid email'); return; }
    if (!subject.trim()) { setError('Please select a subject'); return; }

    setIsLoading(true);
    try {
      const response = await POST<Session>('/sessions', {
        candidateName: candidateName.trim(),
        candidateEmail: candidateEmail.trim().toLowerCase(),
        subject: subject.trim(),
      });
      if (!response.success || !response.data) throw new Error(response.error || 'Failed to create session');
      router.push(`/interview?sessionId=${response.data._id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: '🎙️', label: '~10 min voice interview' },
    { icon: '🧒', label: 'Real student simulation' },
    { icon: '📊', label: 'Teaching ability evaluation' },
    { icon: '✨', label: 'Instant detailed feedback' },
  ];

  return (
    <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4 relative overflow-hidden font-sans">

      {/* Background aurora */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-blue-700/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-700/10 blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-blue-950/20 blur-[100px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(rgba(99,102,241,1) 1px, transparent 1px), linear-gradient(90deg, rgba(99,102,241,1) 1px, transparent 1px)',
            backgroundSize: '60px 60px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 32 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-[440px]"
      >
        {/* Logo / Brand */}
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.6, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-violet-600 shadow-[0_0_40px_rgba(99,102,241,0.4)] mb-6"
          >
            <span className="text-3xl">🎓</span>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse" />
              <span className="text-blue-400 text-xs font-semibold tracking-widest uppercase">AI-Powered Screening</span>
            </div>
            <h1 className="text-[2.4rem] font-bold text-white tracking-tight leading-tight">
              AI Tutor Screener
            </h1>
            <p className="text-slate-400 mt-2 text-[0.95rem] leading-relaxed">
              Evaluate your teaching ability through<br />an adaptive AI interview
            </p>
          </motion.div>
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="bg-white/[0.03] backdrop-blur-sm border border-white/[0.08] rounded-2xl p-8 shadow-[0_0_80px_rgba(0,0,0,0.6)]"
        >
          <form onSubmit={handleStartInterview} className="space-y-5">

            {/* Name */}
            <div>
              <label className="block text-[0.8rem] font-semibold text-slate-400 mb-2 tracking-wider uppercase">
                Full Name
              </label>
              <div className={`relative rounded-xl transition-all duration-200 ${focusedField === 'name' ? 'shadow-[0_0_0_2px_rgba(99,102,241,0.5)]' : ''}`}>
                <input
                  type="text"
                  value={candidateName}
                  onChange={(e) => setCandidateName(e.target.value)}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Enter your full name"
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors text-[0.95rem] disabled:opacity-50"
                />
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-[0.8rem] font-semibold text-slate-400 mb-2 tracking-wider uppercase">
                Email Address
              </label>
              <input
                type="email"
                value={candidateEmail}
                onChange={(e) => setCandidateEmail(e.target.value)}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholder="you@example.com"
                disabled={isLoading}
                className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500/60 transition-colors text-[0.95rem] disabled:opacity-50"
              />
            </div>

            {/* Subject */}
            <div>
              <label className="block text-[0.8rem] font-semibold text-slate-400 mb-2 tracking-wider uppercase">
                Subject You Tutor
              </label>
              <div className="relative">
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  onFocus={() => setFocusedField('subject')}
                  onBlur={() => setFocusedField(null)}
                  disabled={isLoading}
                  className="w-full px-4 py-3.5 bg-white/[0.05] border border-white/[0.1] rounded-xl text-white focus:outline-none focus:border-indigo-500/60 transition-colors text-[0.95rem] disabled:opacity-50 appearance-none cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                >
                  <option value="" className="bg-[#0d0d1a]">Select a subject...</option>
                  <option value="Math" className="bg-[#0d0d1a]">Math</option>
                  <option value="English" className="bg-[#0d0d1a]">English</option>
                  <option value="Science" className="bg-[#0d0d1a]">Science</option>
                  <option value="History" className="bg-[#0d0d1a]">History</option>
                  <option value="Languages" className="bg-[#0d0d1a]">Languages</option>
                  <option value="Other" className="bg-[#0d0d1a]">Other</option>
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-3 px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
                >
                  <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Submit */}
            <motion.button
              whileHover={!isLoading ? { scale: 1.015 } : {}}
              whileTap={!isLoading ? { scale: 0.985 } : {}}
              type="submit"
              disabled={isLoading}
              className="relative w-full py-4 mt-2 rounded-xl font-semibold text-white text-[0.95rem] overflow-hidden disabled:opacity-60 disabled:cursor-not-allowed transition-opacity"
              style={{
                background: isLoading
                  ? 'linear-gradient(135deg, #3b4fd8, #6d28d9)'
                  : 'linear-gradient(135deg, #4f63e8, #7c3aed)',
                boxShadow: '0 0 30px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.1)',
              }}
            >
              {/* Shimmer */}
              {!isLoading && (
                <motion.div
                  animate={{ x: ['-100%', '200%'] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'linear', repeatDelay: 1 }}
                  className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-12"
                />
              )}
              <span className="relative flex items-center justify-center gap-2">
                {isLoading ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="inline-block">⟳</motion.span>
                    Preparing Interview...
                  </>
                ) : (
                  <>
                    <span>Start Interview</span>
                    <span>→</span>
                  </>
                )}
              </span>
            </motion.button>
          </form>
        </motion.div>

        {/* Features row */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="grid grid-cols-2 gap-3 mt-4"
        >
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 + i * 0.07 }}
              className="flex items-center gap-2.5 bg-white/[0.025] border border-white/[0.06] rounded-xl px-3.5 py-3"
            >
              <span className="text-lg">{f.icon}</span>
              <span className="text-slate-400 text-xs font-medium leading-tight">{f.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
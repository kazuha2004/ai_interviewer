'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

interface ResultsClientProps {
  sessionId: string;
}

export function ResultsClient({ sessionId }: ResultsClientProps) {
  const router = useRouter();
  const [evaluation, setEvaluation] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEvaluation = async () => {
      try {
        const response = await fetch(`/api/sessions/${sessionId}`);
        if (!response.ok) throw new Error('Failed to load session');
        const data = await response.json();
        if (data.data?.evaluation) {
          setEvaluation(data.data.evaluation);
        } else {
          throw new Error('No evaluation found');
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load results');
      } finally {
        setIsLoading(false);
      }
    };
    fetchEvaluation();
  }, [sessionId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 rounded-full border-2 border-indigo-500/30 border-t-indigo-500"
        />
        <p className="text-slate-500 text-sm">Loading your results...</p>
      </div>
    );
  }

  if (error || !evaluation) {
    return (
      <div className="min-h-screen bg-[#050508] flex items-center justify-center p-4">
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-8 max-w-md text-center">
          <div className="text-5xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-white mb-2">Results Unavailable</h2>
          <p className="text-slate-400 text-sm mb-6">{error || 'Evaluation not found'}</p>
          <button onClick={() => router.push('/')} className="px-6 py-3 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.1] rounded-xl text-white text-sm font-semibold transition">
            ← Back to Home
          </button>
        </div>
      </div>
    );
  }

  const overallScore = evaluation.overall?.score || 0;
  const dims = [
    { key: 'clarity', label: 'Clarity', icon: '💡', color: '#eab308', glow: 'rgba(234,179,8,0.2)', border: 'rgba(234,179,8,0.25)' },
    { key: 'patience', label: 'Patience', icon: '⏳', color: '#22c55e', glow: 'rgba(34,197,94,0.2)', border: 'rgba(34,197,94,0.25)' },
    { key: 'adaptability', label: 'Adaptability', icon: '🔄', color: '#a78bfa', glow: 'rgba(167,139,250,0.2)', border: 'rgba(167,139,250,0.25)' },
    { key: 'warmth', label: 'Warmth', icon: '❤️', color: '#f87171', glow: 'rgba(248,113,113,0.2)', border: 'rgba(248,113,113,0.25)' },
  ];

  const scoreColor = (s: number) => s >= 8 ? '#22c55e' : s >= 6 ? '#eab308' : '#f87171';
  const scoreLabel = (s: number) => s >= 8 ? 'Excellent' : s >= 6 ? 'Good' : s >= 4 ? 'Fair' : 'Needs Work';

  return (
    <div className="min-h-screen bg-[#050508] py-12 px-4 relative overflow-hidden">

      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[400px] bg-indigo-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-violet-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-4 py-1.5 mb-5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-indigo-400 text-xs font-semibold tracking-widest uppercase">Evaluation Complete</span>
          </div>
          <h1 className="text-4xl font-bold text-white tracking-tight mb-2">Interview Results</h1>
          <p className="text-slate-500">Your tutoring assessment has been analysed by AI</p>
        </motion.div>

        {/* Overall Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.08 }}
          className="rounded-2xl p-8 mb-6 border relative overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(124,58,237,0.08))',
            borderColor: 'rgba(99,102,241,0.3)',
            boxShadow: '0 0 60px rgba(99,102,241,0.12)',
          }}
        >
          {/* Decorative circle */}
          <div className="absolute right-6 top-6 w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-4xl opacity-60">
            🏆
          </div>

          <div className="pr-28">
            <p className="text-indigo-400 text-xs font-bold uppercase tracking-widest mb-3">Overall Score</p>
            <div className="flex items-end gap-4 mb-4">
              <span className="text-7xl font-bold text-white leading-none">{overallScore}</span>
              <span className="text-3xl text-slate-500 font-light mb-2">/10</span>
              <span
                className="mb-2 px-3 py-1 rounded-full text-xs font-bold border"
                style={{ color: scoreColor(overallScore), borderColor: scoreColor(overallScore) + '40', background: scoreColor(overallScore) + '15' }}
              >
                {scoreLabel(overallScore)}
              </span>
            </div>

            {/* Overall bar */}
            <div className="w-full h-2 bg-white/[0.06] rounded-full overflow-hidden mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallScore * 10}%` }}
                transition={{ delay: 0.4, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, #4f63e8, #7c3aed)` }}
              />
            </div>

            <p className="text-slate-300 text-sm leading-relaxed">
              {evaluation.overall?.summary || 'Your teaching evaluation is complete.'}
            </p>
          </div>
        </motion.div>

        {/* 4 Dimension Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {dims.map((d, idx) => {
            const score = evaluation[d.key]?.score || 0;
            return (
              <motion.div
                key={d.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + idx * 0.08 }}
                className="rounded-2xl p-6 border relative overflow-hidden group"
                style={{
                  background: `linear-gradient(135deg, ${d.glow}, rgba(8,8,15,0.8))`,
                  borderColor: d.border,
                }}
              >
                {/* Top row */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs uppercase tracking-widest font-bold mb-2" style={{ color: d.color + 'aa' }}>
                      {d.label}
                    </p>
                    <div className="flex items-end gap-1.5">
                      <span className="text-4xl font-bold text-white leading-none">{score}</span>
                      <span className="text-slate-500 text-lg mb-0.5">/10</span>
                    </div>
                  </div>
                  <span className="text-3xl">{d.icon}</span>
                </div>

                {/* Bar */}
                <div className="w-full h-1.5 bg-black/30 rounded-full overflow-hidden mb-4">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${score * 10}%` }}
                    transition={{ delay: 0.5 + idx * 0.08, duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="h-full rounded-full"
                    style={{ background: d.color }}
                  />
                </div>

                {/* Justification */}
                {evaluation[d.key]?.justification && (
                  <p className="text-slate-300 text-[0.82rem] leading-relaxed mb-3">
                    {evaluation[d.key].justification}
                  </p>
                )}

                {/* Quotes */}
                {evaluation[d.key]?.quotes?.length > 0 && (
                  <div className="border-t border-white/[0.06] pt-3 mt-3 space-y-1.5">
                    <p className="text-[0.65rem] uppercase tracking-widest font-bold text-slate-600">Supporting quotes</p>
                    {evaluation[d.key].quotes.slice(0, 2).map((q: string, i: number) => (
                      <p key={i} className="text-slate-400 text-xs italic pl-2 border-l-2" style={{ borderColor: d.color + '50' }}>
                        "{q}"
                      </p>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Strengths & Areas for Growth */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          {/* Strengths */}
          <motion.div
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="rounded-2xl p-6 border"
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.08), rgba(8,8,15,0.9))', borderColor: 'rgba(16,185,129,0.2)' }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-lg">✅</div>
              <h3 className="font-bold text-white text-base">Strengths</h3>
            </div>
            <ul className="space-y-2.5">
              {evaluation.overall?.strengths?.map((s: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Areas for Growth */}
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.55 }}
            className="rounded-2xl p-6 border"
            style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.08), rgba(8,8,15,0.9))', borderColor: 'rgba(245,158,11,0.2)' }}
          >
            <div className="flex items-center gap-3 mb-5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-lg">⚠️</div>
              <h3 className="font-bold text-white text-base">Areas for Growth</h3>
            </div>
            <ul className="space-y-2.5">
              {evaluation.overall?.weaknesses?.map((w: string, i: number) => (
                <li key={i} className="flex items-start gap-2.5 text-slate-300 text-sm">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 flex-shrink-0" />
                  {w}
                </li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.65 }}
          className="rounded-2xl p-6 border mb-8"
          style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(8,8,15,0.9))', borderColor: 'rgba(99,102,241,0.2)' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-lg">🎯</div>
            <h3 className="font-bold text-white text-base">Recommendations</h3>
          </div>
          <div className="space-y-3">
            {evaluation.overall?.recommendations?.map((r: string, i: number) => (
              <div key={i} className="flex items-start gap-3 text-slate-300 text-sm">
                <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 text-xs font-bold flex items-center justify-center">
                  {i + 1}
                </span>
                {r}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={() => router.push('/')}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white border border-white/[0.1] bg-white/[0.05] hover:bg-white/[0.09] transition"
          >
            ← Back to Home
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl font-semibold text-sm text-white border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/15 transition"
          >
            🖨️ Print Results
          </button>
        </motion.div>
      </div>
    </div>
  );
}
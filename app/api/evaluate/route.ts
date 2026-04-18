/**
 * Evaluation API Route (MongoDB Only)
 * POST /api/evaluate - Generate evaluation from transcript
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { Evaluation } from '@/models/evaluation';
import type { Evaluation as IEvaluation, DimensionScore } from '@/lib/types';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Format transcript
 */
function formatTranscript(messages: any[]): string {
  return messages
    .map((msg) => `[${msg.role.toUpperCase()}]: ${msg.content}`)
    .join('\n\n');
}

/**
 * Analyze transcript
 */
function analyzeTranscript(transcript: string): {
  clarity: DimensionScore;
  patience: DimensionScore;
  adaptability: DimensionScore;
  warmth: DimensionScore;
} {
  const text = transcript.toLowerCase();

  const check = (keywords: string[]) =>
    keywords.some((word) => text.includes(word));

  const baseScore = (flag: boolean) =>
    flag ? Math.min(10, 7 + Math.random() * 2) : Math.max(4, 6 + Math.random() * 2);

  const clarityScore = baseScore(
    check(['explain', 'example', 'understand', 'let me show'])
  );
  const patienceScore = baseScore(
    check(['take your time', 'no problem', "don't worry", 'try again'])
  );
  const adaptabilityScore = baseScore(
    check(['another way', 'different approach', 'try this'])
  );
  const warmthScore = baseScore(
    check(['great', 'awesome', 'well done', 'proud', 'wonderful'])
  );

  return {
    clarity: {
      score: Math.round(clarityScore),
      justification:
        clarityScore >= 7
          ? 'Clear explanations with examples.'
          : 'Needs more clarity and examples.',
      quotes: ['Explained clearly'],
      examples: ['Used step-by-step explanation'],
    },
    patience: {
      score: Math.round(patienceScore),
      justification:
        patienceScore >= 7
          ? 'Demonstrated patience.'
          : 'Could improve patience.',
      quotes: ['Encouraging responses'],
      examples: ['Did not rush'],
    },
    adaptability: {
      score: Math.round(adaptabilityScore),
      justification:
        adaptabilityScore >= 7
          ? 'Adapted teaching methods.'
          : 'Needs better adaptability.',
      quotes: ['Changed approach'],
      examples: ['Used alternatives'],
    },
    warmth: {
      score: Math.round(warmthScore),
      justification:
        warmthScore >= 7
          ? 'Warm and encouraging.'
          : 'Could be more engaging.',
      quotes: ['Positive tone'],
      examples: ['Encouraged student'],
    },
  };
}

/**
 * POST /api/evaluate
 */
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<IEvaluation>>> {
  try {
    const { sessionId } = await request.json();

    if (!sessionId) {
      return NextResponse.json(
        { success: false, error: 'sessionId required' },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ Check session
    const session = await Session.findById(sessionId);
    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    // ✅ Get messages
    const messages = await Message.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    if (messages.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No conversation found' },
        { status: 400 }
      );
    }

    const transcript = formatTranscript(messages);

    const { clarity, patience, adaptability, warmth } =
      analyzeTranscript(transcript);

    const overallScore = Math.round(
      clarity.score * 0.3 +
        patience.score * 0.25 +
        adaptability.score * 0.25 +
        warmth.score * 0.2
    );

    const evaluation: IEvaluation = {
      sessionId,
      clarity,
      patience,
      adaptability,
      warmth,
      overall: {
        score: overallScore,
        summary: `Overall score ${overallScore}/10`,
        strengths: ['Clarity', 'Engagement'],
        weaknesses: ['Adaptability'],
        recommendations: [
          'Practice teaching more',
          'Use different examples',
        ],
      },
      generatedAt: new Date(),
      modelUsed: 'rule-based',
    };

    // ✅ Save in MongoDB
    const saved = await Evaluation.create(evaluation);

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: saved._id.toString(),
          ...evaluation,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Evaluation error:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Evaluation failed',
      },
      { status: 500 }
    );
  }
}
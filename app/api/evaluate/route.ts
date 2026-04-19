import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/models/message';
import { Evaluation } from '@/models/evaluation';

// 🔥 CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { sessionId } = await req.json();

    await connectDB();

    const messages = await Message.find({ sessionId }).lean();

    // 🧠 FILTER USER ANSWERS
    const userMessages = messages.filter(m => m.role === "user");

    // 🧠 BASIC ANALYSIS
    const totalAnswers = userMessages.length;
    const totalWords = userMessages.reduce(
      (acc, msg) => acc + msg.content.split(" ").length,
      0
    );

    const avgWords = totalAnswers > 0 ? totalWords / totalAnswers : 0;

    // 🧠 KEYWORD CHECK
    const keywords = ["example", "explain", "step", "student", "understand", "teach"];
    const keywordHits = userMessages.reduce((count, msg) => {
      const text = msg.content.toLowerCase();
      return count + keywords.filter(k => text.includes(k)).length;
    }, 0);

    // 🎯 SCORING LOGIC (simple but meaningful)

    const clarity = Math.min(10, Math.floor(avgWords / 5) + Math.floor(keywordHits / 2));
    const patience = Math.min(10, totalAnswers + 2);
    const adaptability = Math.min(10, Math.floor(keywordHits / 2) + 3);
    const warmth = Math.min(10, Math.floor(avgWords / 6) + 2);

    const overall = Math.round(
      (clarity * 0.3 + patience * 0.25 + adaptability * 0.25 + warmth * 0.2)
    );

    const evaluationData = {
      sessionId,
      clarity: { score: clarity },
      patience: { score: patience },
      adaptability: { score: adaptability },
      warmth: { score: warmth },
      overall: { score: overall }
    };

    const evaluation = await Evaluation.findOneAndUpdate(
      { sessionId },
      evaluationData,
      { upsert: true, new: true }
    );

    return new Response(JSON.stringify({ success: true, data: evaluation }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch (error) {
    console.error("Evaluation ERROR:", error);

    return new Response(JSON.stringify({ success: false, error: "Evaluation failed" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
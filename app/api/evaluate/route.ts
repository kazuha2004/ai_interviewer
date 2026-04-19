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

    const score = Math.floor(Math.random() * 10) + 1;

    const evaluation = await Evaluation.findOneAndUpdate(
      { sessionId },
      { sessionId, score },
      { upsert: true, new: true }
    );

    return new Response(JSON.stringify({ success: true, data: evaluation }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch {
    return new Response(JSON.stringify({ success: false, error: "Evaluation failed" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
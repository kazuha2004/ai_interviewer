import { connectDB } from '@/lib/mongodb';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { Evaluation } from '@/models/evaluation';
import { NextRequest } from 'next/server';

// 🔥 CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

// ✅ GET
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await connectDB();

    const session = await Session.findById(id).lean();
    if (!session) {
      return new Response(JSON.stringify({ success: false, error: "Session not found" }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    const messages = await Message.find({ sessionId: id }).sort({ timestamp: 1 }).lean();
    const evaluation = await Evaluation.findOne({ sessionId: id }).lean();

    return new Response(JSON.stringify({
      success: true,
      data: {
        ...session,
        messages,
        evaluation,
      },
    }), { status: 200, headers: corsHeaders });

  } catch {
    return new Response(JSON.stringify({ success: false, error: "Failed to fetch session" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}

// ✅ PUT
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await req.json();

    await connectDB();

    const updated = await Session.findByIdAndUpdate(id, body, { new: true }).lean();

    return new Response(JSON.stringify({ success: true, data: updated }), {
      status: 200,
      headers: corsHeaders,
    });

  } catch {
    return new Response(JSON.stringify({ success: false, error: "Update failed" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
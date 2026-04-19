import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Message } from '@/models/message';

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
    const { userMessage, sessionId } = await req.json();

    await connectDB();

    const reply = "AI Response Example";

    await Message.create({
      sessionId,
      role: "assistant",
      content: reply,
      timestamp: new Date(),
    });

    return new Response(reply, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain",
      },
    });

  } catch {
    return new Response(JSON.stringify({ error: "Conversation failed" }), {
      status: 500,
      headers: corsHeaders,
    });
  }
}
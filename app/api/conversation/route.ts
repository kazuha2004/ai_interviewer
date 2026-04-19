import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Message } from "@/models/message";

// 🔥 CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const { userMessage, sessionId, mode } = await req.json();

    if (!sessionId) {
      return new Response(JSON.stringify({ error: "Missing sessionId" }), {
        status: 400,
      });
    }

    await connectDB();

    // 🔥 Save USER message
    await Message.create({
      sessionId,
      role: "user",
      content: userMessage,
      timestamp: new Date(),
    });

    // 🔥 Get conversation history
    const history = await Message.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    // 🔥 CREATE CONTEXT STRING
    const conversationContext = history
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n");

    // 🔥 SYSTEM PROMPT (based on mode)
    let systemPrompt = "";

    if (mode === "student") {
      systemPrompt = `
You are a curious 9-year-old student.
Ask simple questions.
Be confused sometimes.
Keep answers short.
`;
    } else {
      systemPrompt = `
You are a professional tutor interviewer.
Ask thoughtful teaching questions.
Evaluate teaching ability.
Guide the conversation naturally.
`;
    }

    // 🔥 FAKE AI (for now, replace later with Claude)
    const reply = generateReply(systemPrompt, conversationContext, userMessage);

    // 🔥 Save AI message
    await Message.create({
      sessionId,
      role: mode === "student" ? "student" : "interviewer",
      content: reply,
      timestamp: new Date(),
    });

    // 🔥 STREAM RESPONSE
    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        for (let i = 0; i < reply.length; i++) {
          controller.enqueue(encoder.encode(reply[i]));
          await new Promise((r) => setTimeout(r, 15));
        }
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/plain; charset=utf-8",
      },
    });

  } catch (error) {
    console.error("Conversation ERROR:", error);

    return new Response(
      JSON.stringify({ error: "Conversation failed" }),
      { status: 500, headers: corsHeaders }
    );
  }
}

// 🔥 SIMPLE AI LOGIC (TEMPORARY)
function generateReply(systemPrompt: string, context: string, userMessage: string) {
  if (systemPrompt.includes("9-year-old")) {
    return "I don’t understand… can you explain it more simply?";
  }

  return "That’s interesting. Can you explain how you would teach this to a beginner?";
}
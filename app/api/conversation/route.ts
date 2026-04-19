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

    // 🔥 UPDATED AI LOGIC
    const reply = generateReply(systemPrompt, conversationContext, userMessage, history);

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

// 🔥 IMPROVED AI LOGIC (NO REPETITION)
function generateReply(
  systemPrompt: string,
  context: string,
  userMessage: string,
  history: any[]
) {
  // 🧒 STUDENT MODE
  if (systemPrompt.includes("9-year-old")) {
    const studentResponses = [
      "Wait… I don’t get it. Can you explain it more simply?",
      "Why does that happen?",
      "Can you give me a real example?",
      "I’m still confused about that part…",
      "Ohh… but why can’t it be something else?"
    ];

    return randomPick(studentResponses);
  }

  // 🧠 INTERVIEWER MODE

  const interviewerResponses = [
    "That’s interesting — can you give me a real example of how you'd apply that with a student?",
    "I like that approach. How do you know if the student actually understood it?",
    "You mentioned simplifying concepts — how would you handle a student who is frustrated?",
    "What would you do if your explanation still didn’t work?",
    "How do you adapt this for different types of learners?",
    "Can you walk me through this step-by-step in a real teaching scenario?",
    "What signs tell you a student is still confused?",
    "How would you build confidence in a weak student here?",
  ];

  let reply = randomPick(interviewerResponses);

  // 🚫 PREVENT REPETITION
  const lastInterviewerMsgs = history
    .filter((m) => m.role === "interviewer")
    .map((m) => m.content.toLowerCase());

  let attempts = 0;

  while (
    lastInterviewerMsgs.some((msg) => msg.includes(reply.toLowerCase().slice(0, 20))) &&
    attempts < 5
  ) {
    reply = randomPick(interviewerResponses);
    attempts++;
  }

  return reply;
}

// 🎲 RANDOM PICK HELPER
function randomPick(arr: string[]) {
  return arr[Math.floor(Math.random() * arr.length)];
}
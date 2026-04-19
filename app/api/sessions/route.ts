import { NextRequest } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { Session } from "@/models/session";

// 🔥 CORS HEADERS (reuse everywhere)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // you can restrict later
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// 🔥 HANDLE PREFLIGHT (VERY IMPORTANT)
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}

// ✅ GET SESSIONS
export async function GET() {
  try {
    await connectDB();

    const sessions = await Session.find().sort({ createdAt: -1 });

    return new Response(JSON.stringify({ success: true, data: sessions }), {
      status: 200,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to fetch sessions" }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}

// ✅ CREATE SESSION
export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const body = await req.json();

    const session = await Session.create(body);

    return new Response(JSON.stringify({ success: true, data: session }), {
      status: 201,
      headers: corsHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: "Failed to create session" }),
      {
        status: 500,
        headers: corsHeaders,
      }
    );
  }
}
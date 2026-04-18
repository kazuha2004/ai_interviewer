/**
 * Conversation API Route
 * POST /api/conversation - Stream Claude responses
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { streamClaudeResponse, isClaudeConfigured } from '@/services/claude';
import type { InterviewMode } from '@/lib/types';

export async function POST(request: NextRequest): Promise<Response> {
  try {
    // ✅ Check Claude API
    if (!isClaudeConfigured()) {
      return new NextResponse(
        JSON.stringify({ error: 'Claude API not configured' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { userMessage, sessionId, mode } = body;

    // ✅ Validation
    if (!userMessage || !sessionId || !mode) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!['interviewer', 'student'].includes(mode)) {
      return new NextResponse(
        JSON.stringify({ error: 'Invalid mode' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Connect DB
    await connectDB();

    // ✅ Check session
    const session = await Session.findById(sessionId);
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: 'Session not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Get conversation history
    const conversationHistory = await Message.find({ sessionId })
      .sort({ timestamp: 1 })
      .lean();

    // ✅ Save user message
    await Message.create({
      sessionId,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
      metadata: { isFinal: true },
    });

    // ✅ Update message count
    session.totalMessages += 1;
    await session.save();

    // ✅ Streaming setup
    const encoder = new TextEncoder();
    let fullResponse = '';

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamClaudeResponse(
            userMessage,
            conversationHistory as any[],
            mode as InterviewMode
          )) {
            fullResponse += chunk;
            controller.enqueue(encoder.encode(chunk));
          }

          // ✅ Save AI response after stream ends
          const aiRole = mode === 'interviewer' ? 'interviewer' : 'student';

          await Message.create({
            sessionId,
            role: aiRole,
            content: fullResponse,
            timestamp: new Date(),
            metadata: { isFinal: true },
          });

          // ✅ Update message count again
          session.totalMessages += 1;
          await session.save();

          controller.close();
        } catch (error) {
          console.error('Stream error:', error);
          controller.error(error);
        }
      },
    });

    return new NextResponse(stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('Conversation API error:', error);

    return new NextResponse(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
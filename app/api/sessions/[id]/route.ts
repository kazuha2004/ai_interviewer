/**
 * Session Detail API Routes
 * GET /api/sessions/[id]
 * PUT /api/sessions/[id]
 */

import { connectDB } from '@/lib/mongodb';
import { Session } from '@/models/session';
import { Message } from '@/models/message';
import { Evaluation } from '@/models/evaluation';
import { NextRequest, NextResponse } from 'next/server';
import type {
  Session as ISession,
  Message as IMessage,
  Evaluation as IEvaluation,
  ApiResponse,
} from '@/lib/types';

interface SessionWithMessages extends ISession {
  messages?: IMessage[];
  evaluation?: IEvaluation;
}

// ✅ GET SESSION
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<SessionWithMessages>>> {
  try {
    const { id } = await params; // ✅ FIXED

    await connectDB();

    const session = await Session.findById(id).lean();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    const messages = await Message.find({ sessionId: id })
      .sort({ timestamp: 1 })
      .lean();

    const evaluation = await Evaluation.findOne({ sessionId: id }).lean();

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: session._id.toString(),
          candidateEmail: session.candidateEmail,
          candidateName: session.candidateName,
          subject: session.subject,
          status: session.status,
          startedAt: session.startedAt,
          endedAt: session.endedAt,
          duration: session.duration,
          totalMessages: session.totalMessages,
          currentMode: session.currentMode,
          messages: messages.map((msg) => ({
            sessionId: msg.sessionId,
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            speechConfidence: msg.speechConfidence,
            metadata: msg.metadata,
          })),
          evaluation: evaluation || undefined,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching session:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
}

// ✅ UPDATE SESSION
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ISession>>> {
  try {
    const { id } = await params; // ✅ FIXED
    const body = await request.json();
    const { status, currentMode, endedAt } = body;

    await connectDB();

    let updateData: any = {};

    // ✅ Handle completion
    if (status === 'completed' && endedAt) {
      const session = await Session.findById(id);

      if (!session) {
        return NextResponse.json(
          { success: false, error: 'Session not found' },
          { status: 404 }
        );
      }

      const durationMs =
        new Date(endedAt).getTime() - session.startedAt.getTime();

      updateData = {
        status,
        endedAt: new Date(endedAt),
        duration: Math.floor(durationMs / 1000),
      };
    }

    if (currentMode) {
      updateData.currentMode = currentMode;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedSession = await Session.findByIdAndUpdate(id, updateData, {
      new: true,
    }).lean();

    if (!updatedSession) {
      return NextResponse.json(
        { success: false, error: 'Session not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: updatedSession._id.toString(),
          candidateEmail: updatedSession.candidateEmail,
          candidateName: updatedSession.candidateName,
          subject: updatedSession.subject,
          status: updatedSession.status,
          startedAt: updatedSession.startedAt,
          endedAt: updatedSession.endedAt,
          duration: updatedSession.duration,
          totalMessages: updatedSession.totalMessages,
          currentMode: updatedSession.currentMode,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating session:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to update session' },
      { status: 500 }
    );
  }
}
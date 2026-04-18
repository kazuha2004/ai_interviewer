/**
 * Session API Routes - CRUD operations
 * POST /api/sessions - Create new session
 */

import { connectDB } from '@/lib/mongodb';
import { Session } from '@/models/session';
import { NextRequest, NextResponse } from 'next/server';
import type { Session as ISession, ApiResponse } from '@/lib/types';

// POST /api/sessions - Create a new interview session
export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<ISession>>> {
  try {
    await connectDB(); // ✅ Always connect

    const body = await request.json();
    const { candidateEmail, candidateName, subject } = body;

    // ✅ Validation
    if (!candidateEmail || !candidateName || !subject) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // ✅ Create session in MongoDB
    const session = await Session.create({
      candidateEmail,
      candidateName,
      subject,
      status: 'in-progress',
      startedAt: new Date(),
      totalMessages: 0,
      currentMode: 'interviewer',
    });

    return NextResponse.json(
      {
        success: true,
        data: {
          _id: session._id.toString(), // ✅ always string
          candidateEmail: session.candidateEmail,
          candidateName: session.candidateName,
          subject: session.subject,
          status: session.status,
          startedAt: session.startedAt,
          totalMessages: session.totalMessages,
          currentMode: session.currentMode,
        },
        message: 'Session created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error creating session:', error);

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create session',
      },
      { status: 500 }
    );
  }
}
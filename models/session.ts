/**
 * Mongoose Schema for Interview Sessions
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { SessionStatus } from '@/lib/types';

interface SessionDocument extends Document {
  candidateEmail: string;
  candidateName: string;
  subject: string;
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  duration?: number;
  totalMessages: number;
  currentMode: 'interviewer' | 'student';
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new Schema<SessionDocument>(
  {
    candidateEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    candidateName: {
      type: String,
      required: true,
      trim: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['in-progress', 'completed', 'abandoned'],
      default: 'in-progress',
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    endedAt: {
      type: Date,
      default: null,
    },
    duration: {
      type: Number,
      default: null,
    },
    totalMessages: {
      type: Number,
      default: 0,
    },
    currentMode: {
      type: String,
      enum: ['interviewer', 'student'],
      default: 'interviewer',
    },
  },
  { timestamps: true }
);

// Index for fast queries
sessionSchema.index({ candidateEmail: 1 });
sessionSchema.index({ status: 1 });
sessionSchema.index({ createdAt: -1 });

export const Session: Model<SessionDocument> =
  mongoose.models.Session || mongoose.model<SessionDocument>('Session', sessionSchema);

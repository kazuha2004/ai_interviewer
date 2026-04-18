/**
 * Mongoose Schema for Conversation Messages
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { MessageRole } from '@/lib/types';

interface MessageDocument extends Document {
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  speechConfidence?: number;
  metadata?: {
    isFinal?: boolean;
    tokenCount?: number;
  };
  createdAt: Date;
}

const messageSchema = new Schema<MessageDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['user', 'interviewer', 'student'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    speechConfidence: {
      type: Number,
      min: 0,
      max: 1,
      default: null,
    },
    metadata: {
      isFinal: Boolean,
      tokenCount: Number,
    },
  },
  { timestamps: true }
);

// Compound index for fast session retrieval
messageSchema.index({ sessionId: 1, timestamp: 1 });
messageSchema.index({ sessionId: 1, role: 1 });

export const Message: Model<MessageDocument> =
  mongoose.models.Message || mongoose.model<MessageDocument>('Message', messageSchema);

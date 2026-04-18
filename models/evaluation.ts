/**
 * Mongoose Schema for Evaluations
 */

import mongoose, { Schema, Document, Model } from 'mongoose';
import type { Evaluation as IEvaluation, DimensionScore } from '@/lib/types';

interface EvaluationDocument extends Document {
  sessionId: string;
  clarity: DimensionScore;
  patience: DimensionScore;
  adaptability: DimensionScore;
  warmth: DimensionScore;
  overall: {
    score: number;
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  generatedAt: Date;
  modelUsed: string;
  createdAt: Date;
  updatedAt: Date;
}

const dimensionScoreSchema = new Schema(
  {
    score: {
      type: Number,
      min: 0,
      max: 10,
      required: true,
    },
    justification: {
      type: String,
      required: true,
    },
    quotes: [String],
    examples: [String],
  },
  { _id: false }
);

const evaluationSchema = new Schema<EvaluationDocument>(
  {
    sessionId: {
      type: String,
      required: true,
      unique: true,
    },
    clarity: dimensionScoreSchema,
    patience: dimensionScoreSchema,
    adaptability: dimensionScoreSchema,
    warmth: dimensionScoreSchema,
    overall: {
      score: {
        type: Number,
        min: 0,
        max: 10,
        required: true,
      },
      summary: {
        type: String,
        required: true,
      },
      strengths: [String],
      weaknesses: [String],
      recommendations: [String],
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    modelUsed: {
      type: String,
      default: 'claude-3-5-sonnet-20241022',
    },
  },
  { timestamps: true }
);

// Index for fast retrieval
evaluationSchema.index({ sessionId: 1 });
evaluationSchema.index({ createdAt: -1 });

export const Evaluation: Model<EvaluationDocument> =
  mongoose.models.Evaluation ||
  mongoose.model<EvaluationDocument>('Evaluation', evaluationSchema);

/**
 * Core TypeScript type definitions for AI Tutor Screener
 */

export type InterviewMode = 'interviewer' | 'student';
export type MessageRole = 'user' | 'interviewer' | 'student';
export type SessionStatus = 'in-progress' | 'completed' | 'abandoned';

// ============ SESSION ============
export interface Session {
  _id?: string; // MongoDB ID
  candidateEmail: string;
  candidateName: string;
  subject: string; // Subject being tutored (e.g., "Math", "English", "Science")
  status: SessionStatus;
  startedAt: Date;
  endedAt?: Date;
  duration?: number; // In seconds
  totalMessages: number;
  currentMode: InterviewMode;
}

// ============ MESSAGE ============
export interface Message {
  sessionId: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  speechConfidence?: number; // 0-1, from Web Speech API
  metadata?: {
    isFinal?: boolean;
    tokenCount?: number;
  };
}

// ============ CONVERSATION ============
export interface ConversationRequest {
  userMessage: string;
  sessionId: string;
  mode: InterviewMode;
  conversationHistory: Message[];
}

export interface ConversationResponse {
  response: string;
  mode: InterviewMode;
  isComplete: boolean;
  updatedHistory?: Message[];
}

// ============ EVALUATION ============
export interface DimensionScore {
  score: number; // 0-10
  justification: string;
  quotes: string[];
  examples: string[];
}

export interface Evaluation {
  sessionId: string;
  clarity: DimensionScore;
  patience: DimensionScore;
  adaptability: DimensionScore;
  warmth: DimensionScore;
  overall: {
    score: number; // 0-10, weighted average
    summary: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  generatedAt: Date;
  modelUsed: string;
}

export interface EvaluationRequest {
  sessionId: string;
  transcript: Message[];
  candidateName?: string;
  subject?: string;
}

// ============ API RESPONSES ============
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface StreamResponse {
  chunk: string;
  isComplete: boolean;
  modelUsed?: string;
}

// ============ CONVERSATION CONTEXT ============
export interface ConversationContext {
  sessionId: string;
  mode: InterviewMode;
  messages: Message[];
  candidateName: string;
  subject: string;
}

// ============ VOICE STATE ============
export interface VoiceState {
  isListening: boolean;
  isSpeaking: boolean;
  transcript: string;
  isFinal: boolean;
  error: string | null;
  confidence: number;
}

// ============ AUDIO PERMISSIONS ============
export interface MicrophonePermissionState {
  status: 'granted' | 'denied' | 'prompt' | 'unknown';
  browsers: {
    chrome: boolean;
    firefox: boolean;
    safari: boolean;
    edge: boolean;
  };
}

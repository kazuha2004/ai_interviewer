/**
 * Mock In-Memory Database
 * Replaces MongoDB for testing without requiring external DB connection
 * Data persists only during dev server session
 */

import type { Session, Message, Evaluation } from './types';

interface MockSession extends Session {
  _id: string;
}

interface MockMessage extends Message {
  _id: string;
}

interface MockEvaluation extends Evaluation {
  _id: string;
}

// In-memory storage - declared at module level to persist across requests
const sessionsStore = new Map<string, MockSession>();
const messagesStore = new Map<string, MockMessage[]>();
const evaluationsStore = new Map<string, MockEvaluation>();

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// Session operations
export const mockDB = {
  // Sessions
  async createSession(data: Omit<Session, 'createdAt' | 'updatedAt'>): Promise<MockSession> {
    const id = generateId();
    const session: MockSession = {
      _id: id,
      ...data,
    };
    sessionsStore.set(id, session);
    messagesStore.set(id, []);
    console.log('[MockDB] ✅ Created session:', id);
    console.log('[MockDB] Sessions store now has', sessionsStore.size, 'sessions');
    return session;
  },

  async getSession(id: string): Promise<(MockSession & { messages: MockMessage[] }) | null> {
    console.log('[MockDB] 🔍 Looking for session:', id);
    console.log('[MockDB] Stored sessions:', Array.from(sessionsStore.keys()));
    const session = sessionsStore.get(id);
    if (!session) {
      console.log('[MockDB] ❌ Session not found:', id);
      return null;
    }
    const messages = messagesStore.get(id) || [];
    console.log('[MockDB] ✅ Retrieved session:', id, `with ${messages.length} messages`);
    return { ...session, messages };
  },

  async updateSession(
    id: string,
    updates: Partial<Session>
  ): Promise<MockSession | null> {
    const session = sessionsStore.get(id);
    if (!session) return null;

    const updated: MockSession = {
      ...session,
      ...updates,
      _id: id,
    };
    sessionsStore.set(id, updated);
    console.log('[MockDB] Updated session:', id);
    return updated;
  },

  // Messages
  async createMessage(
    sessionId: string,
    data: Omit<Message, 'timestamp' | 'sessionId'>
  ): Promise<MockMessage> {
    const id = generateId();
    const message: MockMessage = {
      _id: id,
      sessionId,
      ...data,
      timestamp: new Date(),
    };

    const messages = messagesStore.get(sessionId) || [];
    messages.push(message);
    messagesStore.set(sessionId, messages);

    console.log('[MockDB] Created message:', id, `in session ${sessionId}`);
    return message;
  },

  async getMessages(sessionId: string): Promise<MockMessage[]> {
    const messages = messagesStore.get(sessionId) || [];
    console.log('[MockDB] Retrieved', messages.length, `messages from session ${sessionId}`);
    return messages;
  },

  // Evaluations
  async createEvaluation(data: Evaluation): Promise<MockEvaluation> {
    const id = generateId();
    const evaluation: MockEvaluation = {
      _id: id,
      ...data,
    };
    evaluationsStore.set(data.sessionId, evaluation);
    console.log('[MockDB] Created evaluation for session:', data.sessionId);
    return evaluation;
  },

  async getEvaluation(sessionId: string): Promise<MockEvaluation | null> {
    const evaluation = evaluationsStore.get(sessionId);
    if (!evaluation) {
      console.log('[MockDB] Evaluation not found for session:', sessionId);
      return null;
    }
    console.log('[MockDB] Retrieved evaluation for session:', sessionId);
    return evaluation;
  },

  // Debug utilities
  getStats() {
    return {
      sessions: sessionsStore.size,
      totalMessages: Array.from(messagesStore.values()).reduce(
        (sum, msgs) => sum + msgs.length,
        0
      ),
      evaluations: evaluationsStore.size,
    };
  },

  clearAll() {
    sessionsStore.clear();
    messagesStore.clear();
    evaluationsStore.clear();
    console.log('[MockDB] All data cleared');
  },
};

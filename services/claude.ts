/**
 * Claude API Service - Wrapper around Anthropic API
 * Handles conversation streaming, context management, and response generation
 */

import { getSystemPrompt } from '@/lib/prompts';
import type { Message as IMessage, InterviewMode } from '@/lib/types';

interface StreamHandler {
  onChunk: (text: string) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

// Demo mode responses - use when API key is invalid
const DEMO_RESPONSES = {
  interviewer_opening: `Hello! Welcome to the tutoring assessment. My name is Sarah, and I'm here to evaluate your teaching capabilities today. I'm really interested in learning about your approach to education.

Before we dive into scenarios, could you tell me a bit about yourself? Specifically:
- How long have you been tutoring?
- What subjects or age groups do you typically work with?
- What made you interested in tutoring?`,

  interviewer_followup_1: `That's great background! I appreciate your experience. Now let me ask you about your teaching approach.

Imagine you're tutoring a 9-year-old who has never learned fractions before. They seem a bit intimidated by the concept. How would you introduce fractions to them? Walk me through your first lesson.`,

  student_opening: `Hi! Um... I'm not really good at math. Can you help me understand fractions? My teacher said something about 1/2 and 1/4 but I didn't really get it... Is it hard?`,

  student_reaction_confused: `But... why would you cut it into pieces? That doesn't make sense. Why can't we just have the whole thing? And what if I cut the pizza into 5 pieces instead of 4? Is that still a fraction?`,

  student_reaction_happy: `Oh! OH! I get it now... so like, if I eat 2 slices out of 8, I ate 2/8? That makes sense! Can you show me with something else though? Like... maybe a chocolate bar?`,
};

function generateDemoResponse(mode: InterviewMode, messageCount: number): string {
  if (mode === 'interviewer') {
    if (messageCount === 0) return DEMO_RESPONSES.interviewer_opening;
    if (messageCount === 2) return DEMO_RESPONSES.interviewer_followup_1;
    
    // Vary responses based on message count to avoid repetition
    const followupQuestions = [
      `That's an interesting approach. Can you elaborate on the strategy you mentioned? How would you handle it if the student still didn't understand?`,
      `I like that perspective. Tell me more - what would you do differently if you noticed the student was getting frustrated or losing confidence?`,
      `That sounds promising. How do you balance being patient with moving the lesson forward when you have limited time?`,
      `I see. Can you give me a specific example from your tutoring experience where this approach helped a student succeed?`,
      `That's thoughtful. How do you adapt your teaching style for students with different learning preferences - visual, auditory, hands-on?`,
    ];
    return followupQuestions[messageCount % followupQuestions.length];
  } else {
    // Student mode
    if (messageCount === 0) return DEMO_RESPONSES.student_opening;
    if (messageCount >= 2 && messageCount % 4 === 2) return DEMO_RESPONSES.student_reaction_confused;
    if (messageCount >= 4 && messageCount % 4 === 0) return DEMO_RESPONSES.student_reaction_happy;
    
    const studentResponses = [
      `Hmm, I'm still confused. Can you explain it in a different way? Maybe with a picture or something?`,
      `I don't think I get it yet... Is there an easier way to think about this?`,
      `Wait, but what if... I don't know, I'm just not following you.`,
      `Can you explain why we even need to do this? When would I use it?`,
      `I'm trying to understand but my brain is tired. Can we take a break or try again?`,
    ];
    return studentResponses[messageCount % studentResponses.length];
  }
}

/**
 * Convert message history to Claude API format
 */
function convertMessagesToClaudeFormat(
  messages: IMessage[]
): Array<{ role: 'user' | 'assistant'; content: string }> {
  return messages
    .filter((msg) => msg.role !== 'interviewer' && msg.role !== 'student') // Filter out metadata
    .map((msg) => ({
      role: (msg.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: msg.content,
    }));
}

/**
 * Get relevant conversation context (last N messages to stay within token window)
 * Claude 3.5 Sonnet has 200k token context window
 */
function getContextWindow(messages: IMessage[], maxMessages: number = 20): IMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }
  return messages.slice(-maxMessages);
}

/**
 * Stream a response from Claude
 * Yields chunks as they become available
 * Falls back to demo mode if API key is invalid
 */
export async function* streamClaudeResponse(
  userMessage: string,
  conversationHistory: IMessage[],
  mode: InterviewMode,
  onChunk?: (text: string) => void
): AsyncGenerator<string, void, unknown> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    // Use demo mode if no API key or placeholder
    if (!apiKey || apiKey.includes('placeholder')) {
      console.log('[DEMO MODE] Using mock responses (no valid API key)');
      const demoResponse = generateDemoResponse(mode, conversationHistory.length);
      
      // Simulate streaming by sending response in chunks
      for (let i = 0; i < demoResponse.length; i += 10) {
        const chunk = demoResponse.substring(i, i + 10);
        onChunk?.(chunk);
        yield chunk;
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      return;
    }

    console.log('[REAL CLAUDE API] Using live Claude responses');
    console.log('[API] Conversation history length:', conversationHistory.length);
    console.log('[API] Mode:', mode);

    const systemPrompt = getSystemPrompt(mode);
    const contextMessages = getContextWindow(conversationHistory);
    const claudeMessages = convertMessagesToClaudeFormat(contextMessages);

    // Add current user message
    claudeMessages.push({
      role: 'user',
      content: userMessage,
    });

    // Call Claude streaming API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
        stream: true,
      }),
    });

    if (!response.ok) {
      console.log(`[FALLBACK] Claude API error (${response.statusText}), using demo mode`);
      const demoResponse = generateDemoResponse(mode, conversationHistory.length);
      
      // Simulate streaming
      for (let i = 0; i < demoResponse.length; i += 10) {
        const chunk = demoResponse.substring(i, i + 10);
        onChunk?.(chunk);
        yield chunk;
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('Response body is not readable');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');

      // Process complete lines
      for (let i = 0; i < lines.length - 1; i++) {
        const line = lines[i];

        if (!line.startsWith('data: ')) continue;

        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const json = JSON.parse(data);
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
            const text = json.delta.text;
            onChunk?.(text);
            yield text;
          }
        } catch (e) {
          // Ignore parse errors on individual events
        }
      }

      buffer = lines[lines.length - 1];
    }

    // Flush remaining buffer
    if (buffer && buffer.startsWith('data: ')) {
      const data = buffer.slice(6);
      if (data !== '[DONE]') {
        try {
          const json = JSON.parse(data);
          if (json.type === 'content_block_delta' && json.delta?.type === 'text_delta') {
            onChunk?.(json.delta.text);
            yield json.delta.text;
          }
        } catch (e) {
          // Ignore parse errors
        }
      }
    }
  } catch (error) {
    console.error('Error streaming from Claude:', error);
    throw error;
  }
}

/**
 * Get complete response from Claude (non-streaming)
 * Useful for evaluation endpoint
 */
export async function getClaudeResponse(
  userMessage: string,
  conversationHistory: IMessage[],
  mode: InterviewMode
): Promise<string> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    
    // Use demo mode if no API key
    if (!apiKey || apiKey.includes('placeholder')) {
      console.log('[DEMO MODE] Using mock evaluation');
      return generateDemoResponse(mode, conversationHistory.length);
    }

    const systemPrompt = getSystemPrompt(mode);
    const contextMessages = getContextWindow(conversationHistory);
    const claudeMessages = convertMessagesToClaudeFormat(contextMessages);

    claudeMessages.push({
      role: 'user',
      content: userMessage,
    });

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'content-type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 1024,
        system: systemPrompt,
        messages: claudeMessages,
      }),
    });

    if (!response.ok) {
      console.log(`[FALLBACK] Claude API error, using demo response`);
      return generateDemoResponse(mode, conversationHistory.length);
    }

    const data = (await response.json()) as any;
    const textContent = data.content?.find((block: any) => block.type === 'text');

    return textContent?.text || '';
  } catch (error) {
    console.error('Error getting Claude response:', error);
    // Return demo response as fallback
    return `I understand. Let me help you think through that more carefully.`;
  }
}

/**
 * Verify Claude API key is configured (or demo mode is enabled)
 */
export function isClaudeConfigured(): boolean {
  // Always return true - demo mode is available as fallback
  return true;
}

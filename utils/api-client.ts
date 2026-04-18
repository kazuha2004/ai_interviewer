/**
 * API client for making requests to backend endpoints
 */

import { ApiResponse } from '@/lib/types';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

/**
 * Generic fetch wrapper with error handling
 */
async function apiCall<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    const responseData = await response.json();
    
    // Handle both wrapped (with success/data fields) and unwrapped responses
    const isWrapped = responseData.hasOwnProperty('success') && responseData.hasOwnProperty('data');
    
    return {
      success: true,
      data: isWrapped ? responseData.data : (responseData as T),
      message: responseData.message,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Make a GET request
 */
export async function GET<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, { method: 'GET' });
}

/**
 * Make a POST request
 */
export async function POST<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * Make a PUT request
 */
export async function PUT<T>(endpoint: string, body: unknown): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * Make a DELETE request
 */
export async function DELETE<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiCall<T>(endpoint, { method: 'DELETE' });
}

/**
 * Stream endpoint (for conversation)
 */
export async function streamEndpoint(
  endpoint: string,
  body: unknown,
  onChunk: (chunk: string) => void,
  onError: (error: Error) => void
): Promise<void> {
  try {
    const response = await fetch(`${API_BASE}/api${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
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

      // Process complete lines (if using newline-delimited data)
      const lines = buffer.split('\n');
      buffer = lines.pop() || ''; // Keep incomplete line in buffer

      for (const line of lines) {
        if (line.trim()) {
          onChunk(line);
        }
      }
    }

    // Flush remaining buffer
    if (buffer.trim()) {
      onChunk(buffer);
    }
  } catch (error) {
    onError(error instanceof Error ? error : new Error(String(error)));
  }
}

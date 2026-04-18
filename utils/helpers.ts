/**
 * Utility functions for voice and audio handling
 */

/**
 * Request microphone permission from the browser
 */
export async function requestMicrophonePermission(): Promise<boolean> {
  try {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    return true;
  } catch (error) {
    console.error('Microphone permission denied:', error);
    return false;
  }
}

/**
 * Check if Web Speech API is supported in browser
 */
export function isWebSpeechSupported(): boolean {
  const SpeechRecognition =
    typeof window !== 'undefined' &&
    ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  return !!SpeechRecognition;
}

/**
 * Check if SpeechSynthesis is supported
 */
export function isSpeechSynthesisSupported(): boolean {
  return typeof window !== 'undefined' && !!window.speechSynthesis;
}

/**
 * Get available voices for speech synthesis
 */
export function getAvailableVoices(): SpeechSynthesisVoice[] {
  if (!isSpeechSynthesisSupported()) return [];
  return window.speechSynthesis.getVoices();
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Truncate text to a certain length
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

/**
 * Format date to readable string
 */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}

/**
 * Validate email format
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Sleep for specified milliseconds (for debugging/testing)
 */
export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

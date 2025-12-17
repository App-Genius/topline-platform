/**
 * OpenRouter AI Client
 *
 * Uses the OpenAI SDK with OpenRouter as the base URL.
 * OpenRouter provides access to various LLMs through a unified API.
 *
 * Setup:
 * 1. Get an API key from https://openrouter.ai/
 * 2. Add OPENROUTER_API_KEY to your .env file
 */

import OpenAI from 'openai';
import { DEFAULT_MODEL, MODEL_CONFIG } from './config';

// Initialize OpenAI client pointing to OpenRouter
export const openrouter = new OpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
  defaultHeaders: {
    'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'X-Title': 'Topline',
  },
});

/**
 * Check if the OpenRouter API key is configured
 */
export function isConfigured(): boolean {
  return !!process.env.OPENROUTER_API_KEY;
}

/**
 * Generate a completion with the default model
 */
export async function generateCompletion(
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  if (!isConfigured()) {
    throw new Error('OpenRouter API key not configured. Add OPENROUTER_API_KEY to your .env file.');
  }

  const messages: OpenAI.ChatCompletionMessageParam[] = [];

  if (options?.systemPrompt) {
    messages.push({
      role: 'system',
      content: options.systemPrompt,
    });
  }

  messages.push({
    role: 'user',
    content: prompt,
  });

  const response = await openrouter.chat.completions.create({
    model: options?.model || DEFAULT_MODEL,
    messages,
    max_tokens: options?.maxTokens || MODEL_CONFIG.maxTokens,
    temperature: options?.temperature ?? MODEL_CONFIG.temperature,
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from AI model');
  }

  return content;
}

/**
 * Generate a structured response (JSON) with schema validation
 */
export async function generateStructured<T>(
  prompt: string,
  options?: {
    model?: string;
    maxTokens?: number;
    temperature?: number;
    systemPrompt?: string;
  }
): Promise<T> {
  if (!isConfigured()) {
    throw new Error('OpenRouter API key not configured. Add OPENROUTER_API_KEY to your .env file.');
  }

  const systemPrompt = `${options?.systemPrompt || ''}

IMPORTANT: You must respond with valid JSON only. Do not include any text before or after the JSON.
Do not use markdown code blocks. Just output the raw JSON object.`;

  const messages: OpenAI.ChatCompletionMessageParam[] = [
    {
      role: 'system',
      content: systemPrompt,
    },
    {
      role: 'user',
      content: prompt,
    },
  ];

  const response = await openrouter.chat.completions.create({
    model: options?.model || DEFAULT_MODEL,
    messages,
    max_tokens: options?.maxTokens || MODEL_CONFIG.maxTokens,
    temperature: options?.temperature ?? 0.5, // Lower temp for structured output
    response_format: { type: 'json_object' },
  });

  const content = response.choices[0]?.message?.content;

  if (!content) {
    throw new Error('No response from AI model');
  }

  try {
    return JSON.parse(content) as T;
  } catch {
    // If JSON parsing fails, try to extract JSON from the response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    throw new Error(`Failed to parse AI response as JSON: ${content.substring(0, 100)}`);
  }
}

/**
 * Generate with retry logic for transient failures
 */
export async function generateWithRetry<T>(
  generator: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await generator();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Don't retry on configuration errors
      if (lastError.message.includes('API key not configured')) {
        throw lastError;
      }

      // Don't retry on the last attempt
      if (attempt === maxRetries) {
        break;
      }

      // Wait before retrying (exponential backoff)
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }

  throw lastError || new Error('Failed after retries');
}

/**
 * Track token usage for cost management
 */
export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  model: string;
  timestamp: Date;
}

// In-memory token tracking (would be persisted in production)
const tokenUsageLog: TokenUsage[] = [];

export function logTokenUsage(usage: TokenUsage): void {
  tokenUsageLog.push(usage);

  // Keep only last 1000 entries in memory
  if (tokenUsageLog.length > 1000) {
    tokenUsageLog.shift();
  }
}

export function getTokenUsage(since?: Date): TokenUsage[] {
  if (!since) {
    return [...tokenUsageLog];
  }
  return tokenUsageLog.filter((u) => u.timestamp >= since);
}

export function getTotalTokens(since?: Date): number {
  return getTokenUsage(since).reduce((sum, u) => sum + u.totalTokens, 0);
}

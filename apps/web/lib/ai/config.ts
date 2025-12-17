/**
 * AI Configuration
 *
 * Configuration for OpenRouter AI client.
 * OpenRouter provides access to various LLMs including Claude, GPT, etc.
 */

// Default model to use for AI operations
export const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

// Alternative models for different use cases
export const MODELS = {
  // Fast, efficient for simple tasks
  FAST: 'anthropic/claude-3-haiku',
  // Balanced for most tasks
  BALANCED: 'anthropic/claude-3.5-sonnet',
  // Most capable for complex reasoning
  POWERFUL: 'anthropic/claude-3-opus',
  // GPT alternatives
  GPT_4: 'openai/gpt-4-turbo',
  GPT_35: 'openai/gpt-3.5-turbo',
} as const;

// Model configuration
export const MODEL_CONFIG = {
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.9,
} as const;

// Rate limiting configuration (requests per minute)
export const RATE_LIMITS = {
  DEFAULT: 60,
  AI_SUGGESTIONS: 10,
  AI_INSIGHTS: 20,
} as const;

// Token tracking configuration
export const TOKEN_TRACKING = {
  enabled: true,
  dailyBudget: 100000, // tokens per day per organization
  alertThreshold: 0.8, // alert at 80% usage
} as const;

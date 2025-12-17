/**
 * AI Module
 *
 * Provides AI capabilities via OpenRouter.
 * Uses the OpenAI SDK with OpenRouter as the base URL.
 */

export {
  openrouter,
  isConfigured,
  generateCompletion,
  generateStructured,
  generateWithRetry,
  logTokenUsage,
  getTokenUsage,
  getTotalTokens,
  type TokenUsage,
} from './client';

export {
  DEFAULT_MODEL,
  MODELS,
  MODEL_CONFIG,
  RATE_LIMITS,
  TOKEN_TRACKING,
} from './config';

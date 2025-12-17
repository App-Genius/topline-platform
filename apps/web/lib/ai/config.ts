/**
 * AI Configuration
 *
 * Configuration for OpenRouter AI client.
 * OpenRouter provides access to various LLMs including Claude, GPT, Gemini, etc.
 *
 * Model IDs follow the format: provider/model-name
 * See: https://openrouter.ai/models for full list
 *
 * Updated: December 2025 with latest model IDs
 */

// ============================================
// MODEL DEFINITIONS (2025 Current)
// ============================================

// Anthropic Claude Models
export const CLAUDE_MODELS = {
  CLAUDE_4_SONNET: 'anthropic/claude-sonnet-4', // Latest Claude Sonnet
  CLAUDE_4_5_SONNET: 'anthropic/claude-sonnet-4.5', // Most capable Sonnet
  CLAUDE_3_7_SONNET: 'anthropic/claude-3.7-sonnet', // Strong coding model
  CLAUDE_3_7_SONNET_THINKING: 'anthropic/claude-3.7-sonnet:thinking', // With reasoning
  CLAUDE_3_5_SONNET: 'anthropic/claude-3.5-sonnet', // Reliable general purpose
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku', // Fast, efficient
} as const;

// OpenAI GPT Models
export const GPT_MODELS = {
  GPT_4O: 'openai/gpt-4o', // Flagship multimodal
  GPT_4O_MINI: 'openai/gpt-4o-mini', // Fast, cost-effective
  GPT_4_TURBO: 'openai/gpt-4-turbo', // High capability
  O1: 'openai/o1', // Reasoning model
  O1_MINI: 'openai/o1-mini', // Faster reasoning
} as const;

// Google Gemini Models
export const GEMINI_MODELS = {
  GEMINI_2_5_PRO: 'google/gemini-2.5-pro-preview', // Most capable
  GEMINI_2_5_FLASH: 'google/gemini-2.5-flash', // Fast, capable
  GEMINI_2_5_FLASH_LITE: 'google/gemini-2.5-flash-lite', // Fastest, cheapest
  GEMINI_2_0_FLASH: 'google/gemini-2.0-flash-001', // Stable release
} as const;

// Meta Llama Models (open source)
export const LLAMA_MODELS = {
  LLAMA_3_2_90B: 'meta-llama/llama-3.2-90b-vision-instruct', // Vision capable
  LLAMA_3_1_405B: 'meta-llama/llama-3.1-405b-instruct', // Most capable
  LLAMA_3_1_70B: 'meta-llama/llama-3.1-70b-instruct', // Great balance
} as const;

// DeepSeek Models (cost-effective)
export const DEEPSEEK_MODELS = {
  DEEPSEEK_V3: 'deepseek/deepseek-chat', // Latest DeepSeek
  DEEPSEEK_REASONER: 'deepseek/deepseek-reasoner', // Reasoning focused
} as const;

// ============================================
// USE CASE CONFIGURATIONS
// ============================================

/**
 * Models organized by use case - select based on task requirements
 */
export const MODELS = {
  // Fast, cheap - for simple classifications, quick responses
  FAST: GPT_MODELS.GPT_4O_MINI,

  // Balanced - good for most tasks (default)
  BALANCED: CLAUDE_MODELS.CLAUDE_3_5_SONNET,

  // Powerful - for complex reasoning, code generation
  POWERFUL: CLAUDE_MODELS.CLAUDE_4_5_SONNET,

  // Reasoning - for step-by-step thinking tasks
  REASONING: CLAUDE_MODELS.CLAUDE_3_7_SONNET_THINKING,

  // Cost-effective - when budget is a concern
  BUDGET: GEMINI_MODELS.GEMINI_2_5_FLASH_LITE,

  // Quality judge - for evaluating other AI outputs
  JUDGE: GPT_MODELS.GPT_4O,

  // Vision capable - for image analysis (receipts, etc.)
  VISION: GPT_MODELS.GPT_4O,
} as const;

// Default model for most operations
export const DEFAULT_MODEL = MODELS.BALANCED;

// ============================================
// MODEL CONFIGURATION
// ============================================

export const MODEL_CONFIG = {
  // Default parameters
  maxTokens: 4096,
  temperature: 0.7,
  topP: 0.9,

  // Use case specific temperatures
  temperatures: {
    structured: 0.3, // For JSON/structured output
    creative: 0.8, // For suggestions, recommendations
    deterministic: 0.0, // For classifications
    balanced: 0.7, // Default
  },
} as const;

// ============================================
// RATE LIMITING & COST
// ============================================

export const RATE_LIMITS = {
  DEFAULT: 60, // requests per minute
  AI_SUGGESTIONS: 10,
  AI_INSIGHTS: 20,
  AI_JUDGE: 5, // LLM-as-judge operations
} as const;

export const TOKEN_TRACKING = {
  enabled: true,
  dailyBudget: 100000, // tokens per day per organization
  alertThreshold: 0.8, // alert at 80% usage
} as const;

// Cost per 1K tokens (approximate, update as pricing changes)
// Source: https://openrouter.ai/models
export const TOKEN_COSTS: Record<string, { input: number; output: number }> = {
  // Anthropic
  'anthropic/claude-sonnet-4.5': { input: 0.003, output: 0.015 },
  'anthropic/claude-sonnet-4': { input: 0.003, output: 0.015 },
  'anthropic/claude-3.7-sonnet': { input: 0.003, output: 0.015 },
  'anthropic/claude-3.5-sonnet': { input: 0.003, output: 0.015 },
  'anthropic/claude-3-haiku': { input: 0.00025, output: 0.00125 },

  // OpenAI
  'openai/gpt-4o': { input: 0.0025, output: 0.01 },
  'openai/gpt-4o-mini': { input: 0.00015, output: 0.0006 },
  'openai/gpt-4-turbo': { input: 0.01, output: 0.03 },

  // Google
  'google/gemini-2.5-pro-preview': { input: 0.00125, output: 0.005 },
  'google/gemini-2.5-flash': { input: 0.000075, output: 0.0003 },
  'google/gemini-2.5-flash-lite': { input: 0.000038, output: 0.00015 },
};

/**
 * Calculate cost for an AI operation
 */
export function calculateCost(
  model: string,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = TOKEN_COSTS[model] ?? { input: 0.003, output: 0.015 }; // Default to Claude pricing
  return (inputTokens * costs.input + outputTokens * costs.output) / 1000;
}

// ============================================
// QUALITY CONFIGURATION
// ============================================

export const QUALITY_CONFIG = {
  // LLM-as-Judge settings
  judge: {
    enabled: true,
    minScoreThreshold: 70, // 0-100 scale
    operationsToJudge: ['behavior_suggestion', 'insight_generation'],
  },

  // Self-reflection settings
  selfReflection: {
    enabled: true,
    maxReflectionAttempts: 2,
  },

  // Assertion settings
  assertions: {
    enabled: true,
    failOnWarning: false,
  },
} as const;

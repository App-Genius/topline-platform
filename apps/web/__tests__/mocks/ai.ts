/**
 * Mock AI Client for Testing
 *
 * Provides mock implementations of the AI client functions
 * to avoid OpenAI SDK initialization issues in tests.
 */

import { vi } from 'vitest';

// Mock OpenAI client instance
export const mockOpenRouter = {
  chat: {
    completions: {
      create: vi.fn().mockResolvedValue({
        choices: [
          {
            message: {
              content: JSON.stringify({ success: true }),
            },
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      }),
    },
  },
};

// Mock configuration check
export const mockIsConfigured = vi.fn().mockReturnValue(true);

// Mock completion generation
export const mockGenerateCompletion = vi.fn().mockResolvedValue('Mock AI response');

// Mock structured generation
export const mockGenerateStructured = vi.fn().mockResolvedValue({ success: true });

// Mock retry wrapper
export const mockGenerateWithRetry = vi.fn().mockImplementation(async (generator) => {
  return await generator();
});

// Token usage tracking mocks
export const mockLogTokenUsage = vi.fn();
export const mockGetTokenUsage = vi.fn().mockReturnValue([]);
export const mockGetTotalTokens = vi.fn().mockReturnValue(0);

// Behavior suggestions mock
export const mockGenerateBehaviorSuggestions = vi.fn().mockResolvedValue({
  behaviors: [
    {
      name: 'Suggest Premium Wine',
      description: 'Recommend wine pairings to enhance the dining experience',
      category: 'REVENUE',
      points: 10,
    },
  ],
});

// Quality evaluation mock
export const mockEvaluateBehaviorQuality = vi.fn().mockResolvedValue({
  score: 85,
  feedback: 'Good behavior suggestion',
  isValid: true,
});

/**
 * Reset all mocks - call in beforeEach or afterEach
 */
export function resetAIMocks(): void {
  mockOpenRouter.chat.completions.create.mockClear();
  mockIsConfigured.mockClear();
  mockGenerateCompletion.mockClear();
  mockGenerateStructured.mockClear();
  mockGenerateWithRetry.mockClear();
  mockLogTokenUsage.mockClear();
  mockGetTokenUsage.mockClear();
  mockGetTotalTokens.mockClear();
  mockGenerateBehaviorSuggestions.mockClear();
  mockEvaluateBehaviorQuality.mockClear();
}

/**
 * Configure mock to simulate API errors
 */
export function mockAIError(error: string = 'AI API Error'): void {
  mockGenerateCompletion.mockRejectedValueOnce(new Error(error));
  mockGenerateStructured.mockRejectedValueOnce(new Error(error));
}

/**
 * Configure mock to simulate not configured state
 */
export function mockNotConfigured(): void {
  mockIsConfigured.mockReturnValueOnce(false);
  mockGenerateCompletion.mockRejectedValueOnce(
    new Error('OpenRouter API key not configured')
  );
}

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBudget } from "@/hooks/queries";
import { createWrapper } from "../../utils/test-wrapper";

// Mock the auth context to always return authenticated
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: "1", name: "Test User" } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("useBudget", () => {
  it("fetches budget data successfully", async () => {
    const { result } = renderHook(() => useBudget(), {
      wrapper: createWrapper(),
    });

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for data (the hook returns demo data)
    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    // Should have budget data
    expect(result.current.data).toBeDefined();
  });

  it("returns budget with expected structure", async () => {
    const { result } = renderHook(() => useBudget(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    const data = result.current.data;
    expect(data).toHaveProperty("period");
    expect(data).toHaveProperty("summary");
    expect(data).toHaveProperty("categories");
    expect(data).toHaveProperty("alerts");
  });

  it("includes budget summary with financial metrics", async () => {
    const { result } = renderHook(() => useBudget(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    const summary = result.current.data?.summary;
    expect(summary?.totalBudget).toBeDefined();
    expect(summary?.totalActual).toBeDefined();
    expect(summary?.variance).toBeDefined();
    expect(typeof summary?.totalBudget).toBe("number");
  });

  it("includes budget categories as array", async () => {
    const { result } = renderHook(() => useBudget(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(Array.isArray(result.current.data?.categories)).toBe(true);
    expect(result.current.data?.categories?.length).toBeGreaterThan(0);
  });

  it("accepts period parameter", async () => {
    const { result } = renderHook(() => useBudget("2024-Q3"), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(result.current.data).toBeDefined();
  });
});

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useInsights, useRefreshInsights } from "@/hooks/queries";
import { createWrapper } from "../../utils/test-wrapper";

// Mock the auth context
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: "1", name: "Test User" } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("useInsights", () => {
  it("fetches insights successfully", async () => {
    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(result.current.data).toBeDefined();
  });

  it("returns insights with expected structure", async () => {
    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    const data = result.current.data;
    expect(data).toHaveProperty("summary");
    expect(data).toHaveProperty("trainingRecommendations");
    expect(data).toHaveProperty("costRecommendations");
    expect(data).toHaveProperty("performanceInsights");
  });

  it("includes summary with health metrics", async () => {
    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    const summary = result.current.data?.summary;
    expect(summary?.overallHealth).toBeDefined();
    expect(summary?.opportunities).toBeDefined();
    expect(summary?.actions).toBeDefined();
  });

  it("includes training recommendations as array", async () => {
    const { result } = renderHook(() => useInsights(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(Array.isArray(result.current.data?.trainingRecommendations)).toBe(true);
  });
});

describe("useRefreshInsights", () => {
  it("returns mutation function", () => {
    const { result } = renderHook(() => useRefreshInsights(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("refreshes insights successfully", async () => {
    const { result } = renderHook(() => useRefreshInsights(), {
      wrapper: createWrapper(),
    });

    result.current.mutate();

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 5000 }
    );

    expect(result.current.data).toBeDefined();
    expect(result.current.data?.lastUpdated).toBeDefined();
  });
});

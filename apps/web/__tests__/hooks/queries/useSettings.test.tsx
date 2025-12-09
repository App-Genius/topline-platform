import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useSettings, useUpdateSettings } from "@/hooks/queries";
import { createWrapper } from "../../utils/test-wrapper";

// Mock the auth context
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: "1", name: "Test User" } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("useSettings", () => {
  it("fetches settings successfully", async () => {
    const { result } = renderHook(() => useSettings(), {
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

  it("returns settings with expected structure", async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    const data = result.current.data;
    expect(data).toHaveProperty("organization");
    expect(data).toHaveProperty("scoreboard");
    expect(data).toHaveProperty("notifications");
  });

  it("includes notification settings", async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    const notifications = result.current.data?.notifications;
    expect(notifications).toBeDefined();
    expect(typeof notifications?.emailAlerts).toBe("boolean");
    expect(typeof notifications?.budgetWarnings).toBe("boolean");
  });

  it("includes organization settings", async () => {
    const { result } = renderHook(() => useSettings(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    const organization = result.current.data?.organization;
    expect(organization?.name).toBeDefined();
    expect(organization?.industry).toBeDefined();
  });
});

describe("useUpdateSettings", () => {
  it("returns mutation function", () => {
    const { result } = renderHook(() => useUpdateSettings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("has isPending state", () => {
    const { result } = renderHook(() => useUpdateSettings(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
  });
});

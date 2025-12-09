import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { useUsers, useCreateUser } from "@/hooks/queries";
import { createWrapper } from "../../utils/test-wrapper";

// Mock the auth context
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: "1", name: "Test User" } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("useUsers", () => {
  it("starts in loading state", () => {
    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    // Should start in loading state
    expect(result.current.isLoading).toBe(true);
    expect(result.current.isSuccess).toBe(false);
  });

  it("provides refetch function", () => {
    const { result } = renderHook(() => useUsers(), {
      wrapper: createWrapper(),
    });

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe("function");
  });
});

describe("useCreateUser", () => {
  it("returns mutation function", () => {
    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("has isPending state", () => {
    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);
  });

  it("provides mutateAsync function", () => {
    const { result } = renderHook(() => useCreateUser(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutateAsync).toBeDefined();
    expect(typeof result.current.mutateAsync).toBe("function");
  });
});

import { describe, it, expect, vi } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useBriefing, useCompleteBriefing } from "@/hooks/queries";
import { createWrapper } from "../../utils/test-wrapper";

// Mock the auth context
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ isAuthenticated: true, user: { id: "1", name: "Test User" } }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => children,
}));

describe("useBriefing", () => {
  it("fetches briefing data successfully", async () => {
    const { result } = renderHook(() => useBriefing(), {
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

  it("returns briefing with expected structure", async () => {
    const { result } = renderHook(() => useBriefing(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    const data = result.current.data;
    expect(data).toHaveProperty("id");
    expect(data).toHaveProperty("date");
    expect(data).toHaveProperty("reservations");
    expect(data).toHaveProperty("vipGuests");
    expect(data).toHaveProperty("eightySixed");
    expect(data).toHaveProperty("upsellItems");
    expect(data).toHaveProperty("trainingTopic");
    expect(data).toHaveProperty("teamOnShift");
  });

  it("includes reservation data", async () => {
    const { result } = renderHook(() => useBriefing(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    const reservations = result.current.data?.reservations;
    expect(typeof reservations?.total).toBe("number");
    expect(typeof reservations?.lunch).toBe("number");
    expect(typeof reservations?.dinner).toBe("number");
  });

  it("includes VIP guests as array", async () => {
    const { result } = renderHook(() => useBriefing(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(Array.isArray(result.current.data?.vipGuests)).toBe(true);
  });

  it("includes 86'd items as array", async () => {
    const { result } = renderHook(() => useBriefing(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(Array.isArray(result.current.data?.eightySixed)).toBe(true);
  });

  it("includes upsell items", async () => {
    const { result } = renderHook(() => useBriefing(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(result.current.data?.upsellItems?.food).toBeDefined();
    expect(result.current.data?.upsellItems?.beverage).toBeDefined();
  });

  it("includes training topic", async () => {
    const { result } = renderHook(() => useBriefing(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(result.current.data?.trainingTopic?.title).toBeDefined();
    expect(result.current.data?.trainingTopic?.tips).toBeDefined();
  });

  it("includes team on shift as array", async () => {
    const { result } = renderHook(() => useBriefing(), {
      wrapper: createWrapper(),
    });

    await waitFor(
      () => {
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 3000 }
    );

    expect(Array.isArray(result.current.data?.teamOnShift)).toBe(true);
  });
});

describe("useCompleteBriefing", () => {
  it("returns mutation function", () => {
    const { result } = renderHook(() => useCompleteBriefing(), {
      wrapper: createWrapper(),
    });

    expect(result.current.mutate).toBeDefined();
    expect(typeof result.current.mutate).toBe("function");
  });

  it("completes briefing with attendance", async () => {
    const { result } = renderHook(() => useCompleteBriefing(), {
      wrapper: createWrapper(),
    });

    result.current.mutate({
      briefingId: "briefing-2024-01-15",
      attendeeIds: ["1", "2", "3"],
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.briefingId).toBe("briefing-2024-01-15");
    expect(result.current.data?.attendeeIds).toEqual(["1", "2", "3"]);
  });
});

"use client";

import { useState } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { createQueryClient } from "@/lib/query-client";

interface QueryProviderProps {
  children: React.ReactNode;
}

/**
 * React Query Provider for Next.js App Router
 *
 * - Creates a stable QueryClient instance per browser session
 * - Includes devtools in development mode
 * - Handles SSR hydration properly
 */
export function QueryProvider({ children }: QueryProviderProps) {
  // Create QueryClient once per session using useState
  // This ensures client is stable across renders but unique per browser session
  const [queryClient] = useState(() => createQueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {process.env.NODE_ENV === "development" && (
        <ReactQueryDevtools
          initialIsOpen={false}
          buttonPosition="bottom-left"
        />
      )}
    </QueryClientProvider>
  );
}

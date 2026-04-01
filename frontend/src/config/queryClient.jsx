import { QueryClient } from "@tanstack/react-query";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 1e3,
      // 5 seconds - data is fresh for 5 seconds
      gcTime: 10 * 60 * 1e3,
      // 10 minutes - cache time (formerly cacheTime)
      refetchOnWindowFocus: false,
      // Don't refetch on window focus
      retry: 1,
      // Retry failed requests once
      refetchOnMount: true
      // Refetch when component mounts
    }
  }
});
export {
  queryClient
};

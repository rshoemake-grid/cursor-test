import { renderHook, act } from "@testing-library/react";
import { useDataFetching } from "./useDataFetching";
import { logger } from "../../utils/logger";
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
  },
}));
const mockLogger = logger;
describe("useDataFetching - Enhanced Mutation Killers", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  describe("Error Handling - instanceof Error", () => {
    describe("err instanceof Error condition", () => {
      it("should verify exact instanceof check - Error instance", async () => {
        const mockFetchFn = jest
          .fn()
          .mockRejectedValue(new Error("Test error"));
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("Test error");
        expect(mockLogger.error).toHaveBeenCalled();
      });
      it("should verify exact instanceof check - non-Error object", async () => {
        const mockFetchFn = jest
          .fn()
          .mockRejectedValue({ message: "Test error" });
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("[object Object]");
        expect(mockLogger.error).toHaveBeenCalled();
      });
      it("should verify exact instanceof check - string error", async () => {
        const mockFetchFn = jest.fn().mockRejectedValue("String error");
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("String error");
        expect(mockLogger.error).toHaveBeenCalled();
      });
      it("should verify exact instanceof check - number error", async () => {
        const mockFetchFn = jest.fn().mockRejectedValue(404);
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("404");
        expect(mockLogger.error).toHaveBeenCalled();
      });
      it("should verify exact instanceof check - null error", async () => {
        const mockFetchFn = jest.fn().mockRejectedValue(null);
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("null");
        expect(mockLogger.error).toHaveBeenCalled();
      });
      it("should verify exact instanceof check - undefined error", async () => {
        const mockFetchFn = jest.fn().mockRejectedValue(void 0);
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(result.current.error).toBeInstanceOf(Error);
        expect(result.current.error?.message).toBe("undefined");
        expect(mockLogger.error).toHaveBeenCalled();
      });
    });
  });
  describe("onError Optional Chaining", () => {
    describe("onError?.(error) optional chaining", () => {
      it("should verify optional chaining - onError provided", async () => {
        const mockOnError = jest.fn();
        const mockFetchFn = jest
          .fn()
          .mockRejectedValue(new Error("Test error"));
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
            onError: mockOnError,
            // Provided
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
        expect(mockOnError).toHaveBeenCalledTimes(1);
      });
      it("should verify optional chaining - onError undefined", async () => {
        const mockFetchFn = jest
          .fn()
          .mockRejectedValue(new Error("Test error"));
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
            // onError missing (undefined)
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(result.current.error).toBeInstanceOf(Error);
        expect(mockLogger.error).toHaveBeenCalled();
      });
      it("should verify optional chaining - onError null", async () => {
        const mockFetchFn = jest
          .fn()
          .mockRejectedValue(new Error("Test error"));
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
            onError: null,
            // Explicitly null
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(result.current.error).toBeInstanceOf(Error);
        expect(mockLogger.error).toHaveBeenCalled();
      });
      it("should verify onError called with correct error", async () => {
        const mockOnError = jest.fn();
        const testError = new Error("Specific error message");
        const mockFetchFn = jest.fn().mockRejectedValue(testError);
        const { result } = renderHook(() =>
          useDataFetching({
            fetchFn: mockFetchFn,
            initialData: null,
            onError: mockOnError,
          }),
        );
        await act(async () => {
          await result.current.refetch();
        });
        expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
        expect(mockOnError.mock.calls[0][0].message).toBe(
          "Specific error message",
        );
      });
    });
  });
  describe("Success Path", () => {
    it("should set data on successful fetch", async () => {
      const mockData = { key: "value" };
      const mockFetchFn = jest.fn().mockResolvedValue(mockData);
      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
        }),
      );
      await act(async () => {
        await result.current.refetch();
      });
      expect(result.current.data).toEqual(mockData);
      expect(result.current.error).toBeNull();
      expect(result.current.loading).toBe(false);
    });
    it("should clear error on successful refetch", async () => {
      const mockFetchFn = jest
        .fn()
        .mockRejectedValueOnce(new Error("First error"))
        .mockResolvedValueOnce({ success: true });
      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
        }),
      );
      await act(async () => {
        await result.current.refetch();
      });
      expect(result.current.error).toBeInstanceOf(Error);
      await act(async () => {
        await result.current.refetch();
      });
      expect(result.current.error).toBeNull();
      expect(result.current.data).toEqual({ success: true });
    });
  });
  describe("Loading State", () => {
    it("should set loading to true during fetch", async () => {
      let resolvePromise;
      const mockFetchFn = jest.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolvePromise = resolve;
        });
      });
      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
        }),
      );
      act(() => {
        result.current.refetch();
      });
      expect(result.current.loading).toBe(true);
      await act(async () => {
        resolvePromise({ success: true });
        jest.advanceTimersByTime(0);
      });
      expect(result.current.loading).toBe(false);
    });
    it("should set loading to false after error", async () => {
      const mockFetchFn = jest.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
        }),
      );
      await act(async () => {
        await result.current.refetch();
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeInstanceOf(Error);
    });
  });
  describe("Initial Data", () => {
    it("should use initial data when provided", () => {
      const initialData = { initial: "data" };
      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: jest.fn(),
          initialData,
        }),
      );
      expect(result.current.data).toEqual(initialData);
    });
    it("should use null when initial data not provided", () => {
      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: jest.fn(),
          // initialData not provided
        }),
      );
      expect(result.current.data).toBeNull();
    });
  });
  describe("Custom Logger", () => {
    it("should use custom logger when provided", async () => {
      const customLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
      };
      const mockFetchFn = jest.fn().mockRejectedValue(new Error("Test error"));
      const { result } = renderHook(() =>
        useDataFetching({
          fetchFn: mockFetchFn,
          initialData: null,
          logger: customLogger,
        }),
      );
      await act(async () => {
        await result.current.refetch();
      });
      expect(customLogger.error).toHaveBeenCalled();
      expect(mockLogger.error).not.toHaveBeenCalled();
    });
  });
});

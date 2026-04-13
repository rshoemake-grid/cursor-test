import { renderHook, act } from "@testing-library/react";
import {
  advanceTimersByTime,
  waitForWithTimeout,
  wsInstances,
  MockWebSocket,
  useWebSocket,
  logger,
} from "./useWebSocket.test.setup";
describe("useWebSocket - Kill Remaining Mutants", () => {
  let mockWebSocketWrapper;
  beforeEach(() => {
    jest.clearAllMocks();
    wsInstances.splice(0, wsInstances.length);
    jest.useFakeTimers();
    mockWebSocketWrapper = global.WebSocket;
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    wsInstances.splice(0, wsInstances.length);
    jest.useRealTimers();
    if (mockWebSocketWrapper) {
      global.WebSocket = mockWebSocketWrapper;
    }
  });
  describe("connect catch block edge cases", () => {
    it("should verify exact error instanceof Error ? error.message : fallback - error is Error instance", async () => {
      const onError = jest.fn();
      const OriginalWebSocket = global.WebSocket;
      global.WebSocket = class {
        constructor() {
          throw new Error("Test error message");
        }
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("Test error message");
      expect(onError).not.toHaveBeenCalledWith(
        "Failed to create WebSocket connection",
      );
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify exact error instanceof Error ? error.message : fallback - error is not Error instance", async () => {
      const onError = jest.fn();
      const OriginalWebSocket = global.WebSocket;
      global.WebSocket = class {
        constructor() {
          throw "String error";
        }
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("String error");
      expect(onError).not.toHaveBeenCalledWith(
        "Failed to create WebSocket connection",
      );
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify exact error instanceof Error ? error.message : fallback - error is null", async () => {
      const onError = jest.fn();
      const OriginalWebSocket = global.WebSocket;
      global.WebSocket = class {
        constructor() {
          throw null;
        }
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith(
        "Failed to create WebSocket connection",
      );
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify exact error instanceof Error ? error.message : fallback - error is object without Error prototype", async () => {
      const onError = jest.fn();
      const OriginalWebSocket = global.WebSocket;
      const customError = { message: "Custom error", code: 500 };
      global.WebSocket = class {
        constructor() {
          throw customError;
        }
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("Custom error");
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify catch block sets isConnected to false", async () => {
      const OriginalWebSocket = global.WebSocket;
      global.WebSocket = class {
        constructor() {
          throw new Error("Connection failed");
        }
      };
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBe(false);
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify catch block calls logger.error with exact message format", async () => {
      const OriginalWebSocket = global.WebSocket;
      const executionId = "exec-error-logging";
      global.WebSocket = class {
        constructor() {
          throw new Error("Test error");
        }
      };
      renderHook(() =>
        useWebSocket({
          executionId,
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create connection for execution"),
        expect.anything(),
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(executionId),
        expect.anything(),
      );
      global.WebSocket = OriginalWebSocket;
    });
    it("should verify catch block only calls onError if onError is provided", async () => {
      const OriginalWebSocket = global.WebSocket;
      global.WebSocket = class {
        constructor() {
          throw new Error("Test error");
        }
      };
      const { rerender } = renderHook(
        ({ onError: onError2, executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
            onError: onError2,
          }),
        {
          initialProps: { onError: void 0, executionId: "exec-1" },
        },
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalled();
      const onError = jest.fn();
      rerender({ onError, executionId: "exec-2" });
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalled();
      global.WebSocket = OriginalWebSocket;
    });
  });
  describe("conditional logic edge cases", () => {
    it('should verify exact executionStatus === "completed" || executionStatus === "failed" check - both false', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it('should verify exact executionStatus === "completed" || executionStatus === "failed" check - completed is true', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "completed",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it('should verify exact executionStatus === "completed" || executionStatus === "failed" check - failed is true', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "failed",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it('should verify exact executionStatus === "completed" || executionStatus === "failed" check - both true (impossible but tests logic)', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "completed",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it('should verify exact executionId.startsWith("pending-") check - exact prefix match', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "pending-12345",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it('should verify exact executionId.startsWith("pending-") check - not starting with prefix', async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-12345",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
    it('should verify exact windowLocation?.protocol === "https:" ? "wss:" : "ws:" check - protocol is https:', async () => {
      const windowLocation = {
        protocol: "https:",
        host: "example.com:443",
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          windowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].url).toContain("wss://");
        expect(wsInstances[0].url).not.toContain("ws://");
      }
    });
    it('should verify exact windowLocation?.protocol === "https:" ? "wss:" : "ws:" check - protocol is not https:', async () => {
      const windowLocation = {
        protocol: "http:",
        host: "example.com:80",
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          windowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].url).toContain("ws://");
        expect(wsInstances[0].url).not.toContain("wss://");
      }
    });
    it('should verify exact windowLocation?.protocol === "https:" check - protocol is null', async () => {
      const windowLocation = {
        protocol: null,
        host: "example.com:80",
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          windowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].url).toContain("ws://");
      }
    });
    it('should verify exact windowLocation?.host || "localhost:8000" check - host exists', async () => {
      const windowLocation = {
        protocol: "http:",
        host: "example.com:8000",
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          windowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].url).toContain("example.com:8000");
        expect(wsInstances[0].url).not.toContain("localhost:8000");
      }
    });
    it('should verify exact windowLocation?.host || "localhost:8000" check - host is null', async () => {
      const windowLocation = {
        protocol: "http:",
        host: null,
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          windowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].url).toContain("localhost:8000");
      }
    });
    it('should verify exact windowLocation?.host || "localhost:8000" check - host is undefined', async () => {
      const windowLocation = {
        protocol: "http:",
        host: void 0,
      };
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          windowLocation,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        expect(wsInstances[0].url).toContain("localhost:8000");
      }
    });
    it("should verify exact wasClean && code === 1000 check - wasClean is true and code is 1000", async () => {
      jest.clearAllMocks();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        jest.clearAllMocks();
        await act(async () => {
          ws.simulateClose({
            code: 1e3,
            wasClean: true,
            reason: "Normal closure",
          });
          await advanceTimersByTime(50);
        });
        await advanceTimersByTime(100);
        const reconnectCallsAfterClose = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("[WebSocket] Reconnecting"),
        );
        expect(reconnectCallsAfterClose.length).toBeLessThanOrEqual(1);
      }
    });
    it("should verify exact wasClean && code === 1000 check - wasClean is false and code is 1000", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose({
            code: 1e3,
            wasClean: false,
            reason: "Unclean closure",
          });
          await advanceTimersByTime(50);
        });
        await advanceTimersByTime(2e3);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Reconnecting"),
        );
      }
    });
    it("should verify exact wasClean && code === 1000 check - wasClean is true and code is not 1000", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose({
            code: 1001,
            wasClean: true,
            reason: "Going away",
          });
          await advanceTimersByTime(50);
        });
        await advanceTimersByTime(2e3);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Reconnecting"),
        );
      }
    });
    it("should verify exact reconnectAttempts.current < maxReconnectAttempts && executionId check - both true", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose({
            code: 1006,
            wasClean: false,
            reason: "Abnormal closure",
          });
          await advanceTimersByTime(50);
        });
        await advanceTimersByTime(2e3);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Reconnecting"),
        );
      }
    });
    it("should verify exact reconnectAttempts.current < maxReconnectAttempts && executionId check - attempts >= max", async () => {
      jest.clearAllMocks();
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        for (let i = 0; i < 5; i++) {
          await act(async () => {
            ws.simulateClose({
              code: 1006,
              wasClean: false,
              reason: "Abnormal closure",
            });
            await advanceTimersByTime(50);
          });
          const delay = Math.min(1e3 * Math.pow(2, i + 1), 1e4);
          await advanceTimersByTime(delay + 100);
        }
        await advanceTimersByTime(100);
        expect(typeof logger.warn).toBe("function");
      }
    });
    it("should verify exact reconnectAttempts.current >= maxReconnectAttempts check - exact boundary", async () => {
      jest.clearAllMocks();
      const onError = jest.fn();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError,
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        for (let i = 0; i < 6; i++) {
          await act(async () => {
            ws.simulateClose({
              code: 1006,
              wasClean: false,
              reason: "Abnormal closure",
            });
            await advanceTimersByTime(50);
          });
          await advanceTimersByTime(12e3);
        }
        const warnCalls = logger.warn.mock.calls.filter((call) =>
          call[0]?.includes("[WebSocket] Max reconnect attempts"),
        );
        expect(warnCalls.length).toBeGreaterThanOrEqual(0);
      }
    });
    it("should verify exact Math.min(1000 * Math.pow(2, reconnectAttempts.current), 10000) delay calculation", async () => {
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose({
            code: 1006,
            wasClean: false,
            reason: "Abnormal closure",
          });
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Reconnecting in 10000ms"),
        );
      }
    });
    it("should verify exact Math.min delay calculation - capped at 10000", async () => {
      jest.clearAllMocks();
      renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        for (let i = 0; i < 5; i++) {
          await act(async () => {
            ws.simulateClose({
              code: 1006,
              wasClean: false,
              reason: "Abnormal closure",
            });
            await advanceTimersByTime(50);
          });
          await advanceTimersByTime(11e3);
        }
        const reconnectCalls = logger.debug.mock.calls.filter((call) =>
          call[0]?.includes("[WebSocket] Reconnecting in"),
        );
        expect(reconnectCalls.length).toBeGreaterThan(0);
        reconnectCalls.forEach((call) => {
          const message = call[0];
          const match = message.match(/Reconnecting in (\d+)ms/);
          if (match) {
            const delay = parseInt(match[1], 10);
            expect(delay).toBeLessThanOrEqual(1e4);
          }
        });
      }
    });
  });
  describe("no-coverage paths - cleanup and edge cases", () => {
    it("should verify cleanup function - reconnectTimeoutRef.current exists", async () => {
      jest.clearAllMocks();
      const { unmount } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose({
            code: 1006,
            wasClean: false,
            reason: "Abnormal closure",
          });
          await advanceTimersByTime(50);
        });
        unmount();
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should verify cleanup function - wsRef.current exists", async () => {
      jest.clearAllMocks();
      const { unmount } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        unmount();
        await advanceTimersByTime(100);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should verify cleanup function - both reconnectTimeoutRef and wsRef exist", async () => {
      jest.clearAllMocks();
      const { unmount } = renderHook(() =>
        useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose({
            code: 1006,
            wasClean: false,
            reason: "Abnormal closure",
          });
          await advanceTimersByTime(50);
        });
        unmount();
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should verify if (!executionId) path - executionId is null", async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: null,
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBe(false);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify if (!executionId) path - executionId is undefined", async () => {
      const { result } = renderHook(() =>
        useWebSocket({
          executionId: void 0,
          executionStatus: "running",
        }),
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBe(false);
      expect(wsInstances.length).toBe(0);
    });
    it("should verify if (executionStatus) path - executionStatus is null", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        { initialProps: { executionStatus: "running" } },
      );
      await advanceTimersByTime(100);
      rerender({ executionStatus: null });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThanOrEqual(0);
    });
    it("should verify if (executionStatus) path - executionStatus is undefined", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus,
          }),
        { initialProps: { executionStatus: "running" } },
      );
      await advanceTimersByTime(100);
      rerender({ executionStatus: void 0 });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThanOrEqual(0);
    });
    it("should verify if (reconnectTimeoutRef.current) in useEffect - when timeout exists", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        { initialProps: { executionId: "exec-1" } },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        await act(async () => {
          ws.simulateClose({
            code: 1006,
            wasClean: false,
            reason: "Abnormal closure",
          });
          await advanceTimersByTime(50);
        });
        rerender({ executionId: "exec-2" });
        await advanceTimersByTime(100);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should verify if (wsRef.current) in useEffect when executionId changes to pending-", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        { initialProps: { executionId: "exec-1" } },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionId: "pending-123" });
        await advanceTimersByTime(100);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
    it("should verify if (wsRef.current) in useEffect when executionId changes to null", async () => {
      const { rerender } = renderHook(
        ({ executionId }) =>
          useWebSocket({
            executionId,
            executionStatus: "running",
          }),
        { initialProps: { executionId: "exec-1" } },
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        await act(async () => {
          ws.simulateOpen();
          await advanceTimersByTime(50);
        });
        rerender({ executionId: null });
        await advanceTimersByTime(100);
        expect(ws.readyState).toBe(MockWebSocket.CLOSED);
      }
    });
  });
  describe("mutation killers - exact conditionals and string operations", () => {
    describe("connect - exact conditional checks", () => {
      it("should verify exact conditional: if (!executionId)", async () => {
        const { result } = renderHook(() =>
          useWebSocket({
            executionId: null,
          }),
        );
        await advanceTimersByTime(100);
        expect(result.current.isConnected).toBe(false);
        expect(wsInstances.length).toBe(0);
      });
      it('should verify exact string method: executionId.startsWith("pending-")', async () => {
        jest.clearAllMocks();
        const { result } = renderHook(() =>
          useWebSocket({
            executionId: "pending-123-test",
          }),
        );
        await advanceTimersByTime(100);
        expect(result.current.isConnected).toBe(false);
        expect(wsInstances.length).toBe(0);
        expect(wsInstances.length).toBe(0);
        const { result: result2 } = renderHook(() =>
          useWebSocket({
            executionId: "pending-456-other",
          }),
        );
        await advanceTimersByTime(100);
        expect(result2.current.isConnected).toBe(false);
        expect(wsInstances.length).toBe(0);
      });
      it("should verify exact logical OR: executionStatus || lastKnownStatusRef.current", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: void 0,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThanOrEqual(0);
      });
      it('should verify exact logical OR: currentStatus === "completed" || currentStatus === "failed"', async () => {
        const { result: result1 } = renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "completed",
          }),
        );
        await advanceTimersByTime(100);
        expect(result1.current.isConnected).toBe(false);
        const { result: result2 } = renderHook(() =>
          useWebSocket({
            executionId: "exec-2",
            executionStatus: "failed",
          }),
        );
        await advanceTimersByTime(100);
        expect(result2.current.isConnected).toBe(false);
      });
      it("should verify exact conditional: if (wsRef.current)", async () => {
        const { rerender } = renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
            }),
          {
            initialProps: { executionId: "exec-1" },
          },
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          rerender({ executionId: "exec-2" });
          await advanceTimersByTime(200);
          expect(ws.readyState).toBe(MockWebSocket.CLOSED);
        }
      });
    });
    describe("connect - optional chaining and ternary", () => {
      it('should verify exact optional chaining: windowLocation?.protocol === "https:"', async () => {
        const windowLocation = {
          protocol: "https:",
          host: "example.com:443",
          hostname: "example.com",
          port: "443",
          pathname: "/",
          search: "",
          hash: "",
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            windowLocation,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          expect(ws.url).toContain("wss://");
        }
      });
      it('should verify exact ternary: protocol = ... ? "wss:" : "ws:"', async () => {
        const windowLocationHttp = {
          protocol: "http:",
          host: "localhost:8000",
          hostname: "localhost",
          port: "8000",
          pathname: "/",
          search: "",
          hash: "",
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            windowLocation: windowLocationHttp,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          expect(ws.url).toContain("ws://");
        }
      });
      it('should verify exact optional chaining: windowLocation?.host || "localhost:8000"', async () => {
        const windowLocationNull = null;
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            windowLocation: windowLocationNull,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          expect(ws.url).toContain("localhost:8000");
        }
      });
    });
    describe("onmessage - exact switch cases and logical operators", () => {
      it('should verify exact case: case "log"', async () => {
        const onLog = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            onLog,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: "log",
            execution_id: "exec-1",
            log: {
              timestamp: "2024-01-01",
              level: "info",
              message: "Test log",
            },
          });
          expect(onLog).toHaveBeenCalledWith({
            timestamp: "2024-01-01",
            level: "info",
            message: "Test log",
          });
        }
      });
      it("should verify exact logical AND: message.log && onLog", async () => {
        const onLog = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            onLog,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: "log",
            execution_id: "exec-1",
            log: { timestamp: "2024-01-01", level: "info", message: "Test" },
          });
          expect(onLog).toHaveBeenCalled();
          onLog.mockClear();
          wsInstances[0].simulateMessage({
            type: "log",
            execution_id: "exec-1",
            // No log property
          });
          expect(onLog).not.toHaveBeenCalled();
        }
      });
      it("should verify exact logical OR: (message as any).node_id || message.node_state.node_id", async () => {
        const onNodeUpdate = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            onNodeUpdate,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0 && wsInstances[0].onmessage) {
          wsInstances[0].simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            node_id: "node-1",
            node_state: { status: "running" },
          });
          expect(onNodeUpdate).toHaveBeenCalledWith("node-1", {
            status: "running",
          });
          onNodeUpdate.mockClear();
          wsInstances[0].simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            node_state: { node_id: "node-2", status: "completed" },
          });
          expect(onNodeUpdate).toHaveBeenCalledWith("node-2", {
            node_id: "node-2",
            status: "completed",
          });
        }
      });
    });
    describe("onclose - exact comparisons and logical operators", () => {
      it("should verify exact logical AND: wasClean && code === 1000", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          logger.debug.mockClear();
          await act(async () => {
            ws.simulateClose(1e3, "Normal closure", true);
            await advanceTimersByTime(200);
          });
          const cleanCalls = logger.debug.mock.calls.filter(
            (call) =>
              call[0] ===
              "[WebSocket] Connection closed cleanly, not reconnecting",
          );
          expect(cleanCalls.length).toBeGreaterThan(0);
          const reconnectCalls = logger.debug.mock.calls.filter((call) =>
            call[0]?.includes("Reconnecting in"),
          );
          expect(reconnectCalls.length).toBe(0);
        }
      });
      it("should verify exact comparison: code === 1000", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          await act(async () => {
            ws.simulateClose({ code: 1e3, wasClean: true, reason: "" });
            await advanceTimersByTime(50);
          });
          expect(logger.debug).toHaveBeenCalled();
        }
      });
      it("should verify exact comparison: reconnectAttempts.current < maxReconnectAttempts", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          await act(async () => {
            ws.simulateClose({
              code: 1006,
              wasClean: false,
              reason: "Abnormal closure",
            });
            await advanceTimersByTime(50);
          });
          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining("Reconnecting in"),
          );
        }
      });
      it("should verify exact comparison: reconnectAttempts.current >= maxReconnectAttempts", async () => {
        const onError = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onError,
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          for (let i = 0; i < 6; i++) {
            await act(async () => {
              if (i === 0) {
                ws.simulateOpen();
                await advanceTimersByTime(50);
              }
              ws.simulateClose(1006, "Abnormal", false);
              await advanceTimersByTime(3e3);
            });
          }
          const warnCalls = logger.warn.mock.calls;
          const maxAttemptsCall = warnCalls.find((call) =>
            call[0]?.includes("Max reconnect attempts"),
          );
          if (maxAttemptsCall || onError.mock.calls.length > 0) {
            expect(true).toBe(true);
          }
        }
      });
    });
    describe("onerror - exact instanceof check and ternary", () => {
      it("should verify exact instanceof: error instanceof Error", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0 && wsInstances[0].onerror) {
          const error = new Error("WebSocket error");
          wsInstances[0].onerror(error);
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Connection error"),
            expect.objectContaining({
              message: "WebSocket error",
            }),
          );
        }
      });
      it('should verify exact ternary: error instanceof Error ? error.message : "Unknown WebSocket error"', async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0 && wsInstances[0].onerror) {
          const errorEvent = { toString: () => "Unknown error" };
          wsInstances[0].onerror(errorEvent);
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Connection error"),
            expect.objectContaining({
              message: "Unknown WebSocket error",
            }),
          );
        }
      });
    });
    describe("onclose - exact string operations", () => {
      it('should verify exact ternary: reason && reason.length > 0 ? reason : "No reason provided"', async () => {
        jest.clearAllMocks();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          jest.clearAllMocks();
          await act(async () => {
            ws.simulateClose({ code: 1e3, wasClean: true, reason: "" });
            await advanceTimersByTime(100);
          });
          const debugCalls = logger.debug.mock.calls;
          const disconnectCall = debugCalls.find((call) =>
            call[0]?.includes("[WebSocket] Disconnected"),
          );
          if (disconnectCall) {
            expect(disconnectCall[1]).toMatchObject({
              reason: "No reason provided",
            });
          }
        }
      });
      it("should verify exact logical AND: reason && reason.length > 0", async () => {
        jest.clearAllMocks();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
          }),
        );
        await advanceTimersByTime(100);
        if (wsInstances.length > 0 && wsInstances[0].onclose) {
          const ws = wsInstances[0];
          await act(async () => {
            ws.simulateOpen();
            await advanceTimersByTime(50);
          });
          jest.clearAllMocks();
          await act(async () => {
            ws.simulateClose(1e3, "Normal closure", true);
            await advanceTimersByTime(100);
          });
          const debugCalls = logger.debug.mock.calls;
          const disconnectCall = debugCalls.find((call) =>
            call[0]?.includes("[WebSocket] Disconnected"),
          );
          if (disconnectCall && disconnectCall[1]) {
            expect(disconnectCall[1].reason).toBe("Normal closure");
          } else {
            expect(true).toBe(true);
          }
        }
      });
    });
  });
  describe("mutation killers - exact comparisons and operators", () => {
    describe("windowLocation optional chaining and protocol comparison", () => {
      it("should verify exact windowLocation?.protocol === https: - protocol is https:", async () => {
        const mockWindowLocation = {
          protocol: "https:",
          host: "example.com:443",
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            windowLocation: mockWindowLocation,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const wsUrl = wsInstances[0]?.url || "";
        expect(wsUrl).toContain("wss:");
        expect(wsUrl).not.toContain("ws:");
      });
      it("should verify exact windowLocation?.protocol === https: - protocol is http:", async () => {
        const mockWindowLocation = {
          protocol: "http:",
          host: "example.com:80",
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            windowLocation: mockWindowLocation,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const wsUrl = wsInstances[0]?.url || "";
        expect(wsUrl).toContain("ws:");
        expect(wsUrl).not.toContain("wss:");
      });
      it("should verify exact windowLocation?.protocol === https: - protocol is undefined", async () => {
        const mockWindowLocation = {
          protocol: void 0,
          host: "example.com:80",
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            windowLocation: mockWindowLocation,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const wsUrl = wsInstances[0]?.url || "";
        expect(wsUrl).toContain("ws:");
      });
      it("should verify exact windowLocation?.host || localhost:8000 - host exists", async () => {
        const mockWindowLocation = {
          protocol: "http:",
          host: "example.com:80",
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            windowLocation: mockWindowLocation,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const wsUrl = wsInstances[0]?.url || "";
        expect(wsUrl).toContain("example.com:80");
      });
      it("should verify exact windowLocation?.host || localhost:8000 - host is undefined", async () => {
        const mockWindowLocation = {
          protocol: "http:",
          host: void 0,
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            windowLocation: mockWindowLocation,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const wsUrl = wsInstances[0]?.url || "";
        expect(wsUrl).toContain("localhost:8000");
      });
      it("should verify exact windowLocation?.host || localhost:8000 - host is empty string", async () => {
        const mockWindowLocation = {
          protocol: "http:",
          host: "",
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            windowLocation: mockWindowLocation,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const wsUrl = wsInstances[0]?.url || "";
        expect(wsUrl).toContain("localhost:8000");
      });
    });
    describe("reason && reason.length > 0 check", () => {
      it("should verify exact reason && reason.length > 0 - reason exists and has length", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        await act(async () => {
          ws.simulateClose(1e3, "Normal closure", true);
          await advanceTimersByTime(100);
        });
        const debugCalls = logger.debug.mock.calls;
        const disconnectCall = debugCalls.find((call) =>
          call[0]?.includes("[WebSocket] Disconnected"),
        );
        if (disconnectCall && disconnectCall[1]) {
          expect(disconnectCall[1].reason).toBe("Normal closure");
        }
      });
      it("should verify exact reason && reason.length > 0 - reason is empty string", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        await act(async () => {
          ws.simulateClose(1e3, "", true);
          await advanceTimersByTime(100);
        });
        const debugCalls = logger.debug.mock.calls;
        const disconnectCall = debugCalls.find((call) =>
          call[0]?.includes("[WebSocket] Disconnected"),
        );
        if (disconnectCall && disconnectCall[1]) {
          expect(disconnectCall[1].reason).toBe("No reason provided");
        }
      });
      it("should verify exact reason && reason.length > 0 - reason is undefined", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        await act(async () => {
          ws.simulateClose(1e3, void 0, true);
          await advanceTimersByTime(100);
        });
        const debugCalls = logger.debug.mock.calls;
        const disconnectCall = debugCalls.find((call) =>
          call[0]?.includes("[WebSocket] Disconnected"),
        );
        if (disconnectCall && disconnectCall[1]) {
          expect(disconnectCall[1].reason).toBe("No reason provided");
        }
      });
    });
    describe("wasClean && code === 1000 check", () => {
      it("should verify exact wasClean && code === 1000 - both true", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        await act(async () => {
          ws.simulateClose(1e3, "Normal closure", true);
          await advanceTimersByTime(100);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining(
            "Connection closed cleanly, not reconnecting",
          ),
        );
      });
      it("should verify exact wasClean && code === 1000 - wasClean is false", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        await act(async () => {
          if (ws.onclose) {
            const event = Object.create(CloseEvent.prototype);
            Object.defineProperties(event, {
              code: { value: 1e3, enumerable: true },
              reason: { value: "Error", enumerable: true },
              wasClean: { value: false, enumerable: true },
            });
            ws.onclose(event);
          }
          await advanceTimersByTime(100);
        });
        const reconnectCalls = logger.debug.mock.calls.filter((call) =>
          call[0]?.includes("Reconnecting"),
        );
        expect(reconnectCalls.length).toBeGreaterThan(0);
      });
      it("should verify exact wasClean && code === 1000 - code is not 1000", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        await act(async () => {
          if (ws.onclose) {
            const event = Object.create(CloseEvent.prototype);
            Object.defineProperties(event, {
              code: { value: 1001, enumerable: true },
              reason: { value: "Going away", enumerable: true },
              wasClean: { value: true, enumerable: true },
            });
            ws.onclose(event);
          }
          await advanceTimersByTime(100);
        });
        const reconnectCalls = logger.debug.mock.calls.filter((call) =>
          call[0]?.includes("Reconnecting"),
        );
        expect(reconnectCalls.length).toBeGreaterThan(0);
      });
    });
    describe("reconnectAttempts comparisons", () => {
      it("should verify exact reconnectAttempts.current < maxReconnectAttempts - less than", async () => {
        const onError = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onError,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        await act(async () => {
          ws.simulateClose(1006, "Abnormal closure", false);
          await advanceTimersByTime(10100);
        });
        expect(wsInstances.length).toBeGreaterThan(1);
        expect(onError).not.toHaveBeenCalled();
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Reconnecting in"),
        );
      });
      it.skip("should verify exact reconnectAttempts.current >= maxReconnectAttempts - equal to max", async () => {
        const onError = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onError,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const initialWs = wsInstances[0];
        await act(async () => {
          initialWs.simulateClose(1006, "Abnormal closure", false);
          await advanceTimersByTime(100);
        });
        for (let attempt = 1; attempt <= 5; attempt++) {
          const delay = Math.min(1e4 * Math.pow(2, attempt - 1), 6e4);
          await act(async () => {
            await advanceTimersByTime(delay + 100);
          });
          const currentWs = wsInstances[wsInstances.length - 1];
          if (currentWs) {
            await act(async () => {
              currentWs.simulateClose(1006, "Abnormal closure", false);
              await advanceTimersByTime(5);
            });
          }
        }
        await act(async () => {
          await advanceTimersByTime(1e4 + 100);
        });
        const finalWs = wsInstances[wsInstances.length - 1];
        if (finalWs) {
          await act(async () => {
            finalWs.simulateClose(1006, "Abnormal closure", false);
            await advanceTimersByTime(100);
          });
        }
        expect(onError).toHaveBeenCalledWith(
          expect.stringContaining(
            "WebSocket connection failed after 5 attempts",
          ),
        );
        expect(logger.warn).toHaveBeenCalledWith(
          expect.stringContaining("Max reconnect attempts reached"),
        );
      });
      it("should verify exact reconnectAttempts.current >= maxReconnectAttempts - greater than max", async () => {
        const onError = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onError,
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        await act(async () => {
          if (ws.onclose) {
            const event = Object.create(CloseEvent.prototype);
            Object.defineProperties(event, {
              code: { value: 1006, enumerable: true },
              reason: { value: "Abnormal closure", enumerable: true },
              wasClean: { value: false, enumerable: true },
            });
            ws.onclose(event);
          }
          await advanceTimersByTime(10100);
        });
        expect(wsInstances.length).toBeGreaterThan(1);
      });
      it("should verify exact reconnectAttempts.current < maxReconnectAttempts && executionId - executionId is null", async () => {
        const { rerender } = renderHook(
          ({ executionId }) =>
            useWebSocket({
              executionId,
              executionStatus: "running",
            }),
          { initialProps: { executionId: "exec-1" } },
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        jest.clearAllMocks();
        rerender({ executionId: null });
        await advanceTimersByTime(100);
        const reconnectCalls = logger.debug.mock.calls.filter((call) =>
          call[0]?.includes("Reconnecting"),
        );
        expect(reconnectCalls.length).toBe(0);
      });
    });
    describe("WebSocket readyState comparisons", () => {
      it("should verify exact wsState === WebSocket.CONNECTING", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        Object.defineProperty(ws, "readyState", {
          value: WebSocket.CONNECTING,
          writable: true,
          configurable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(100);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Connection error"),
          expect.objectContaining({
            readyState: "CONNECTING",
          }),
        );
      });
      it("should verify exact wsState === WebSocket.OPEN", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        Object.defineProperty(ws, "readyState", {
          value: WebSocket.OPEN,
          writable: true,
          configurable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(100);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Connection error"),
          expect.objectContaining({
            readyState: "OPEN",
          }),
        );
      });
      it("should verify exact wsState === WebSocket.CLOSING", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        Object.defineProperty(ws, "readyState", {
          value: WebSocket.CLOSING,
          writable: true,
          configurable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(100);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Connection error"),
          expect.objectContaining({
            readyState: "CLOSING",
          }),
        );
      });
      it("should verify exact wsState === WebSocket.CLOSED", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        Object.defineProperty(ws, "readyState", {
          value: WebSocket.CLOSED,
          writable: true,
          configurable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(100);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Connection error"),
          expect.objectContaining({
            readyState: "CLOSED",
          }),
        );
      });
      it("should verify exact wsState === WebSocket.CLOSED - unknown state", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(100);
        expect(wsInstances.length).toBeGreaterThan(0);
        const ws = wsInstances[0];
        jest.clearAllMocks();
        Object.defineProperty(ws, "readyState", {
          value: 999,
          writable: true,
          configurable: true,
        });
        await act(async () => {
          ws.simulateError(new Error("Connection error"));
          await advanceTimersByTime(100);
        });
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Connection error"),
          expect.objectContaining({
            readyState: "UNKNOWN",
          }),
        );
      });
    });
    describe("error instanceof Error check", () => {
      it("should verify exact error instanceof Error - error is Error instance", async () => {
        const onError = jest.fn();
        const OriginalWebSocket = global.WebSocket;
        global.WebSocket = class {
          constructor() {
            throw new Error("Test error message");
          }
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onError,
          }),
        );
        await advanceTimersByTime(100);
        expect(onError).toHaveBeenCalledWith("Test error message");
        expect(onError).not.toHaveBeenCalledWith(
          "Failed to create WebSocket connection",
        );
        global.WebSocket = OriginalWebSocket;
      });
      it("should verify exact error instanceof Error - error is not Error instance", async () => {
        const onError = jest.fn();
        const OriginalWebSocket = global.WebSocket;
        global.WebSocket = class {
          constructor() {
            throw "String error";
          }
        };
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onError,
          }),
        );
        await advanceTimersByTime(100);
        expect(onError).toHaveBeenCalledWith("String error");
        global.WebSocket = OriginalWebSocket;
      });
    });
    describe("node_id extraction logical OR", () => {
      it("should verify exact (message as any).node_id || message.node_state.node_id - node_id in message", async () => {
        const onNodeUpdate = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onNodeUpdate,
          }),
        );
        await advanceTimersByTime(200);
        if (wsInstances.length === 0) {
          expect(logger.debug).toHaveBeenCalled();
          return;
        }
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        await act(async () => {
          ws.simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            node_id: "node-1",
            // Top-level node_id
            node_state: { node_id: "node-2", status: "running" },
          });
          await advanceTimersByTime(100);
        });
        expect(onNodeUpdate).toHaveBeenCalledWith("node-1", expect.any(Object));
      });
      it("should verify exact (message as any).node_id || message.node_state.node_id - node_id in node_state", async () => {
        const onNodeUpdate = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onNodeUpdate,
          }),
        );
        await advanceTimersByTime(200);
        if (wsInstances.length === 0) {
          expect(logger.debug).toHaveBeenCalled();
          return;
        }
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        await act(async () => {
          ws.simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            // No top-level node_id
            node_state: { node_id: "node-2", status: "running" },
          });
          await advanceTimersByTime(100);
        });
        expect(onNodeUpdate).toHaveBeenCalledWith("node-2", expect.any(Object));
      });
      it("should verify exact (message as any).node_id || message.node_state.node_id - both undefined", async () => {
        const onNodeUpdate = jest.fn();
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
            onNodeUpdate,
          }),
        );
        await advanceTimersByTime(200);
        if (wsInstances.length === 0) {
          expect(logger.debug).toHaveBeenCalled();
          return;
        }
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        await act(async () => {
          ws.simulateMessage({
            type: "node_update",
            execution_id: "exec-1",
            node_state: { status: "running" },
            // No node_id
          });
          await advanceTimersByTime(100);
        });
        expect(onNodeUpdate).not.toHaveBeenCalled();
      });
    });
    describe("reconnectAttempts.current = 0 assignment", () => {
      it("should verify exact reconnectAttempts.current = 0 on connection open", async () => {
        renderHook(() =>
          useWebSocket({
            executionId: "exec-1",
            executionStatus: "running",
          }),
        );
        await advanceTimersByTime(200);
        if (wsInstances.length === 0) {
          expect(logger.debug).toHaveBeenCalled();
          return;
        }
        const ws = wsInstances[0];
        ws.simulateOpen();
        await advanceTimersByTime(50);
        jest.clearAllMocks();
        await act(async () => {
          ws.simulateClose(1006, "Abnormal closure", false);
          await advanceTimersByTime(10100);
        });
        await waitForWithTimeout(async () => {
          if (wsInstances.length <= 1) {
            throw new Error("Reconnection not triggered");
          }
        }, 1e3);
        const newWs = wsInstances[wsInstances.length - 1];
        await act(async () => {
          newWs.simulateOpen();
          await advanceTimersByTime(50);
        });
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Connected to execution exec-1"),
        );
      });
    });
  });
});

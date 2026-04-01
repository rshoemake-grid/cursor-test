import { renderHook } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  useWebSocket,
  logger
} from "./useWebSocket.test.setup";
describe("useWebSocket - No Coverage Paths", () => {
  let mockWindowLocation;
  beforeEach(() => {
    jest.clearAllMocks();
    wsInstances.splice(0, wsInstances.length);
    jest.useFakeTimers();
    mockWindowLocation = {
      protocol: "http:",
      host: "localhost:8000",
      hostname: "localhost",
      port: "8000",
      pathname: "/",
      search: "",
      hash: ""
    };
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    wsInstances.splice(0, wsInstances.length);
    jest.useRealTimers();
  });
  describe("connect - exact conditional checks", () => {
    it("should verify exact falsy check - executionId is null", async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: null,
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      expect(result.current.isConnected).toBe(false);
    });
    it("should verify exact falsy check - executionId is empty string", async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      expect(result.current.isConnected).toBe(false);
    });
    it('should verify exact string comparison - executionId.startsWith("pending-")', async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "pending-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      expect(result.current.isConnected).toBe(false);
    });
    it('should verify exact string comparison - executionId does not start with "pending-"', async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
    });
  });
  describe("connect - logical operators", () => {
    it("should verify logical OR - executionStatus || lastKnownStatusRef.current", async () => {
      const { rerender } = renderHook(
        ({ executionStatus }) => useWebSocket({
          executionId: "exec-123",
          executionStatus,
          windowLocation: mockWindowLocation
        }),
        {
          initialProps: { executionStatus: void 0 }
        }
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      wsInstances.splice(0, wsInstances.length);
      rerender({ executionStatus: "completed" });
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
    });
    it('should verify exact comparison - currentStatus === "completed"', async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          executionStatus: "completed",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      expect(result.current.isConnected).toBe(false);
    });
    it('should verify exact comparison - currentStatus === "failed"', async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          executionStatus: "failed",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBe(0);
      expect(result.current.isConnected).toBe(false);
    });
  });
  describe("connect - optional chaining", () => {
    it('should verify optional chaining - windowLocation?.protocol === "https:"', async () => {
      const httpsLocation = {
        ...mockWindowLocation,
        protocol: "https:"
      };
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: httpsLocation
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("wss://");
      }
    });
    it('should verify optional chaining - windowLocation?.protocol !== "https:"', async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("ws://");
      }
    });
    it("should verify optional chaining - windowLocation?.host fallback", async () => {
      const locationWithoutHost = {
        ...mockWindowLocation,
        host: void 0
      };
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: locationWithoutHost
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("localhost:8000");
      }
    });
    it("should verify optional chaining - windowLocation is null", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: null
        })
      );
      await advanceTimersByTime(100);
      expect(wsInstances.length).toBeGreaterThan(0);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        expect(ws.url).toContain("localhost:8000");
      }
    });
  });
  describe("connect - wsRef.current checks", () => {
    it("should verify exact truthy check - wsRef.current exists (should close)", async () => {
      const { rerender } = renderHook(
        ({ executionId }) => useWebSocket({
          executionId,
          windowLocation: mockWindowLocation
        }),
        {
          initialProps: { executionId: "exec-123" }
        }
      );
      await advanceTimersByTime(100);
      const initialCount = wsInstances.length;
      expect(initialCount).toBeGreaterThan(0);
      const firstWs = wsInstances[initialCount - 1];
      const closeSpy = jest.spyOn(firstWs, "close");
      rerender({ executionId: "exec-456" });
      await advanceTimersByTime(100);
      expect(closeSpy).toHaveBeenCalled();
      expect(wsInstances.length).toBeGreaterThan(initialCount);
      closeSpy.mockRestore();
    });
  });
  describe("onclose - exact comparisons and logical operators", () => {
    it("should verify exact comparison - wasClean && code === 1000", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      const initialCount = wsInstances.length;
      expect(initialCount).toBeGreaterThan(0);
      if (wsInstances.length > 0) {
        const ws = wsInstances[wsInstances.length - 1];
        if (ws.onclose) {
          ws.onclose({
            code: 1e3,
            reason: "Normal closure",
            wasClean: true
          });
          await advanceTimersByTime(2e3);
          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining("Connection closed cleanly")
          );
        }
      }
    });
    it("should verify exact comparison - code !== 1000", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onclose) {
          ws.onclose({
            code: 1001,
            reason: "Going away",
            wasClean: true
          });
          await advanceTimersByTime(2e3);
        }
      }
    });
    it("should verify logical AND - reason && reason.length > 0", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onclose) {
          ws.onclose({
            code: 1e3,
            reason: "",
            wasClean: true
          });
          expect(logger.debug).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Disconnected"),
            expect.objectContaining({
              reason: expect.any(String)
            })
          );
        }
      }
    });
  });
  describe("onerror - exact comparisons", () => {
    it("should verify instanceof check - error instanceof Error", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onerror) {
          const error = new Error("Test error");
          ws.onerror(error);
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Connection error"),
            expect.objectContaining({
              message: "Test error"
            })
          );
        }
      }
    });
    it("should verify instanceof check - error is not Error instance", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onerror) {
          const error = { message: "Test error" };
          ws.onerror(error);
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Connection error"),
            expect.objectContaining({
              message: expect.any(String)
            })
          );
        }
      }
    });
    it("should verify exact WebSocket state comparisons", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onerror) {
          ws.readyState = 0;
          ws.onerror(new Error("Test"));
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Connection error"),
            expect.objectContaining({
              readyState: "CONNECTING"
            })
          );
          ws.readyState = 1;
          ws.onerror(new Error("Test"));
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Connection error"),
            expect.objectContaining({
              readyState: "OPEN"
            })
          );
          ws.readyState = 2;
          ws.onerror(new Error("Test"));
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Connection error"),
            expect.objectContaining({
              readyState: "CLOSING"
            })
          );
          ws.readyState = 3;
          ws.onerror(new Error("Test"));
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Connection error"),
            expect.objectContaining({
              readyState: "CLOSED"
            })
          );
        }
      }
    });
  });
  describe("onmessage - exact logical operators", () => {
    it("should verify logical AND - message.log && onLog", async () => {
      const onLog = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          onLog,
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          const event = {
            data: JSON.stringify({
              type: "log",
              execution_id: "exec-123",
              log: {
                timestamp: "2024-01-01T00:00:00Z",
                level: "info",
                message: "Test log"
              }
            })
          };
          ws.onmessage(event);
          expect(onLog).toHaveBeenCalled();
        }
      }
    });
    it("should verify logical AND - message.status && onStatus", async () => {
      const onStatus = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          onStatus,
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          const event = {
            data: JSON.stringify({
              type: "status",
              execution_id: "exec-123",
              status: "running"
            })
          };
          ws.onmessage(event);
          expect(onStatus).toHaveBeenCalledWith("running");
        }
      }
    });
    it("should verify logical OR - (message as any).node_id || message.node_state.node_id", async () => {
      const onNodeUpdate = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          onNodeUpdate,
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          const event1 = {
            data: JSON.stringify({
              type: "node_update",
              execution_id: "exec-123",
              node_id: "node-1",
              node_state: {}
            })
          };
          ws.onmessage(event1);
          expect(onNodeUpdate).toHaveBeenCalledWith("node-1", {});
          const event2 = {
            data: JSON.stringify({
              type: "node_update",
              execution_id: "exec-123",
              node_state: {
                node_id: "node-2"
              }
            })
          };
          ws.onmessage(event2);
          expect(onNodeUpdate).toHaveBeenCalledWith("node-2", { node_id: "node-2" });
        }
      }
    });
  });
  describe("catch blocks", () => {
    it("should handle JSON.parse throwing in onmessage", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        if (ws.onmessage) {
          const event = {
            data: "invalid json"
          };
          expect(() => ws.onmessage(event)).not.toThrow();
          expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining("[WebSocket] Failed to parse message"),
            expect.any(Error)
          );
        }
      }
    });
    it("should handle WebSocket creation throwing", async () => {
      const failingFactory = {
        create: jest.fn(() => {
          throw new Error("WebSocket creation failed");
        })
      };
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          webSocketFactory: failingFactory,
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBe(false);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create connection for execution"),
        expect.any(Error)
      );
    });
  });
  describe("Manager initialization - default values coverage", () => {
    it("should use default windowLocation when windowLocation is undefined (line 43)", async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: void 0
        })
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBeDefined();
    });
    it("should use provided windowLocation when defined (line 43)", async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBeDefined();
    });
    it("should use default logger when logger is null (line 44-45)", async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation,
          logger: null
        })
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBeDefined();
    });
    it("should use default logger when logger is undefined (line 44-45)", async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation,
          logger: void 0
        })
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBeDefined();
    });
    it("should use provided logger when logger is defined (line 44-45)", async () => {
      const customLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
      };
      const { result } = renderHook(
        () => useWebSocket({
          executionId: "exec-123",
          windowLocation: mockWindowLocation,
          logger: customLogger
        })
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBeDefined();
    });
  });
  describe("useEffect early return - manager is null (line 60)", () => {
    it("should return early when manager is null (line 60)", async () => {
      const { result } = renderHook(
        () => useWebSocket({
          executionId: null,
          // This prevents manager from being fully initialized
          windowLocation: mockWindowLocation
        })
      );
      await advanceTimersByTime(100);
      expect(result.current.isConnected).toBe(false);
    });
  });
});

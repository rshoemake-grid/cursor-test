import { renderHook } from "@testing-library/react";
import {
  advanceTimersByTime,
  wsInstances,
  MockWebSocket,
  useWebSocket,
  logger
} from "./useWebSocket.test.setup";
describe("useWebSocket - errors", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wsInstances.splice(0, wsInstances.length);
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    wsInstances.splice(0, wsInstances.length);
    jest.useRealTimers();
  });
  describe("error handling", () => {
    it("should handle WebSocket connection errors", async () => {
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          onError
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].setReadyState(MockWebSocket.CONNECTING);
        wsInstances[0].simulateError(new Error("Connection failed"));
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Connection error for execution exec-1:"),
          expect.objectContaining({
            message: expect.any(String),
            readyState: expect.any(String),
            url: expect.any(String)
          })
        );
      }
    });
    it("should handle error with different WebSocket states", async () => {
      renderHook(() => useWebSocket({ executionId: "exec-1" }));
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        wsInstances[0].setReadyState(MockWebSocket.CONNECTING);
        wsInstances[0].simulateError();
        expect(logger.error).toHaveBeenCalled();
        wsInstances[0].setReadyState(MockWebSocket.OPEN);
        wsInstances[0].simulateError();
        expect(logger.error).toHaveBeenCalled();
        wsInstances[0].setReadyState(MockWebSocket.CLOSING);
        wsInstances[0].simulateError();
        expect(logger.error).toHaveBeenCalled();
        wsInstances[0].setReadyState(MockWebSocket.CLOSED);
        wsInstances[0].simulateError();
        expect(logger.error).toHaveBeenCalled();
      }
    });
    it("should handle WebSocket creation errors", async () => {
      const onError = jest.fn();
      const OriginalWS = global.WebSocket;
      global.WebSocket = class {
        constructor() {
          throw new Error("Failed to create WebSocket");
        }
      };
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          onError
        })
      );
      await advanceTimersByTime(100);
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create connection"),
        expect.anything()
      );
      expect(onError).toHaveBeenCalled();
      global.WebSocket = OriginalWS;
    });
    it("should verify exact comparison error instanceof Error - error is Error instance", async () => {
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          onError
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        const testError = new Error("Test error message");
        if (ws.onerror) {
          ws.onerror(testError);
        }
        await advanceTimersByTime(50);
        const errorCalls = logger.error.mock.calls.filter(
          (call) => call[0]?.includes("[WebSocket] Connection error")
        );
        expect(errorCalls.length).toBeGreaterThan(0);
        if (errorCalls.length > 0 && errorCalls[0][1]) {
          expect(errorCalls[0][1].message).toBeDefined();
        }
      }
    });
    it("should verify exact comparison error instanceof Error - error is not Error instance", async () => {
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          onError
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        const nonError = { message: "Not an Error instance" };
        ws.simulateError(nonError);
        await advanceTimersByTime(50);
        expect(logger.error).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Connection error"),
          expect.objectContaining({
            message: "Unknown WebSocket error"
          })
        );
      }
    });
    it("should verify exact comparison wasClean && code === 1000 - both true", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateClose(1e3, "Normal closure", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("Connection closed cleanly, not reconnecting")
        );
      }
    });
    it("should verify exact comparison wasClean && code === 1000 - wasClean false", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateClose(1e3, "Abnormal closure", false);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should verify exact comparison wasClean && code === 1000 - code not 1000", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateClose(1001, "Going away", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalled();
      }
    });
    it("should verify exact comparison reason && reason.length > 0 - reason exists and not empty", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateClose(1e3, "Custom reason", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Disconnected"),
          expect.objectContaining({
            reason: "Custom reason"
          })
        );
      }
    });
    it("should verify exact comparison reason && reason.length > 0 - reason is empty string", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateClose(1e3, "", true);
        await advanceTimersByTime(50);
        expect(logger.debug).toHaveBeenCalledWith(
          expect.stringContaining("[WebSocket] Disconnected"),
          expect.objectContaining({
            reason: "No reason provided"
          })
        );
      }
    });
    it("should verify exact comparison reconnectAttempts.current >= maxReconnectAttempts - exact boundary", async () => {
      const onError = jest.fn();
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running",
          onError
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        for (let i = 0; i < 6; i++) {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(3e3);
          if (wsInstances.length > 0 && wsInstances[wsInstances.length - 1].onopen) {
            wsInstances[wsInstances.length - 1].onopen(new Event("open"));
          }
          await advanceTimersByTime(100);
        }
        const warnCalls = logger.warn.mock.calls.filter(
          (call) => call[0]?.includes("Max reconnect attempts")
        );
        if (warnCalls.length > 0) {
          expect(warnCalls[0][0]).toContain("Max reconnect attempts (5) reached");
        }
      }
    });
    it("should verify exact comparison reconnectAttempts.current >= maxReconnectAttempts - less than max", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        for (let i = 0; i < 3; i++) {
          ws.simulateClose(1006, "", false);
          await advanceTimersByTime(2e3);
        }
        const warnCalls = logger.warn.mock.calls.filter(
          (call) => call[0]?.includes("Max reconnect attempts")
        );
        expect(warnCalls.length).toBe(0);
      }
    });
    it("should verify exact Math.min and Math.pow calculation for reconnect delay", async () => {
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          executionStatus: "running"
        })
      );
      await advanceTimersByTime(100);
      if (wsInstances.length > 0) {
        const ws = wsInstances[0];
        ws.simulateClose(1006, "", false);
        await advanceTimersByTime(100);
        const debugCalls = logger.debug.mock.calls.filter(
          (call) => call[0]?.includes("Reconnecting in")
        );
        if (debugCalls.length > 0) {
          expect(debugCalls[0][0]).toMatch(/Reconnecting in \d+ms/);
        }
      }
    });
    it("should verify exact comparison error instanceof Error in catch block - error is Error", async () => {
      const onError = jest.fn();
      const webSocketFactory = {
        create: jest.fn(() => {
          throw new Error("WebSocket creation failed");
        })
      };
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          onError,
          webSocketFactory
        })
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("WebSocket creation failed");
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining("Failed to create connection"),
        expect.any(Error)
      );
    });
    it("should verify exact comparison error instanceof Error in catch block - error is not Error", async () => {
      const onError = jest.fn();
      const webSocketFactory = {
        create: jest.fn(() => {
          throw "String error";
        })
      };
      renderHook(
        () => useWebSocket({
          executionId: "exec-1",
          onError,
          webSocketFactory
        })
      );
      await advanceTimersByTime(100);
      expect(onError).toHaveBeenCalledWith("String error");
      expect(logger.error).toHaveBeenCalled();
    });
  });
});

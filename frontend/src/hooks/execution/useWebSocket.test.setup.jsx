var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { waitFor, act } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
const advanceTimersByTime = async (ms) => {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
};
import { useWebSocket } from "./useWebSocket";
import { logger } from "../../utils/logger";
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}));
const _MockWebSocket = class _MockWebSocket {
  constructor(url) {
    __publicField(this, "readyState", _MockWebSocket.CONNECTING);
    __publicField(this, "url");
    __publicField(this, "onopen", null);
    __publicField(this, "onmessage", null);
    __publicField(this, "onerror", null);
    __publicField(this, "onclose", null);
    __publicField(this, "timers", []);
    this.url = url;
    const timer = setTimeout(() => {
      if (this.readyState === _MockWebSocket.CONNECTING) {
        this.readyState = _MockWebSocket.OPEN;
        if (this.onopen) {
          this.onopen(new Event("open"));
        }
      }
      const index = this.timers.indexOf(timer);
      if (index > -1) {
        this.timers.splice(index, 1);
      }
    }, 10);
    this.timers.push(timer);
  }
   
  send(_data) {
  }
  /**
   * Closes the WebSocket connection.
   * @param code - Optional close code (defaults to 1000)
   * @param reason - Optional close reason string
   * @param wasClean - Optional flag indicating if the connection closed cleanly.
   *                   If not provided, will be calculated from code (code === 1000).
   *                   Allows tests to control wasClean independently of code.
   */
  close(code, reason, wasClean) {
    this.clearTimers();
    this.readyState = _MockWebSocket.CLOSING;
    const timer = setTimeout(() => {
      this.readyState = _MockWebSocket.CLOSED;
      if (this.onclose) {
        const closeCode = code || 1e3;
        const wasCleanValue = wasClean !== void 0 ? wasClean : closeCode === 1e3;
        const event = new CloseEvent("close", { code: closeCode, reason: reason || "", wasClean: wasCleanValue });
        this.onclose(event);
      }
      const index = this.timers.indexOf(timer);
      if (index > -1) {
        this.timers.splice(index, 1);
      }
    }, 10);
    this.timers.push(timer);
  }
  // Clear all pending timers to prevent memory leaks
  clearTimers() {
    this.timers.forEach((timer) => {
      clearTimeout(timer);
    });
    this.timers = [];
  }
  // Helper methods for testing
  simulateOpen() {
    this.readyState = _MockWebSocket.OPEN;
    if (this.onopen) {
      this.onopen(new Event("open"));
    }
  }
  simulateMessage(data) {
    if (this.onmessage) {
      const event = new MessageEvent("message", { data: JSON.stringify(data) });
      this.onmessage(event);
    }
  }
  simulateError(error) {
    if (this.onerror) {
      const event = new ErrorEvent("error", { error: error || new Error("WebSocket error") });
      this.onerror(event);
    }
  }
  /**
   * Simulates a WebSocket close event for testing.
   * Note: This method directly creates a CloseEvent and does not call close().
   * This allows precise control over the close event properties for testing.
   * @param code - Close code (defaults to 1000)
   * @param reason - Close reason string (defaults to empty string)
   * @param wasClean - Whether the connection closed cleanly (defaults to true)
   */
  simulateClose(code = 1e3, reason = "", wasClean = true) {
    this.clearTimers();
    if (this.onclose) {
      const event = Object.create(CloseEvent.prototype);
      Object.defineProperties(event, {
        type: { value: "close", enumerable: true },
        code: { value: code, enumerable: true },
        reason: { value: reason || "", enumerable: true },
        wasClean: { value: wasClean, enumerable: true },
        cancelBubble: { value: false, enumerable: true },
        defaultPrevented: { value: false, enumerable: true },
        timeStamp: { value: Date.now(), enumerable: true }
      });
      this.onclose(event);
    }
  }
  setReadyState(state) {
    this.readyState = state;
  }
};
__publicField(_MockWebSocket, "CONNECTING", 0);
__publicField(_MockWebSocket, "OPEN", 1);
__publicField(_MockWebSocket, "CLOSING", 2);
__publicField(_MockWebSocket, "CLOSED", 3);
let MockWebSocket = _MockWebSocket;
const wsInstances = [];
const OriginalWebSocket = global.WebSocket;
global.WebSocket = class extends MockWebSocket {
  constructor(url) {
    super(url);
    wsInstances.push(this);
  }
};
export {
  MockWebSocket,
  OriginalWebSocket,
  advanceTimersByTime,
  logger,
  useWebSocket,
  waitForWithTimeout,
  wsInstances
};

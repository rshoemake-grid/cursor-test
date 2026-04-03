import {
  isValidWebSocket,
  hasPendingReconnection,
  sanitizeReconnectionDelay,
  isCleanClosure,
  getCloseReason,
} from "./websocketValidation";
import { WS_CLOSE_CODES } from "./websocketConstants";
describe("websocketValidation", () => {
  describe("isValidWebSocket", () => {
    it("should return false for null", () => {
      expect(isValidWebSocket(null)).toBe(false);
    });
    it("should return false for undefined (cast as null)", () => {
      expect(isValidWebSocket(void 0)).toBe(false);
    });
    it("should return true for WebSocket with OPEN state", () => {
      const mockWs = {
        readyState: 1,
        // WebSocket.OPEN
      };
      expect(isValidWebSocket(mockWs)).toBe(true);
    });
    it("should return false for WebSocket with CONNECTING state", () => {
      const mockWs = {
        readyState: 0,
        // WebSocket.CONNECTING
      };
      expect(isValidWebSocket(mockWs)).toBe(false);
    });
    it("should return false for WebSocket with CLOSING state", () => {
      const mockWs = {
        readyState: 2,
        // WebSocket.CLOSING
      };
      expect(isValidWebSocket(mockWs)).toBe(false);
    });
    it("should return false for WebSocket with CLOSED state", () => {
      const mockWs = {
        readyState: 3,
        // WebSocket.CLOSED
      };
      expect(isValidWebSocket(mockWs)).toBe(false);
    });
  });
  describe("hasPendingReconnection", () => {
    it("should return false for null", () => {
      expect(hasPendingReconnection(null)).toBe(false);
    });
    it("should return false for undefined (cast as null)", () => {
      expect(hasPendingReconnection(void 0)).toBe(false);
    });
    it("should return true for valid timeout", () => {
      const timeout = setTimeout(() => {}, 1e3);
      expect(hasPendingReconnection(timeout)).toBe(true);
      clearTimeout(timeout);
    });
  });
  describe("sanitizeReconnectionDelay", () => {
    it("should return delay within valid range", () => {
      expect(sanitizeReconnectionDelay(1e3)).toBe(1e3);
      expect(sanitizeReconnectionDelay(5e3)).toBe(5e3);
      expect(sanitizeReconnectionDelay(3e4)).toBe(3e4);
    });
    it("should return MIN_DELAY for delay < 1", () => {
      expect(sanitizeReconnectionDelay(0)).toBe(1);
      expect(sanitizeReconnectionDelay(-1)).toBe(1);
      expect(sanitizeReconnectionDelay(-100)).toBe(1);
    });
    it("should return MAX_DELAY for delay > 60000", () => {
      expect(sanitizeReconnectionDelay(60001)).toBe(6e4);
      expect(sanitizeReconnectionDelay(1e5)).toBe(6e4);
    });
    it("should verify exact boundary - delay === 1", () => {
      expect(sanitizeReconnectionDelay(1)).toBe(1);
    });
    it("should verify exact boundary - delay === 60000", () => {
      expect(sanitizeReconnectionDelay(6e4)).toBe(6e4);
    });
    it("should verify exact boundary - delay === 0", () => {
      expect(sanitizeReconnectionDelay(0)).toBe(1);
    });
    it("should verify exact boundary - delay === 60001", () => {
      expect(sanitizeReconnectionDelay(60001)).toBe(6e4);
    });
  });
  describe("isCleanClosure", () => {
    it("should return true for clean closure with code 1000", () => {
      const event = {
        wasClean: true,
        code: WS_CLOSE_CODES.NORMAL_CLOSURE,
      };
      expect(isCleanClosure(event)).toBe(true);
    });
    it("should return false for clean closure with code !== 1000", () => {
      const event = {
        wasClean: true,
        code: 1001,
      };
      expect(isCleanClosure(event)).toBe(false);
    });
    it("should return false for unclean closure with code 1000", () => {
      const event = {
        wasClean: false,
        code: WS_CLOSE_CODES.NORMAL_CLOSURE,
      };
      expect(isCleanClosure(event)).toBe(false);
    });
    it("should return false for unclean closure with code !== 1000", () => {
      const event = {
        wasClean: false,
        code: 1006,
      };
      expect(isCleanClosure(event)).toBe(false);
    });
    it("should verify exact comparison - wasClean === true && code === 1000", () => {
      const event = {
        wasClean: true,
        code: WS_CLOSE_CODES.NORMAL_CLOSURE,
      };
      expect(isCleanClosure(event)).toBe(true);
    });
  });
  describe("getCloseReason", () => {
    it("should return reason when present and non-empty", () => {
      const event = {
        reason: "Connection closed normally",
      };
      expect(getCloseReason(event)).toBe("Connection closed normally");
    });
    it("should return default when reason is null", () => {
      const event = {
        reason: null,
      };
      expect(getCloseReason(event)).toBe("No reason provided");
    });
    it("should return default when reason is undefined", () => {
      const event = {
        reason: void 0,
      };
      expect(getCloseReason(event)).toBe("No reason provided");
    });
    it("should return default when reason is empty string", () => {
      const event = {
        reason: "",
      };
      expect(getCloseReason(event)).toBe("No reason provided");
    });
    it("should verify exact check - reason.length > 0", () => {
      const event = {
        reason: "a",
        // length === 1 > 0
      };
      expect(getCloseReason(event)).toBe("a");
    });
    it("should verify exact check - reason.length === 0", () => {
      const event = {
        reason: "",
      };
      expect(getCloseReason(event)).toBe("No reason provided");
    });
  });
});

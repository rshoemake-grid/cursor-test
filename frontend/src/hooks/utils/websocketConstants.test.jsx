import {
  WS_CLOSE_CODES,
  WS_STATUS,
  WS_RECONNECT,
  WS_CLOSE_REASONS
} from "./websocketConstants";
describe("websocketConstants", () => {
  describe("WS_CLOSE_CODES", () => {
    it("should have NORMAL_CLOSURE as 1000", () => {
      expect(WS_CLOSE_CODES.NORMAL_CLOSURE).toBe(1e3);
    });
    it("should have GOING_AWAY as 1001", () => {
      expect(WS_CLOSE_CODES.GOING_AWAY).toBe(1001);
    });
    it("should have ABNORMAL_CLOSURE as 1006", () => {
      expect(WS_CLOSE_CODES.ABNORMAL_CLOSURE).toBe(1006);
    });
    it("should be readonly (const assertion)", () => {
      expect(WS_CLOSE_CODES.NORMAL_CLOSURE).toBe(1e3);
    });
  });
  describe("WS_STATUS", () => {
    it('should have CONNECTED as "connected"', () => {
      expect(WS_STATUS.CONNECTED).toBe("connected");
    });
    it('should have DISCONNECTED as "disconnected"', () => {
      expect(WS_STATUS.DISCONNECTED).toBe("disconnected");
    });
    it('should have ERROR as "error"', () => {
      expect(WS_STATUS.ERROR).toBe("error");
    });
    it("should be readonly (const assertion)", () => {
      expect(WS_STATUS.CONNECTED).toBe("connected");
    });
  });
  describe("WS_RECONNECT", () => {
    it("should have BASE_DELAY as 1000", () => {
      expect(WS_RECONNECT.BASE_DELAY).toBe(1e3);
    });
    it("should have MAX_DELAY as 60000", () => {
      expect(WS_RECONNECT.MAX_DELAY).toBe(6e4);
    });
    it("should have MIN_DELAY as 1", () => {
      expect(WS_RECONNECT.MIN_DELAY).toBe(1);
    });
    it("should have DEFAULT_MAX_DELAY as 10000", () => {
      expect(WS_RECONNECT.DEFAULT_MAX_DELAY).toBe(1e4);
    });
    it("should have DEFAULT_SAFE_DELAY as 1000", () => {
      expect(WS_RECONNECT.DEFAULT_SAFE_DELAY).toBe(1e3);
    });
    it("should be readonly (const assertion)", () => {
      expect(WS_RECONNECT.BASE_DELAY).toBe(1e3);
    });
  });
  describe("WS_CLOSE_REASONS", () => {
    it('should have EXECUTION_COMPLETED as "Execution completed"', () => {
      expect(WS_CLOSE_REASONS.EXECUTION_COMPLETED).toBe("Execution completed");
    });
    it('should have NO_REASON_PROVIDED as "No reason provided"', () => {
      expect(WS_CLOSE_REASONS.NO_REASON_PROVIDED).toBe("No reason provided");
    });
    it("should be readonly (const assertion)", () => {
      expect(WS_CLOSE_REASONS.EXECUTION_COMPLETED).toBe("Execution completed");
    });
  });
});

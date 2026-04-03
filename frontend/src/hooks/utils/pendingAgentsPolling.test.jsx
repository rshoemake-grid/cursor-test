import { createPendingAgentsPolling } from "./pendingAgentsPolling";
import { PENDING_AGENTS } from "./marketplaceConstants";
describe("pendingAgentsPolling", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });
  describe("createPendingAgentsPolling", () => {
    it("should call checkPendingAgents at intervals", () => {
      const checkPendingAgents = jest.fn();
      const logger = { debug: jest.fn() };
      const { cleanup } = createPendingAgentsPolling(
        checkPendingAgents,
        logger,
      );
      expect(checkPendingAgents).not.toHaveBeenCalled();
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL);
      expect(checkPendingAgents).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL);
      expect(checkPendingAgents).toHaveBeenCalledTimes(2);
      cleanup();
    });
    it("should stop polling after max checks", () => {
      const checkPendingAgents = jest.fn();
      const logger = { debug: jest.fn() };
      createPendingAgentsPolling(checkPendingAgents, logger);
      for (let i = 0; i < PENDING_AGENTS.MAX_CHECKS; i++) {
        jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL);
      }
      expect(checkPendingAgents).toHaveBeenCalledTimes(
        PENDING_AGENTS.MAX_CHECKS,
      );
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL);
      expect(checkPendingAgents).toHaveBeenCalledTimes(
        PENDING_AGENTS.MAX_CHECKS,
      );
    });
    it("should stop polling when cleanup is called", () => {
      const checkPendingAgents = jest.fn();
      const logger = { debug: jest.fn() };
      const { cleanup } = createPendingAgentsPolling(
        checkPendingAgents,
        logger,
      );
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL);
      expect(checkPendingAgents).toHaveBeenCalledTimes(1);
      cleanup();
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL * 5);
      expect(checkPendingAgents).toHaveBeenCalledTimes(1);
    });
    it("should return interval and cleanup function", () => {
      const checkPendingAgents = jest.fn();
      const logger = { debug: jest.fn() };
      const result = createPendingAgentsPolling(checkPendingAgents, logger);
      expect(result).toHaveProperty("interval");
      expect(result).toHaveProperty("cleanup");
      expect(typeof result.cleanup).toBe("function");
    });
    it("should use correct interval from constants", () => {
      const checkPendingAgents = jest.fn();
      const logger = { debug: jest.fn() };
      createPendingAgentsPolling(checkPendingAgents, logger);
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL);
      expect(checkPendingAgents).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL - 1);
      expect(checkPendingAgents).toHaveBeenCalledTimes(1);
      jest.advanceTimersByTime(1);
      expect(checkPendingAgents).toHaveBeenCalledTimes(2);
    });
    it("should use correct max checks from constants", () => {
      const checkPendingAgents = jest.fn();
      const logger = { debug: jest.fn() };
      createPendingAgentsPolling(checkPendingAgents, logger);
      for (let i = 0; i < PENDING_AGENTS.MAX_CHECKS; i++) {
        jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL);
      }
      expect(checkPendingAgents).toHaveBeenCalledTimes(
        PENDING_AGENTS.MAX_CHECKS,
      );
      jest.advanceTimersByTime(PENDING_AGENTS.CHECK_INTERVAL);
      expect(checkPendingAgents).toHaveBeenCalledTimes(
        PENDING_AGENTS.MAX_CHECKS,
      );
    });
  });
});

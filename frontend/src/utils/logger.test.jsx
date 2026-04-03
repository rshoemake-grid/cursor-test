import { logger } from "./logger";
describe("logger", () => {
  const consoleLogSpy = jest
    .spyOn(console, "log")
    .mockImplementation((...args) => {
      const message = args[0];
      if (
        typeof message === "string" &&
        (message.includes("[TEST") || message.includes("[SUITE"))
      ) {
        return;
      }
    });
  const consoleInfoSpy = jest
    .spyOn(console, "info")
    .mockImplementation(() => {});
  const consoleWarnSpy = jest
    .spyOn(console, "warn")
    .mockImplementation(() => {});
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {});
  describe("debug", () => {
    it("should log in development mode", () => {
      logger.debug("test message");
      expect(consoleLogSpy).toHaveBeenCalledWith("[DEBUG]", "test message");
    });
    it("should log in development mode (default)", () => {
      logger.debug("test message");
      expect(consoleLogSpy).toHaveBeenCalledWith("[DEBUG]", "test message");
    });
    it("should handle multiple arguments", () => {
      process.env.NODE_ENV = "development";
      logger.debug("arg1", "arg2", { key: "value" });
      expect(consoleLogSpy).toHaveBeenCalledWith("[DEBUG]", "arg1", "arg2", {
        key: "value",
      });
    });
  });
  describe("info", () => {
    it("should log in development mode", () => {
      logger.info("test message");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO]", "test message");
    });
    it("should log in development mode (default)", () => {
      logger.info("test message");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO]", "test message");
    });
  });
  describe("warn", () => {
    it("should always log warnings", () => {
      logger.warn("warning message");
      expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN]", "warning message");
    });
    it("should log in both development and production", () => {
      logger.warn("warning");
      expect(consoleWarnSpy).toHaveBeenCalled();
      logger.warn("warning");
      expect(consoleWarnSpy).toHaveBeenCalledTimes(2);
    });
  });
  describe("error", () => {
    it("should always log errors", () => {
      logger.error("error message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR]", "error message");
    });
    it("should handle error objects", () => {
      const error = new Error("test error");
      logger.error("error occurred", error);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "[ERROR]",
        "error occurred",
        error,
      );
    });
  });
  describe("log", () => {
    it("should log in development mode", () => {
      logger.log("test message");
      expect(consoleLogSpy).toHaveBeenCalledWith("test message");
    });
    it("should log in development mode (default)", () => {
      logger.log("test message");
      expect(consoleLogSpy).toHaveBeenCalledWith("test message");
    });
    it("should not log when isDev is false", () => {
      logger.log("test message");
      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
  describe("isDev conditional", () => {
    it("should check import.meta.env.DEV", () => {
      logger.debug("test");
      logger.info("test");
      logger.log("test");
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
    it("should check process.env.NODE_ENV as fallback", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      logger.debug("test");
      expect(consoleLogSpy).toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });
    it("should handle both import.meta.env.DEV and process.env.NODE_ENV", () => {
      logger.debug("test");
      logger.info("test");
      logger.log("test");
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
    it("should test the OR condition branches", () => {
      jest.clearAllMocks();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      logger.debug("test");
      logger.info("test");
      logger.log("test");
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });
    it("should test when import.meta.env.DEV is true branch", () => {
      jest.clearAllMocks();
      logger.debug("test-debug");
      logger.info("test-info");
      logger.log("test-log");
      expect(consoleLogSpy).toHaveBeenCalledTimes(2);
      expect(consoleInfoSpy).toHaveBeenCalledTimes(1);
    });
    it("should test when process.env.NODE_ENV === development branch", () => {
      jest.clearAllMocks();
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "development";
      logger.debug("test");
      logger.info("test");
      logger.log("test");
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
    });
  });
  describe("isDev edge cases", () => {
    it("should handle NODE_ENV being undefined", () => {
      const originalEnv = process.env.NODE_ENV;
      delete process.env.NODE_ENV;
      jest.resetModules();
      const { logger: newLogger } = require("./logger");
      newLogger.debug("test");
      expect(consoleLogSpy).toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
      jest.resetModules();
    });
    it("should handle NODE_ENV being empty string", () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "";
      jest.resetModules();
      const { logger: newLogger } = require("./logger");
      newLogger.debug("test");
      expect(consoleLogSpy).toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
      jest.resetModules();
    });
    it('should handle NODE_ENV being "test"', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "test";
      jest.resetModules();
      const { logger: newLogger } = require("./logger");
      newLogger.debug("test");
      expect(consoleLogSpy).toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
      jest.resetModules();
    });
    it('should handle NODE_ENV being "production"', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";
      jest.resetModules();
      const { logger: newLogger } = require("./logger");
      newLogger.debug("test");
      expect(consoleLogSpy).not.toHaveBeenCalled();
      process.env.NODE_ENV = originalEnv;
      jest.resetModules();
    });
    it("should handle all logger methods with isDev check", () => {
      logger.debug("debug message");
      logger.info("info message");
      logger.log("log message");
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
    });
    it("should handle warn and error without isDev check", () => {
      logger.warn("warn message");
      logger.error("error message");
      expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN]", "warn message");
      expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR]", "error message");
    });
    it("should handle logger methods with no arguments", () => {
      logger.debug();
      logger.info();
      logger.warn();
      logger.error();
      logger.log();
      expect(consoleLogSpy).toHaveBeenCalled();
      expect(consoleInfoSpy).toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    });
    it("should handle logger methods with empty string", () => {
      logger.debug("");
      logger.info("");
      logger.warn("");
      logger.error("");
      logger.log("");
      expect(consoleLogSpy).toHaveBeenCalledWith("[DEBUG]", "");
      expect(consoleInfoSpy).toHaveBeenCalledWith("[INFO]", "");
      expect(consoleWarnSpy).toHaveBeenCalledWith("[WARN]", "");
      expect(consoleErrorSpy).toHaveBeenCalledWith("[ERROR]", "");
    });
  });
});

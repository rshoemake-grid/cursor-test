import { getLogLevelTone, isValidLogLevel } from "./logLevel";

describe("logLevel utilities", () => {
  describe("getLogLevelTone", () => {
    it("should return error for ERROR level", () => {
      expect(getLogLevelTone("ERROR")).toBe("error");
    });
    it("should return warning for WARNING level", () => {
      expect(getLogLevelTone("WARNING")).toBe("warning");
    });
    it("should return info for INFO level", () => {
      expect(getLogLevelTone("INFO")).toBe("info");
    });
    it("should return debug for DEBUG level", () => {
      expect(getLogLevelTone("DEBUG")).toBe("debug");
    });
    it("should default to info for unknown level", () => {
      expect(getLogLevelTone("unknown")).toBe("info");
      expect(getLogLevelTone("")).toBe("info");
    });
  });

  describe("isValidLogLevel", () => {
    it("should return true for valid log levels", () => {
      ["INFO", "WARNING", "ERROR", "DEBUG"].forEach((level) => {
        expect(isValidLogLevel(level)).toBe(true);
      });
    });
    it("should return false for invalid log levels", () => {
      ["unknown", "invalid", "", "123", "info", "error"].forEach((level) => {
        expect(isValidLogLevel(level)).toBe(false);
      });
    });
  });
});

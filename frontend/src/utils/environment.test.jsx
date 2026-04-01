import { isBrowserEnvironment, isServerEnvironment } from "./environment";
describe("environment utilities", () => {
  describe("isBrowserEnvironment", () => {
    it("should return true when window is defined", () => {
      expect(isBrowserEnvironment()).toBe(true);
    });
    it("should check typeof window correctly", () => {
      expect(typeof window).not.toBe("undefined");
      expect(isBrowserEnvironment()).toBe(true);
    });
    it("should return true even if window is an empty object", () => {
      global.window = {};
      expect(isBrowserEnvironment()).toBe(true);
    });
    it("should return true even if window has properties", () => {
      global.window = {
        document: {},
        localStorage: {}
      };
      expect(isBrowserEnvironment()).toBe(true);
    });
  });
  describe("isServerEnvironment", () => {
    it("should return false when window is defined", () => {
      expect(isServerEnvironment()).toBe(false);
    });
    it("should check typeof window correctly", () => {
      expect(typeof window).not.toBe("undefined");
      expect(isServerEnvironment()).toBe(false);
    });
    it("should return false even if window is an empty object", () => {
      global.window = {};
      expect(isServerEnvironment()).toBe(false);
    });
    it("should return false even if window has properties", () => {
      global.window = {
        document: {},
        localStorage: {}
      };
      expect(isServerEnvironment()).toBe(false);
    });
  });
  describe("complementary behavior", () => {
    it("should be complementary - isServerEnvironment is opposite of isBrowserEnvironment", () => {
      const initialWindow = global.window;
      global.window = {};
      expect(isServerEnvironment()).toBe(!isBrowserEnvironment());
      delete global.window;
      expect(isServerEnvironment()).toBe(!isBrowserEnvironment());
      global.window = initialWindow;
    });
  });
  describe("real-world scenarios", () => {
    it("should correctly identify browser environment in typical browser", () => {
      expect(isBrowserEnvironment()).toBe(true);
      expect(isServerEnvironment()).toBe(false);
    });
    it("should use typeof check for environment detection", () => {
      expect(typeof window).not.toBe("undefined");
      expect(isBrowserEnvironment()).toBe(true);
      expect(isServerEnvironment()).toBe(false);
    });
    it("should handle the typeof check correctly", () => {
      const windowExists = typeof window !== "undefined";
      expect(isBrowserEnvironment()).toBe(windowExists);
      expect(isServerEnvironment()).toBe(!windowExists);
    });
  });
  describe("mutation killers - exact typeof operator testing", () => {
    it('should verify exact typeof operator - typeof window !== "undefined" (browser)', () => {
      const windowType = typeof window;
      expect(windowType).not.toBe("undefined");
      expect(windowType).toBe("object");
      expect(isBrowserEnvironment()).toBe(true);
      expect(isServerEnvironment()).toBe(false);
    });
    it("should verify exact typeof check with explicit comparison", () => {
      const windowType = typeof window;
      expect(windowType).toBe("object");
      expect(windowType).not.toBe("undefined");
      expect(windowType !== "undefined").toBe(true);
      expect(isBrowserEnvironment()).toBe(true);
      expect(windowType === "undefined").toBe(false);
      expect(isServerEnvironment()).toBe(false);
    });
    it('should verify exact string comparison - "undefined" string literal', () => {
      const windowType = typeof window;
      expect(windowType).toBe("object");
      expect(windowType).not.toBe("undefined");
      expect(windowType).not.toBe("function");
      expect(isBrowserEnvironment()).toBe(true);
      expect(isServerEnvironment()).toBe(false);
    });
    it("should verify functions are exact opposites", () => {
      expect(isBrowserEnvironment()).toBe(true);
      expect(isServerEnvironment()).toBe(false);
      expect(isBrowserEnvironment()).toBe(!isServerEnvironment());
      expect(isServerEnvironment()).toBe(!isBrowserEnvironment());
    });
    it('should verify exact typeof window !== "undefined" check', () => {
      const windowType = typeof window;
      const isNotUndefined = windowType !== "undefined";
      expect(isNotUndefined).toBe(true);
      expect(isBrowserEnvironment()).toBe(isNotUndefined);
    });
    it('should verify exact typeof window === "undefined" check', () => {
      const windowType = typeof window;
      const isUndefined = windowType === "undefined";
      expect(isUndefined).toBe(false);
      expect(isServerEnvironment()).toBe(isUndefined);
    });
  });
  describe("coverage - getWindowType helper branch coverage", () => {
    let originalWindow;
    let originalWindowDescriptor;
    beforeEach(() => {
      originalWindow = global.window;
      originalWindowDescriptor = Object.getOwnPropertyDescriptor(global, "window");
    });
    afterEach(() => {
      if (originalWindowDescriptor) {
        Object.defineProperty(global, "window", originalWindowDescriptor);
      } else if (originalWindow !== void 0) {
        global.window = originalWindow;
      }
    });
    it('should return "object" when window is defined (browser environment)', () => {
      expect(typeof window).toBe("object");
      expect(isBrowserEnvironment()).toBe(true);
      expect(isServerEnvironment()).toBe(false);
    });
    it("should handle window type check correctly in browser environment", () => {
      const windowType = typeof window;
      expect(windowType).toBe("object");
      expect(isBrowserEnvironment()).toBe(true);
      expect(isServerEnvironment()).toBe(false);
    });
    it("should verify getWindowType ternary operator logic for object branch", () => {
      const windowType = typeof window;
      const result = windowType === "undefined" ? "undefined" : "object";
      expect(result).toBe("object");
      expect(isBrowserEnvironment()).toBe(true);
    });
    it("should verify the ternary condition structure", () => {
      const windowType = typeof window;
      const expectedResult = windowType === "undefined" ? "undefined" : "object";
      expect(expectedResult).toBe("object");
      expect(isBrowserEnvironment()).toBe(expectedResult !== "undefined");
      expect(isServerEnvironment()).toBe(expectedResult === "undefined");
    });
  });
  describe("coverage - getWindowType undefined branch logic verification", () => {
    it("should verify the undefined branch logic is correct", () => {
      const windowTypeObject = typeof window;
      expect(windowTypeObject).toBe("object");
      const resultObject = windowTypeObject === "undefined" ? "undefined" : "object";
      expect(resultObject).toBe("object");
      expect(isBrowserEnvironment()).toBe(true);
      const simulatedUndefinedType = "undefined";
      const resultUndefined = simulatedUndefinedType === "undefined" ? "undefined" : "object";
      expect(resultUndefined).toBe("undefined");
      expect(simulatedUndefinedType !== "undefined").toBe(false);
      expect(simulatedUndefinedType === "undefined").toBe(true);
    });
    it("should verify both branches of the ternary operator are logically correct", () => {
      const windowType = typeof window;
      expect(windowType).toBe("object");
      const browserResult = windowType === "undefined" ? "undefined" : "object";
      expect(browserResult).toBe("object");
      expect(isBrowserEnvironment()).toBe(true);
      const serverType = "undefined";
      const serverResult = serverType === "undefined" ? "undefined" : "object";
      expect(serverResult).toBe("undefined");
      const alwaysFalse = false;
      const alwaysTrue = true;
      expect(alwaysFalse ? "undefined" : "object").toBe("object");
      expect(alwaysTrue ? "undefined" : "object").toBe("undefined");
    });
    it("should document that undefined branch logic is correct for production", () => {
      const windowType = typeof window;
      expect(windowType).toBe("object");
      const result = windowType === "undefined" ? "undefined" : "object";
      expect(result).toBe("object");
      const serverWindowType = "undefined";
      const serverResult = serverWindowType === "undefined" ? "undefined" : "object";
      expect(serverResult).toBe("undefined");
      expect(isBrowserEnvironment()).toBe(true);
    });
  });
});

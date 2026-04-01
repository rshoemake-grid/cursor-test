import { createSafeError } from "./errorFactory";
describe("errorFactory", () => {
  describe("createSafeError", () => {
    it("should create a standard Error object with message and name", () => {
      const error = createSafeError("Test error message", "TestError");
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("Test error message");
      expect(error.name).toBe("TestError");
    });
    it("should create error with empty message if message is empty string", () => {
      const error = createSafeError("", "EmptyError");
      expect(error).toBeDefined();
      expect(error.message).toBe("");
      expect(error.name).toBe("EmptyError");
    });
    it("should create error with default name if name is empty string", () => {
      const error = createSafeError("Test message", "");
      expect(error).toBeDefined();
      expect(error.message).toBe("Test message");
      expect(error.name).toBe("");
    });
    it("should handle Error constructor being undefined", () => {
      const OriginalError = global.Error;
      global.Error = void 0;
      try {
        const error = createSafeError("Test error", "TestError");
        expect(error).toBeDefined();
        expect(error.message).toBe("Test error");
        expect(error.name).toBe("TestError");
      } finally {
        global.Error = OriginalError;
      }
    });
    it("should handle Error constructor throwing", () => {
      const OriginalError = global.Error;
      let callCount = 0;
      global.Error = function(message) {
        callCount++;
        if (callCount === 1) {
          throw new Error("Error constructor failed");
        }
        return new OriginalError(message);
      };
      global.Error.prototype = OriginalError.prototype;
      try {
        const error = createSafeError("Test error", "TestError");
        expect(error).toBeDefined();
        expect(error.message).toBe("Test error");
        expect(error.name).toBe("TestError");
      } finally {
        global.Error = OriginalError;
      }
    });
    it("should handle Function constructor being unavailable", () => {
      const OriginalFunction = global.Function;
      global.Function = void 0;
      try {
        const error = createSafeError("Test error", "TestError");
        expect(error).toBeDefined();
        expect(error.message).toBe("Test error");
        expect(error.name).toBe("TestError");
      } finally {
        global.Function = OriginalFunction;
      }
    });
    it("should never throw synchronously", () => {
      const OriginalError = global.Error;
      const OriginalFunction = global.Function;
      const scenarios = [
        () => {
          global.Error = void 0;
        },
        () => {
          global.Function = void 0;
        },
        () => {
          global.Error = function() {
            throw new Error("Fail");
          };
        }
      ];
      scenarios.forEach((setup, index) => {
        try {
          setup();
          const error = createSafeError("Test error", "TestError");
          expect(error).toBeDefined();
          expect(error.message).toBe("Test error");
          expect(error.name).toBe("TestError");
        } catch (e) {
          throw new Error(`createSafeError threw synchronously in scenario ${index}: ${e}`);
        } finally {
          global.Error = OriginalError;
          global.Function = OriginalFunction;
        }
      });
    });
    it("should create error-like object even when Error constructor completely fails", () => {
      const OriginalError = global.Error;
      global.Error = function() {
        throw new Error("Complete failure");
      };
      try {
        const error = createSafeError("Test error", "TestError");
        expect(error).toBeDefined();
        expect(error).toHaveProperty("message");
        expect(error).toHaveProperty("name");
        expect(error.message).toBe("Test error");
        expect(error.name).toBe("TestError");
      } finally {
        global.Error = OriginalError;
      }
    });
    it("should handle Object.create failing", () => {
      const OriginalObjectCreate = Object.create;
      Object.create = function() {
        throw new Error("Object.create failed");
      };
      try {
        const error = createSafeError("Test error", "TestError");
        expect(error).toBeDefined();
        expect(error.message).toBe("Test error");
        expect(error.name).toBe("TestError");
      } finally {
        Object.create = OriginalObjectCreate;
      }
    });
    it("should return error object with all required properties", () => {
      const error = createSafeError("Test message", "TestErrorName");
      expect(error).toHaveProperty("message");
      expect(error).toHaveProperty("name");
      expect(error.message).toBe("Test message");
      expect(error.name).toBe("TestErrorName");
      expect(error).toHaveProperty("stack");
    });
    it("should work with HttpClientError message", () => {
      const error = createSafeError("HTTP client is not properly initialized", "HttpClientError");
      expect(error.message).toBe("HTTP client is not properly initialized");
      expect(error.name).toBe("HttpClientError");
    });
    it("should work with InvalidUrlError message", () => {
      const error = createSafeError("URL cannot be empty", "InvalidUrlError");
      expect(error.message).toBe("URL cannot be empty");
      expect(error.name).toBe("InvalidUrlError");
    });
  });
});

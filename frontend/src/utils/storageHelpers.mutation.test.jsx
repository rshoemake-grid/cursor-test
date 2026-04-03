import {
  safeStorageGet,
  safeStorageSet,
  safeStorageRemove,
  safeStorageHas,
  safeStorageClear,
} from "./storageHelpers";
import { handleStorageError } from "./errorHandler";
jest.mock("./errorHandler", () => ({
  handleStorageError: jest.fn(),
}));
describe("storageHelpers - Mutation Killers", () => {
  let mockStorage;
  beforeEach(() => {
    jest.clearAllMocks();
    mockStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      clear: jest.fn(),
    };
  });
  describe("safeStorageGet - exact conditionals", () => {
    it("should verify exact falsy check - storage is null", () => {
      const result = safeStorageGet(null, "key", "default");
      expect(result).toBe("default");
    });
    it("should verify exact falsy check - storage is undefined", () => {
      const result = safeStorageGet(void 0, "key", "default");
      expect(result).toBe("default");
    });
    it("should verify exact falsy check - storage exists (should not return default)", () => {
      mockStorage.getItem.mockReturnValue('{"value": "test"}');
      const result = safeStorageGet(mockStorage, "key", "default");
      expect(result).toEqual({ value: "test" });
    });
    it("should verify exact OR - item === null", () => {
      mockStorage.getItem.mockReturnValue(null);
      const result = safeStorageGet(mockStorage, "key", "default");
      expect(result).toBe("default");
    });
    it("should verify exact OR - item === undefined", () => {
      mockStorage.getItem.mockReturnValue(void 0);
      const result = safeStorageGet(mockStorage, "key", "default");
      expect(result).toBe("default");
    });
    it("should verify exact OR - item exists (should not return default)", () => {
      mockStorage.getItem.mockReturnValue('{"value": "test"}');
      const result = safeStorageGet(mockStorage, "key", "default");
      expect(result).toEqual({ value: "test" });
    });
  });
  describe("safeStorageSet - exact conditionals and ternary", () => {
    it("should verify exact falsy check - storage is null", () => {
      const result = safeStorageSet(null, "key", "value");
      expect(result).toBe(false);
    });
    it("should verify exact falsy check - storage is undefined", () => {
      const result = safeStorageSet(void 0, "key", "value");
      expect(result).toBe(false);
    });
    it("should verify exact falsy check - storage exists (should set)", () => {
      const result = safeStorageSet(mockStorage, "key", "value");
      expect(result).toBe(true);
      expect(mockStorage.setItem).toHaveBeenCalled();
    });
    it("should verify exact ternary - value === undefined (should convert to null)", () => {
      safeStorageSet(mockStorage, "key", void 0);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "key",
        JSON.stringify(null),
      );
    });
    it("should verify exact ternary - value !== undefined (should use value)", () => {
      safeStorageSet(mockStorage, "key", "test");
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "key",
        JSON.stringify("test"),
      );
    });
    it("should verify exact ternary - value is null (should use null)", () => {
      safeStorageSet(mockStorage, "key", null);
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "key",
        JSON.stringify(null),
      );
    });
  });
  describe("safeStorageRemove - exact falsy check", () => {
    it("should verify exact falsy check - storage is null", () => {
      const result = safeStorageRemove(null, "key");
      expect(result).toBe(false);
    });
    it("should verify exact falsy check - storage is undefined", () => {
      const result = safeStorageRemove(void 0, "key");
      expect(result).toBe(false);
    });
    it("should verify exact falsy check - storage exists (should remove)", () => {
      const result = safeStorageRemove(mockStorage, "key");
      expect(result).toBe(true);
      expect(mockStorage.removeItem).toHaveBeenCalledWith("key");
    });
  });
  describe("safeStorageHas - exact falsy check and logical AND", () => {
    it("should verify exact falsy check - storage is null", () => {
      const result = safeStorageHas(null, "key");
      expect(result).toBe(false);
    });
    it("should verify exact falsy check - storage is undefined", () => {
      const result = safeStorageHas(void 0, "key");
      expect(result).toBe(false);
    });
    it("should verify exact falsy check - storage exists (should check)", () => {
      mockStorage.getItem.mockReturnValue("value");
      const result = safeStorageHas(mockStorage, "key");
      expect(result).toBe(true);
    });
    it("should verify exact AND - item !== null && item !== undefined (both true)", () => {
      mockStorage.getItem.mockReturnValue("value");
      const result = safeStorageHas(mockStorage, "key");
      expect(result).toBe(true);
    });
    it("should verify exact AND - item === null (first false)", () => {
      mockStorage.getItem.mockReturnValue(null);
      const result = safeStorageHas(mockStorage, "key");
      expect(result).toBe(false);
    });
    it("should verify exact AND - item === undefined (second false)", () => {
      mockStorage.getItem.mockReturnValue(void 0);
      const result = safeStorageHas(mockStorage, "key");
      expect(result).toBe(false);
    });
    it("should verify exact AND - item is empty string (should be true - not null/undefined)", () => {
      mockStorage.getItem.mockReturnValue("");
      const result = safeStorageHas(mockStorage, "key");
      expect(result).toBe(true);
    });
  });
  describe("safeStorageClear - exact falsy check and logical OR", () => {
    it("should verify exact falsy check - storage is null", () => {
      const result = safeStorageClear(null);
      expect(result).toBe(false);
    });
    it("should verify exact falsy check - storage is undefined", () => {
      const result = safeStorageClear(void 0);
      expect(result).toBe(false);
    });
    it("should verify exact OR - storage exists and has clear method (should clear)", () => {
      const result = safeStorageClear(mockStorage);
      expect(result).toBe(true);
      expect(mockStorage.clear).toHaveBeenCalled();
    });
    it("should verify exact OR - storage exists but no clear method (should return false)", () => {
      const storageWithoutClear = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
      };
      const result = safeStorageClear(storageWithoutClear);
      expect(result).toBe(false);
    });
    it("should verify exact typeof check - clear is not a function", () => {
      const storageWithNonFunctionClear = {
        getItem: jest.fn(),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        clear: "not a function",
      };
      const result = safeStorageClear(storageWithNonFunctionClear);
      expect(result).toBe(false);
    });
    it("should verify exact typeof check - clear is a function (should call)", () => {
      const result = safeStorageClear(mockStorage);
      expect(result).toBe(true);
      expect(mockStorage.clear).toHaveBeenCalled();
    });
  });
  describe("Error handling - exact method calls", () => {
    it("should verify exact method call - JSON.parse in safeStorageGet", () => {
      mockStorage.getItem.mockReturnValue('{"value": "test"}');
      safeStorageGet(mockStorage, "key", "default");
      expect(handleStorageError).not.toHaveBeenCalled();
    });
    it("should verify exact method call - JSON.parse throws (should handle error)", () => {
      mockStorage.getItem.mockReturnValue("{invalid json");
      const result = safeStorageGet(mockStorage, "key", "default");
      expect(result).toBe("default");
      expect(handleStorageError).toHaveBeenCalled();
    });
    it("should verify exact method call - JSON.stringify in safeStorageSet", () => {
      safeStorageSet(mockStorage, "key", { value: "test" });
      expect(mockStorage.setItem).toHaveBeenCalledWith(
        "key",
        JSON.stringify({ value: "test" }),
      );
    });
    it("should verify exact method call - storage.setItem throws (should handle error)", () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error("Quota exceeded");
      });
      const result = safeStorageSet(mockStorage, "key", "value");
      expect(result).toBe(false);
      expect(handleStorageError).toHaveBeenCalled();
    });
    it("should verify exact method call - storage.removeItem in safeStorageRemove", () => {
      safeStorageRemove(mockStorage, "key");
      expect(mockStorage.removeItem).toHaveBeenCalledWith("key");
    });
    it("should verify exact method call - storage.removeItem throws (should handle error)", () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error("Storage error");
      });
      const result = safeStorageRemove(mockStorage, "key");
      expect(result).toBe(false);
      expect(handleStorageError).toHaveBeenCalled();
    });
    it("should verify exact method call - storage.getItem in safeStorageHas", () => {
      mockStorage.getItem.mockReturnValue("value");
      safeStorageHas(mockStorage, "key");
      expect(mockStorage.getItem).toHaveBeenCalledWith("key");
    });
    it("should verify exact method call - storage.getItem throws (should handle error)", () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });
      const result = safeStorageHas(mockStorage, "key");
      expect(result).toBe(false);
      expect(handleStorageError).toHaveBeenCalled();
    });
    it("should verify exact method call - storage.clear in safeStorageClear", () => {
      safeStorageClear(mockStorage);
      expect(mockStorage.clear).toHaveBeenCalled();
    });
    it("should verify exact method call - storage.clear throws (should handle error)", () => {
      mockStorage.clear.mockImplementation(() => {
        throw new Error("Clear error");
      });
      const result = safeStorageClear(mockStorage);
      expect(result).toBe(false);
      expect(handleStorageError).toHaveBeenCalled();
    });
  });
  describe("Context parameter - exact property access", () => {
    it("should verify context is passed to error handler in safeStorageGet", () => {
      mockStorage.getItem.mockReturnValue("{invalid json");
      safeStorageGet(mockStorage, "key", "default", "TestContext");
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        "getItem",
        "key",
        expect.objectContaining({ context: "TestContext" }),
      );
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3]).toBeDefined();
      expect(callArgs[3].context).toBe("TestContext");
      expect(callArgs[3].context).not.toBeUndefined();
      expect(callArgs[3].context).not.toBeNull();
      expect(callArgs[3].context === "TestContext").toBe(true);
    });
    it("should verify context is undefined when not provided in safeStorageGet", () => {
      mockStorage.getItem.mockReturnValue("{invalid json");
      safeStorageGet(mockStorage, "key", "default");
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3].context).toBeUndefined();
    });
    it("should verify context is passed to error handler in safeStorageSet", () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error("Error");
      });
      safeStorageSet(mockStorage, "key", "value", "TestContext");
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        "setItem",
        "key",
        expect.objectContaining({ context: "TestContext" }),
      );
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3]).toBeDefined();
      expect(callArgs[3].context).toBe("TestContext");
      expect(callArgs[3].context).not.toBeUndefined();
      expect(callArgs[3].context).not.toBeNull();
      expect(callArgs[3].context === "TestContext").toBe(true);
    });
    it("should verify context is undefined when not provided in safeStorageSet", () => {
      mockStorage.setItem.mockImplementation(() => {
        throw new Error("Error");
      });
      safeStorageSet(mockStorage, "key", "value");
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3].context).toBeUndefined();
    });
    it("should verify context is passed to error handler in safeStorageRemove", () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error("Error");
      });
      safeStorageRemove(mockStorage, "key", "TestContext");
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        "removeItem",
        "key",
        expect.objectContaining({ context: "TestContext" }),
      );
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3]).toBeDefined();
      expect(callArgs[3].context).toBe("TestContext");
      expect(callArgs[3].context).not.toBeUndefined();
      expect(callArgs[3].context).not.toBeNull();
      expect(callArgs[3].context === "TestContext").toBe(true);
    });
    it("should verify context is undefined when not provided in safeStorageRemove", () => {
      mockStorage.removeItem.mockImplementation(() => {
        throw new Error("Error");
      });
      safeStorageRemove(mockStorage, "key");
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3].context).toBeUndefined();
    });
    it("should verify context is passed to error handler in safeStorageHas", () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error("Error");
      });
      safeStorageHas(mockStorage, "key", "TestContext");
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        "getItem",
        "key",
        expect.objectContaining({ context: "TestContext" }),
      );
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3]).toBeDefined();
      expect(callArgs[3].context).toBe("TestContext");
      expect(callArgs[3].context).not.toBeUndefined();
      expect(callArgs[3].context).not.toBeNull();
      expect(callArgs[3].context === "TestContext").toBe(true);
      expect(callArgs[3].context).not.toBeUndefined();
    });
    it("should verify context is undefined when not provided in safeStorageHas", () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error("Error");
      });
      safeStorageHas(mockStorage, "key");
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3].context).toBeUndefined();
    });
    it("should verify context is passed to error handler in safeStorageClear", () => {
      mockStorage.clear.mockImplementation(() => {
        throw new Error("Error");
      });
      safeStorageClear(mockStorage, "TestContext");
      expect(handleStorageError).toHaveBeenCalledWith(
        expect.any(Error),
        "clear",
        "all",
        expect.objectContaining({ context: "TestContext" }),
      );
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3]).toBeDefined();
      expect(callArgs[3].context).toBe("TestContext");
      expect(callArgs[3].context).not.toBeUndefined();
      expect(callArgs[3].context).not.toBeNull();
      expect(callArgs[3].context === "TestContext").toBe(true);
      expect(callArgs[3].context).not.toBeUndefined();
    });
    it("should verify context is undefined when not provided in safeStorageClear", () => {
      mockStorage.clear.mockImplementation(() => {
        throw new Error("Error");
      });
      safeStorageClear(mockStorage);
      const callArgs = handleStorageError.mock.calls[0];
      expect(callArgs[3].context).toBeUndefined();
    });
  });
});

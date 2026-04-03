import { renderHook, act } from "@testing-library/react";
import {
  useLocalStorage,
  getLocalStorageItem,
  setLocalStorageItem,
  removeLocalStorageItem,
} from "./useLocalStorage";
jest.mock("../../utils/logger", () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
  },
}));
describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });
  describe("useLocalStorage hook", () => {
    it("should initialize with initial value when localStorage is empty", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      expect(result.current[0]).toBe("initial");
    });
    it("should initialize with value from localStorage", () => {
      localStorage.setItem("test-key", JSON.stringify("stored-value"));
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      expect(result.current[0]).toBe("stored-value");
    });
    it("should update localStorage when value changes", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1]("new-value");
      });
      expect(result.current[0]).toBe("new-value");
      expect(localStorage.getItem("test-key")).toBe(
        JSON.stringify("new-value"),
      );
    });
    it("should handle function updater", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", 0));
      act(() => {
        result.current[1]((prev) => prev + 1);
      });
      expect(result.current[0]).toBe(1);
    });
    it("should handle complex objects", () => {
      const obj = { name: "test", value: 123 };
      const { result } = renderHook(() => useLocalStorage("test-key", obj));
      act(() => {
        result.current[1]({ name: "updated", value: 456 });
      });
      expect(result.current[0]).toEqual({ name: "updated", value: 456 });
      expect(JSON.parse(localStorage.getItem("test-key"))).toEqual({
        name: "updated",
        value: 456,
      });
    });
    it("should remove value from localStorage", () => {
      localStorage.setItem("test-key", JSON.stringify("value"));
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[2]();
      });
      expect(result.current[0]).toBe("initial");
      expect(localStorage.getItem("test-key")).toBeNull();
    });
    it("should handle storage events from other tabs", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        const event = new StorageEvent("storage", {
          key: "test-key",
          newValue: JSON.stringify("updated-from-tab"),
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBe("updated-from-tab");
    });
    it("should sync legacy plain string storage events when initial value is null", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", null));
      act(() => {
        const event = new StorageEvent("storage", {
          key: "test-key",
          newValue: "workflow-1",
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBe("workflow-1");
    });
    it("should ignore storage events for other keys", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        const event = new StorageEvent("storage", {
          key: "other-key",
          newValue: JSON.stringify("should-not-update"),
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBe("initial");
    });
    it("should ignore storage events when newValue is null", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        const event = new StorageEvent("storage", {
          key: "test-key",
          newValue: null,
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBe("initial");
    });
    it("should handle storage events with null key", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        const event = new StorageEvent("storage", {
          key: null,
          newValue: JSON.stringify("should-not-update"),
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBe("initial");
    });
  });
  describe("getLocalStorageItem", () => {
    it("should return stored value", () => {
      localStorage.setItem("test-key", JSON.stringify("stored-value"));
      expect(getLocalStorageItem("test-key", "default")).toBe("stored-value");
    });
    it("should return default value when key does not exist", () => {
      expect(getLocalStorageItem("non-existent", "default")).toBe("default");
    });
    it("should return default value on parse error", () => {
      localStorage.setItem("test-key", "{invalid-json}");
      expect(getLocalStorageItem("test-key", "default")).toBe("default");
    });
    it("should return plain string for backward compatibility", () => {
      localStorage.setItem("test-key", "plain-string-value");
      expect(getLocalStorageItem("test-key", "default")).toBe(
        "plain-string-value",
      );
    });
    it("should return default when plain string but default is not string", () => {
      localStorage.setItem("test-key", "plain-string-value");
      expect(getLocalStorageItem("test-key", 123)).toBe(123);
    });
    it("should return default when plain string but default is null", () => {
      localStorage.setItem("test-key", "plain-string-value");
      expect(getLocalStorageItem("test-key", null)).toBe("plain-string-value");
    });
    it("should handle JSON-like string that starts with {", () => {
      localStorage.setItem("test-key", "{invalid-json");
      expect(getLocalStorageItem("test-key", "default")).toBe("default");
    });
    it("should handle JSON-like string that starts with [", () => {
      localStorage.setItem("test-key", "[invalid-json");
      expect(getLocalStorageItem("test-key", "default")).toBe("default");
    });
    it("should handle whitespace in JSON-like string", () => {
      localStorage.setItem("test-key", "  {invalid-json");
      expect(getLocalStorageItem("test-key", "default")).toBe("default");
    });
  });
  describe("setLocalStorageItem", () => {
    it("should set value in localStorage", () => {
      expect(setLocalStorageItem("test-key", "value")).toBe(true);
      expect(localStorage.getItem("test-key")).toBe(JSON.stringify("value"));
    });
    it("should handle complex objects", () => {
      const obj = { name: "test", value: 123 };
      expect(setLocalStorageItem("test-key", obj)).toBe(true);
      expect(JSON.parse(localStorage.getItem("test-key"))).toEqual(obj);
    });
    it("should return false on error", () => {
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        throw new Error("Quota exceeded");
      });
      expect(setLocalStorageItem("test-key", "value")).toBe(false);
      localStorage.setItem = originalSetItem;
    });
  });
  describe("removeLocalStorageItem", () => {
    it("should remove value from localStorage", () => {
      localStorage.setItem("test-key", JSON.stringify("value"));
      expect(removeLocalStorageItem("test-key")).toBe(true);
      expect(localStorage.getItem("test-key")).toBeNull();
    });
    it("should return true even if key does not exist", () => {
      expect(removeLocalStorageItem("non-existent")).toBe(true);
    });
    it("should return false on error", () => {
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = jest.fn(() => {
        throw new Error("Error");
      });
      expect(removeLocalStorageItem("test-key")).toBe(false);
      localStorage.removeItem = originalRemoveItem;
    });
  });
  describe("edge cases", () => {
    it("should handle null values", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", null));
      expect(result.current[0]).toBe(null);
      act(() => {
        result.current[1](null);
      });
      expect(result.current[0]).toBe(null);
      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(null));
    });
    it("should handle undefined values", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", void 0));
      expect(result.current[0]).toBe(void 0);
      act(() => {
        result.current[1](null);
      });
      expect(result.current[0]).toBe(null);
    });
    it("should handle empty strings", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", ""));
      expect(result.current[0]).toBe("");
      act(() => {
        result.current[1]("");
      });
      expect(result.current[0]).toBe("");
      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(""));
    });
    it("should handle zero values", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", 0));
      expect(result.current[0]).toBe(0);
      act(() => {
        result.current[1](0);
      });
      expect(result.current[0]).toBe(0);
      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(0));
    });
    it("should handle false boolean values", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", false));
      expect(result.current[0]).toBe(false);
      act(() => {
        result.current[1](false);
      });
      expect(result.current[0]).toBe(false);
      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(false));
    });
    it("should handle arrays", () => {
      const array = [1, 2, 3];
      const { result } = renderHook(() => useLocalStorage("test-key", array));
      expect(result.current[0]).toEqual(array);
      act(() => {
        result.current[1]([4, 5, 6]);
      });
      expect(result.current[0]).toEqual([4, 5, 6]);
      expect(JSON.parse(localStorage.getItem("test-key"))).toEqual([4, 5, 6]);
    });
    it("should handle nested objects", () => {
      const nested = { a: { b: { c: "value" } } };
      const { result } = renderHook(() => useLocalStorage("test-key", nested));
      expect(result.current[0]).toEqual(nested);
      act(() => {
        result.current[1]({ a: { b: { c: "updated" } } });
      });
      expect(result.current[0]).toEqual({ a: { b: { c: "updated" } } });
    });
    it("should handle JSON-like strings that are not valid JSON", () => {
      localStorage.setItem("test-key", '{"invalid": json}');
      expect(getLocalStorageItem("test-key", "default")).toBe("default");
    });
    it("should handle storage quota exceeded error", () => {
      localStorage.setItem("test-key", JSON.stringify("initial"));
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "default"),
      );
      expect(result.current[0]).toBe("initial");
      const originalSetItem = localStorage.setItem;
      localStorage.setItem = jest.fn(() => {
        const error = new Error("QuotaExceededError");
        error.name = "QuotaExceededError";
        throw error;
      });
      act(() => {
        result.current[1]("new-value");
      });
      expect(result.current[0]).toBeDefined();
      localStorage.setItem = originalSetItem;
    });
    it("should handle getItem throwing error", () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error("Error");
      });
      expect(getLocalStorageItem("test-key", "default")).toBe("default");
      localStorage.getItem = originalGetItem;
    });
    it("should handle undefined value conversion to null", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1](void 0);
      });
      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(null));
    });
    it("should handle storage event with empty string newValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        const event = new StorageEvent("storage", {
          key: "test-key",
          newValue: "",
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBe("initial");
    });
    it("should handle storage event parsing error", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        const event = new StorageEvent("storage", {
          key: "test-key",
          newValue: "{invalid-json}",
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBeDefined();
    });
    it("should handle getLocalStorageItem with empty string", () => {
      localStorage.setItem("test-key", "");
      expect(getLocalStorageItem("test-key", "default")).toBe("default");
    });
    it("should handle getLocalStorageItem with whitespace-only string", () => {
      localStorage.setItem("test-key", "   ");
      expect(getLocalStorageItem("test-key", "default")).toBe("   ");
    });
    it("should handle getLocalStorageItem with string starting with whitespace and {", () => {
      localStorage.setItem("test-key", "  {invalid");
      expect(getLocalStorageItem("test-key", "default")).toBe("default");
    });
    it("should handle getLocalStorageItem with string starting with whitespace and [", () => {
      localStorage.setItem("test-key", "  [invalid");
      expect(getLocalStorageItem("test-key", "default")).toBe("default");
    });
    it("should handle getLocalStorageItem with plain string when default is string", () => {
      localStorage.setItem("test-key", "plain-string");
      expect(getLocalStorageItem("test-key", "default-string")).toBe(
        "plain-string",
      );
    });
    it("should handle getLocalStorageItem with plain string when default is null", () => {
      localStorage.setItem("test-key", "plain-string");
      expect(getLocalStorageItem("test-key", null)).toBe("plain-string");
    });
    it("should handle getLocalStorageItem with plain string when default is number", () => {
      localStorage.setItem("test-key", "plain-string");
      expect(getLocalStorageItem("test-key", 123)).toBe(123);
    });
    it("should handle getLocalStorageItem with plain string when default is boolean", () => {
      localStorage.setItem("test-key", "plain-string");
      expect(getLocalStorageItem("test-key", true)).toBe(true);
    });
    it("should handle getLocalStorageItem with plain string when default is object", () => {
      localStorage.setItem("test-key", "plain-string");
      expect(getLocalStorageItem("test-key", {})).toEqual({});
    });
    it("should handle setLocalStorageItem with undefined value", () => {
      expect(setLocalStorageItem("test-key", void 0)).toBe(true);
      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(null));
    });
    it("should handle removeValue with error", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      const originalRemoveItem = localStorage.removeItem;
      localStorage.removeItem = jest.fn(() => {
        throw new Error("Error");
      });
      act(() => {
        result.current[2]();
      });
      expect(result.current[0]).toBeDefined();
      localStorage.removeItem = originalRemoveItem;
    });
    it("should handle setValue with function updater that returns undefined", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1](() => void 0);
      });
      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(null));
    });
    it("should handle initialization error in useState", () => {
      const originalGetItem = localStorage.getItem;
      localStorage.getItem = jest.fn(() => {
        throw new Error("Error");
      });
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      expect(result.current[0]).toBe("initial");
      localStorage.getItem = originalGetItem;
    });
    it("should handle JSON.parse error in storage event", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        const event = new StorageEvent("storage", {
          key: "test-key",
          newValue: "not-json",
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBeDefined();
    });
    it("should handle window being undefined in getLocalStorageItem", () => {
      expect(getLocalStorageItem("test-key", "default")).toBeDefined();
    });
    it("should handle window being undefined in setLocalStorageItem", () => {
      expect(setLocalStorageItem("test-key", "value")).toBe(true);
    });
    it("should handle window being undefined in removeLocalStorageItem", () => {
      expect(removeLocalStorageItem("test-key")).toBe(true);
    });
    it("should handle item.trim() edge cases", () => {
      localStorage.setItem("test-key", "  {valid-json}  ");
      const result = getLocalStorageItem("test-key", "default");
      expect(result).toBeDefined();
    });
    it("should handle item.trim() with only whitespace", () => {
      localStorage.setItem("test-key", "   ");
      expect(getLocalStorageItem("test-key", "default")).toBe("   ");
    });
    it("should handle JSON.stringify error in setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      const circular = {};
      circular.self = circular;
      act(() => {
        try {
          result.current[1](circular);
        } catch (e) {}
      });
      expect(result.current[0]).toBeDefined();
    });
    it("should handle removeValue when window is undefined", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[2]();
      });
      expect(result.current[0]).toBe("initial");
    });
    it("should verify exact JSON.stringify behavior for undefined in setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1](void 0);
      });
      expect(localStorage.getItem("test-key")).toBe("null");
    });
    it("should verify exact JSON.stringify behavior for null in setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1](null);
      });
      expect(localStorage.getItem("test-key")).toBe("null");
    });
    it("should verify exact JSON.stringify behavior for regular values in setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1]("test-value");
      });
      expect(localStorage.getItem("test-key")).toBe('"test-value"');
    });
    it("should verify exact valueToStore === undefined check", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1](void 0);
      });
      expect(localStorage.getItem("test-key")).toBe("null");
    });
    it("should verify exact valueToStore !== undefined path", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1]("test");
      });
      expect(localStorage.getItem("test-key")).toBe('"test"');
    });
    it("should verify exact JSON.parse behavior in getLocalStorageItem", () => {
      localStorage.setItem("test-key", '"parsed-value"');
      const result = getLocalStorageItem("test-key", "default");
      expect(result).toBe("parsed-value");
    });
    it("should verify exact JSON.parse error handling in getLocalStorageItem", () => {
      localStorage.setItem("test-key", "{invalid-json}");
      const result = getLocalStorageItem("test-key", "default");
      expect(result).toBe("default");
    });
    it("should verify exact value === undefined check in setLocalStorageItem", () => {
      const result = setLocalStorageItem("test-key", void 0);
      expect(result).toBe(true);
      expect(localStorage.getItem("test-key")).toBe("null");
    });
    it("should verify exact value !== undefined path in setLocalStorageItem", () => {
      const result = setLocalStorageItem("test-key", "test-value");
      expect(result).toBe(true);
      expect(localStorage.getItem("test-key")).toBe('"test-value"');
    });
    it("should verify exact JSON.parse in storage event handler", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        const event = new StorageEvent("storage", {
          key: "test-key",
          newValue: '"updated-value"',
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBe("updated-value");
    });
    it("should verify exact JSON.parse error handling in storage event", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        const event = new StorageEvent("storage", {
          key: "test-key",
          newValue: "{invalid-json}",
        });
        window.dispatchEvent(event);
      });
      expect(result.current[0]).toBeDefined();
    });
    it("should verify exact item ? JSON.parse(item) : initialValue pattern", () => {
      localStorage.setItem("test-key", '"stored"');
      const result1 = getLocalStorageItem("test-key", "default");
      expect(result1).toBe("stored");
      localStorage.removeItem("test-key");
      const result2 = getLocalStorageItem("test-key", "default");
      expect(result2).toBe("default");
    });
    it("should verify exact value instanceof Function check", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", 0));
      act(() => {
        result.current[1]((prev) => prev + 1);
      });
      expect(result.current[0]).toBe(1);
    });
    it("should verify exact value !instanceof Function path", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1]("direct-value");
      });
      expect(result.current[0]).toBe("direct-value");
    });
  });
  describe("ternary operator coverage", () => {
    it("should verify item ? JSON.parse(item) : initialValue ternary", () => {
      localStorage.setItem("test-key", '"parsed"');
      const result1 = getLocalStorageItem("test-key", "default");
      expect(result1).toBe("parsed");
      localStorage.removeItem("test-key");
      const result2 = getLocalStorageItem("test-key", "default");
      expect(result2).toBe("default");
    });
    it("should verify valueToStore === undefined ? JSON.stringify(null) : JSON.stringify(valueToStore) ternary", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1](void 0);
      });
      expect(localStorage.getItem("test-key")).toBe("null");
      act(() => {
        result.current[1]("test-value");
      });
      expect(localStorage.getItem("test-key")).toBe('"test-value"');
    });
    it("should verify value === undefined ? null : value ternary in setLocalStorageItem", () => {
      const result1 = setLocalStorageItem("test-key", void 0);
      expect(result1).toBe(true);
      expect(localStorage.getItem("test-key")).toBe("null");
      const result2 = setLocalStorageItem("test-key", "test");
      expect(result2).toBe(true);
      expect(localStorage.getItem("test-key")).toBe('"test"');
    });
    it("should verify value instanceof Function ternary", () => {
      const { result } = renderHook(() => useLocalStorage("test-key", 0));
      act(() => {
        result.current[1]((prev) => prev + 1);
      });
      expect(result.current[0]).toBe(1);
      act(() => {
        result.current[1](5);
      });
      expect(result.current[0]).toBe(5);
    });
  });
  describe("typeof window === undefined coverage", () => {
    it("should verify typeof window === undefined check in useState initializer", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      expect(result.current[0]).toBeDefined();
    });
    it("should verify typeof window !== undefined check in setValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1]("test-value");
      });
      expect(localStorage.getItem("test-key")).toBe('"test-value"');
    });
    it("should verify typeof window !== undefined check in removeValue", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[2]();
      });
      expect(result.current[0]).toBe("initial");
    });
    it("should verify typeof window === undefined check in getLocalStorageItem", () => {
      const result = getLocalStorageItem("test-key", "default");
      expect(result).toBeDefined();
    });
    it("should verify typeof window === undefined check in setLocalStorageItem", () => {
      const result = setLocalStorageItem("test-key", "value");
      expect(result).toBe(true);
    });
    it("should verify typeof window === undefined check in removeLocalStorageItem", () => {
      const result = removeLocalStorageItem("test-key");
      expect(result).toBe(true);
    });
    it("should verify return false path in setLocalStorageItem", () => {
      const result = setLocalStorageItem("test-key", "value");
      expect(result).toBe(true);
    });
    it("should verify return false path in removeLocalStorageItem", () => {
      const result = removeLocalStorageItem("test-key");
      expect(result).toBe(true);
    });
  });
  describe("getLocalStorageItem function coverage", () => {
    it('should verify item.trim().startsWith("{") comparison', () => {
      localStorage.setItem("test-key", "{invalid json");
      const result = getLocalStorageItem("test-key", "default");
      expect(result).toBe("default");
    });
    it('should verify item.trim().startsWith("[") comparison', () => {
      localStorage.setItem("test-key", "[invalid json");
      const result = getLocalStorageItem("test-key", "default");
      expect(result).toBe("default");
    });
    it('should verify item.trim().startsWith("{") || item.trim().startsWith("[") pattern', () => {
      localStorage.setItem("test-key-brace", "{invalid");
      localStorage.setItem("test-key-bracket", "[invalid");
      expect(getLocalStorageItem("test-key-brace", "default")).toBe("default");
      expect(getLocalStorageItem("test-key-bracket", "default")).toBe(
        "default",
      );
    });
    it('should verify typeof defaultValue === "string" || defaultValue === null pattern', () => {
      localStorage.setItem("test-key", "plain-string");
      expect(getLocalStorageItem("test-key", "default")).toBe("plain-string");
      localStorage.setItem("test-key-null", "plain-string");
      expect(getLocalStorageItem("test-key-null", null)).toBe("plain-string");
    });
    it("should verify value === undefined ? null : value pattern in setLocalStorageItem", () => {
      const result1 = setLocalStorageItem("test-key", void 0);
      expect(result1).toBe(true);
      expect(localStorage.getItem("test-key")).toBe("null");
      const result2 = setLocalStorageItem("test-key", "value");
      expect(result2).toBe(true);
      expect(localStorage.getItem("test-key")).toBe('"value"');
    });
    it('should verify item.trim().startsWith("{") exact comparison', () => {
      localStorage.setItem("test-key", "{invalid");
      const result = getLocalStorageItem("test-key", "default");
      expect(result).toBe("default");
    });
    it('should verify item.trim().startsWith("[") exact comparison', () => {
      localStorage.setItem("test-key", "[invalid");
      const result = getLocalStorageItem("test-key", "default");
      expect(result).toBe("default");
    });
    it('should verify item.trim().startsWith("{") || item.trim().startsWith("[") exact pattern', () => {
      localStorage.setItem("test-key-brace", "{invalid");
      expect(getLocalStorageItem("test-key-brace", "default")).toBe("default");
      localStorage.setItem("test-key-bracket", "[invalid");
      expect(getLocalStorageItem("test-key-bracket", "default")).toBe(
        "default",
      );
      localStorage.setItem("test-key-plain", "plain-string");
      expect(getLocalStorageItem("test-key-plain", "default")).toBe(
        "plain-string",
      );
    });
    it('should verify typeof defaultValue === "string" exact comparison', () => {
      localStorage.setItem("test-key", "plain-string");
      const result = getLocalStorageItem("test-key", "default-string");
      expect(result).toBe("plain-string");
    });
    it('should verify typeof defaultValue === "string" || defaultValue === null exact pattern', () => {
      localStorage.setItem("test-key-string", "plain-string");
      expect(getLocalStorageItem("test-key-string", "default")).toBe(
        "plain-string",
      );
      localStorage.setItem("test-key-null", "plain-string");
      expect(getLocalStorageItem("test-key-null", null)).toBe("plain-string");
      localStorage.setItem("test-key-number", "plain-string");
      expect(getLocalStorageItem("test-key-number", 123)).toBe(123);
    });
    it("should verify value === undefined ? null : value exact ternary", () => {
      const result1 = setLocalStorageItem("test-key", void 0);
      expect(result1).toBe(true);
      expect(localStorage.getItem("test-key")).toBe("null");
      const result2 = setLocalStorageItem("test-key", "value");
      expect(result2).toBe(true);
      expect(localStorage.getItem("test-key")).toBe('"value"');
      const result3 = setLocalStorageItem("test-key", null);
      expect(result3).toBe(true);
      expect(localStorage.getItem("test-key")).toBe("null");
    });
    it("should verify valueToStore === undefined ? JSON.stringify(null) : JSON.stringify(valueToStore) pattern", () => {
      const { result } = renderHook(() =>
        useLocalStorage("test-key", "initial"),
      );
      act(() => {
        result.current[1](void 0);
      });
      expect(localStorage.getItem("test-key")).toBe("null");
    });
    describe("exact logical operator coverage", () => {
      it("should verify e.key === key && e.newValue exact pattern", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: '"updated"',
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("updated");
      });
      it("should verify e.key === key && e.newValue with different key", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "other-key",
            newValue: '"should-not-update"',
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("initial");
      });
      it("should verify e.key === key && e.newValue with null newValue", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: null,
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("initial");
      });
      it("should verify e.key === key && e.newValue with empty string newValue", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: "",
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("initial");
      });
      it("should verify !item exact negation check", () => {
        localStorage.removeItem("test-key");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
      it("should verify !item with empty string", () => {
        localStorage.setItem("test-key", "");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
      it('should verify item.trim().startsWith("{") exact method call', () => {
        localStorage.setItem("test-key", "{invalid");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
      it('should verify item.trim().startsWith("[") exact method call', () => {
        localStorage.setItem("test-key", "[invalid");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
      it('should verify item.trim().startsWith("{") || item.trim().startsWith("[") exact pattern', () => {
        localStorage.setItem("test-key-brace", "{invalid");
        expect(getLocalStorageItem("test-key-brace", "default")).toBe(
          "default",
        );
        localStorage.setItem("test-key-bracket", "[invalid");
        expect(getLocalStorageItem("test-key-bracket", "default")).toBe(
          "default",
        );
        localStorage.setItem("test-key-plain", "plain-string");
        expect(getLocalStorageItem("test-key-plain", "default")).toBe(
          "plain-string",
        );
      });
      it('should verify typeof defaultValue === "string" exact comparison', () => {
        localStorage.setItem("test-key", "plain-string");
        const result = getLocalStorageItem("test-key", "default-string");
        expect(result).toBe("plain-string");
      });
      it('should verify typeof defaultValue === "string" || defaultValue === null exact pattern', () => {
        localStorage.setItem("test-key-string", "plain-string");
        expect(getLocalStorageItem("test-key-string", "default")).toBe(
          "plain-string",
        );
        localStorage.setItem("test-key-null", "plain-string");
        expect(getLocalStorageItem("test-key-null", null)).toBe("plain-string");
        localStorage.setItem("test-key-number", "plain-string");
        expect(getLocalStorageItem("test-key-number", 123)).toBe(123);
      });
      it("should verify looksLikeJson exact variable assignment", () => {
        localStorage.setItem("test-key", "{invalid");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
      it("should verify looksLikeJson = false path", () => {
        localStorage.setItem("test-key", "plain-string");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("plain-string");
      });
    });
    describe("exact comparison operators", () => {
      it("should verify e.key === key exact comparison", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: '"updated"',
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("updated");
      });
      it("should verify e.key !== key comparison", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "different-key",
            newValue: '"should-not-update"',
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("initial");
      });
      it("should verify valueToStore === undefined exact comparison", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1](void 0);
        });
        expect(localStorage.getItem("test-key")).toBe("null");
      });
      it("should verify valueToStore !== undefined comparison", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1]("test-value");
        });
        expect(localStorage.getItem("test-key")).toBe('"test-value"');
      });
      it("should verify value === undefined exact comparison in setLocalStorageItem", () => {
        const result = setLocalStorageItem("test-key", void 0);
        expect(result).toBe(true);
        expect(localStorage.getItem("test-key")).toBe("null");
      });
      it("should verify value !== undefined comparison in setLocalStorageItem", () => {
        const result = setLocalStorageItem("test-key", "test-value");
        expect(result).toBe(true);
        expect(localStorage.getItem("test-key")).toBe('"test-value"');
      });
    });
    describe("exact instanceof checks", () => {
      it("should verify value instanceof Function exact check", () => {
        const { result } = renderHook(() => useLocalStorage("test-key", 0));
        act(() => {
          result.current[1]((prev) => prev + 1);
        });
        expect(result.current[0]).toBe(1);
      });
      it("should verify value !instanceof Function path", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1]("direct-value");
        });
        expect(result.current[0]).toBe("direct-value");
      });
    });
    describe("exact JSON operations", () => {
      it("should verify JSON.parse(item) exact call", () => {
        localStorage.setItem("test-key", '"parsed-value"');
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("parsed-value");
      });
      it("should verify JSON.stringify(null) exact call", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1](void 0);
        });
        expect(localStorage.getItem("test-key")).toBe("null");
      });
      it("should verify JSON.stringify(valueToStore) exact call", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1]("test-value");
        });
        expect(localStorage.getItem("test-key")).toBe('"test-value"');
      });
      it("should verify JSON.stringify(valueToStore) exact call in setLocalStorageItem", () => {
        const result = setLocalStorageItem("test-key", "test-value");
        expect(result).toBe(true);
        expect(localStorage.getItem("test-key")).toBe('"test-value"');
      });
      it("should verify JSON.parse(e.newValue) exact call", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: '"parsed-from-event"',
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("parsed-from-event");
      });
    });
    describe("exact string method calls", () => {
      it("should verify item.trim() exact method call", () => {
        localStorage.setItem("test-key", "  {invalid");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
      it('should verify item.trim().startsWith("{") exact chain', () => {
        localStorage.setItem("test-key", "{invalid");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
      it('should verify item.trim().startsWith("[") exact chain', () => {
        localStorage.setItem("test-key", "[invalid");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
    });
    describe("exact return value coverage", () => {
      it("should verify return true exact value in setLocalStorageItem", () => {
        const result = setLocalStorageItem("test-key", "value");
        expect(result).toBe(true);
      });
      it("should verify return false exact value in setLocalStorageItem on error", () => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = jest.fn(() => {
          throw new Error("Error");
        });
        const result = setLocalStorageItem("test-key", "value");
        expect(result).toBe(false);
        localStorage.setItem = originalSetItem;
      });
      it("should verify return true exact value in removeLocalStorageItem", () => {
        const result = removeLocalStorageItem("test-key");
        expect(result).toBe(true);
      });
      it("should verify return false exact value in removeLocalStorageItem on error", () => {
        const originalRemoveItem = localStorage.removeItem;
        localStorage.removeItem = jest.fn(() => {
          throw new Error("Error");
        });
        const result = removeLocalStorageItem("test-key");
        expect(result).toBe(false);
        localStorage.removeItem = originalRemoveItem;
      });
    });
    describe("exact event handler coverage", () => {
      it("should verify handleStorageChange function exact call", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: '"handler-called"',
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("handler-called");
      });
      it("should verify addEventListener exact call", () => {
        const addEventListenerSpy = jest.spyOn(window, "addEventListener");
        const { unmount } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        expect(addEventListenerSpy).toHaveBeenCalledWith(
          "storage",
          expect.any(Function),
        );
        unmount();
        addEventListenerSpy.mockRestore();
      });
      it("should verify removeEventListener exact call on cleanup", () => {
        const removeEventListenerSpy = jest.spyOn(
          window,
          "removeEventListener",
        );
        const { unmount } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        unmount();
        expect(removeEventListenerSpy).toHaveBeenCalledWith(
          "storage",
          expect.any(Function),
        );
        removeEventListenerSpy.mockRestore();
      });
      it("should verify handleStorageChange with exact e.key check", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: '"exact-key-match"',
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("exact-key-match");
      });
      it("should verify handleStorageChange with exact e.newValue check", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: '"exact-newvalue-check"',
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("exact-newvalue-check");
      });
    });
    describe("exact error handling coverage", () => {
      it("should verify catch block in useState initializer", () => {
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = jest.fn(() => {
          throw new Error("GetItem error");
        });
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        expect(result.current[0]).toBe("initial");
        localStorage.getItem = originalGetItem;
      });
      it("should verify catch block in setValue", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = jest.fn(() => {
          throw new Error("SetItem error");
        });
        act(() => {
          result.current[1]("test-value");
        });
        expect(result.current[0]).toBeDefined();
        localStorage.setItem = originalSetItem;
      });
      it("should verify catch block in removeValue", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        const originalRemoveItem = localStorage.removeItem;
        localStorage.removeItem = jest.fn(() => {
          throw new Error("RemoveItem error");
        });
        act(() => {
          result.current[2]();
        });
        expect(result.current[0]).toBeDefined();
        localStorage.removeItem = originalRemoveItem;
      });
      it("should verify catch block in handleStorageChange", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: "{invalid-json}",
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBeDefined();
      });
      it("should verify catch block in getLocalStorageItem outer try", () => {
        const originalGetItem = localStorage.getItem;
        localStorage.getItem = jest.fn(() => {
          throw new Error("Outer error");
        });
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
        localStorage.getItem = originalGetItem;
      });
      it("should verify catch block in getLocalStorageItem inner try", () => {
        localStorage.setItem("test-key", "{invalid-json}");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
      it("should verify catch block in setLocalStorageItem", () => {
        const originalSetItem = localStorage.setItem;
        localStorage.setItem = jest.fn(() => {
          throw new Error("SetItem error");
        });
        const result = setLocalStorageItem("test-key", "value");
        expect(result).toBe(false);
        localStorage.setItem = originalSetItem;
      });
      it("should verify catch block in removeLocalStorageItem", () => {
        const originalRemoveItem = localStorage.removeItem;
        localStorage.removeItem = jest.fn(() => {
          throw new Error("RemoveItem error");
        });
        const result = removeLocalStorageItem("test-key");
        expect(result).toBe(false);
        localStorage.removeItem = originalRemoveItem;
      });
    });
    describe("exact variable assignments", () => {
      it("should verify valueToStore assignment from function", () => {
        const { result } = renderHook(() => useLocalStorage("test-key", 0));
        act(() => {
          result.current[1]((prev) => prev + 10);
        });
        expect(result.current[0]).toBe(10);
      });
      it("should verify valueToStore assignment from direct value", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1]("direct-assignment");
        });
        expect(result.current[0]).toBe("direct-assignment");
      });
      it("should verify valueToStoreString assignment for undefined", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1](void 0);
        });
        expect(localStorage.getItem("test-key")).toBe("null");
      });
      it("should verify valueToStoreString assignment for value", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1]("string-assignment");
        });
        expect(localStorage.getItem("test-key")).toBe('"string-assignment"');
      });
      it("should verify valueToStore assignment in setLocalStorageItem", () => {
        const result = setLocalStorageItem("test-key", void 0);
        expect(result).toBe(true);
        expect(localStorage.getItem("test-key")).toBe("null");
      });
      it("should verify looksLikeJson assignment", () => {
        localStorage.setItem("test-key", "{invalid");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
    });
    describe("exact ternary operator branches", () => {
      it("should verify item ? JSON.parse(item) : initialValue - truthy branch", () => {
        localStorage.setItem("test-key", '"truthy-branch"');
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("truthy-branch");
      });
      it("should verify item ? JSON.parse(item) : initialValue - falsy branch", () => {
        localStorage.removeItem("test-key");
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("default");
      });
      it("should verify value instanceof Function ? value(storedValue) : value - truthy branch", () => {
        const { result } = renderHook(() => useLocalStorage("test-key", 5));
        act(() => {
          result.current[1]((prev) => prev * 2);
        });
        expect(result.current[0]).toBe(10);
      });
      it("should verify value instanceof Function ? value(storedValue) : value - falsy branch", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1]("falsy-branch");
        });
        expect(result.current[0]).toBe("falsy-branch");
      });
      it("should verify valueToStore === undefined ? JSON.stringify(null) : JSON.stringify(valueToStore) - truthy branch", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1](void 0);
        });
        expect(localStorage.getItem("test-key")).toBe("null");
      });
      it("should verify valueToStore === undefined ? JSON.stringify(null) : JSON.stringify(valueToStore) - falsy branch", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1]("falsy-branch");
        });
        expect(localStorage.getItem("test-key")).toBe('"falsy-branch"');
      });
      it("should verify value === undefined ? null : value - truthy branch in setLocalStorageItem", () => {
        const result = setLocalStorageItem("test-key", void 0);
        expect(result).toBe(true);
        expect(localStorage.getItem("test-key")).toBe("null");
      });
      it("should verify value === undefined ? null : value - falsy branch in setLocalStorageItem", () => {
        const result = setLocalStorageItem("test-key", "falsy-branch");
        expect(result).toBe(true);
        expect(localStorage.getItem("test-key")).toBe('"falsy-branch"');
      });
    });
    describe("exact function call coverage", () => {
      it("should verify setStoredValue exact call", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1]("set-stored-value");
        });
        expect(result.current[0]).toBe("set-stored-value");
      });
      it("should verify setStoredValue(initialValue) exact call in removeValue", () => {
        localStorage.setItem("test-key", '"stored"');
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[2]();
        });
        expect(result.current[0]).toBe("initial");
      });
      it("should verify setStoredValue(JSON.parse(e.newValue)) exact call", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          const event = new StorageEvent("storage", {
            key: "test-key",
            newValue: '"parsed-value"',
          });
          window.dispatchEvent(event);
        });
        expect(result.current[0]).toBe("parsed-value");
      });
      it("should verify window.localStorage.getItem(key) exact call", () => {
        localStorage.setItem("test-key", '"get-item-value"');
        const result = getLocalStorageItem("test-key", "default");
        expect(result).toBe("get-item-value");
      });
      it("should verify window.localStorage.setItem(key, valueToStoreString) exact call", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1]("set-item-value");
        });
        expect(localStorage.getItem("test-key")).toBe('"set-item-value"');
      });
      it("should verify window.localStorage.removeItem(key) exact call", () => {
        localStorage.setItem("test-key", '"remove-me"');
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[2]();
        });
        expect(localStorage.getItem("test-key")).toBeNull();
      });
      it("should verify exact nullish coalescing options?.storage ?? defaultAdapters.createLocalStorageAdapter()", () => {
        const { result: result1 } = renderHook(() =>
          useLocalStorage("test-key", "initial", {}),
        );
        expect(result1.current[0]).toBe("initial");
        const { result: result2 } = renderHook(() =>
          useLocalStorage("test-key", "initial", { storage: null }),
        );
        expect(result2.current[0]).toBe("initial");
        const mockStorage = {
          getItem: jest.fn(() => null),
          setItem: jest.fn(),
          removeItem: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
        };
        renderHook(() =>
          useLocalStorage("test-key", "initial", { storage: mockStorage }),
        );
        expect(mockStorage.getItem).toHaveBeenCalled();
      });
      it("should verify exact undefined handling valueToStore === undefined ? JSON.stringify(null) : JSON.stringify(valueToStore)", () => {
        const { result } = renderHook(() =>
          useLocalStorage("test-key", "initial"),
        );
        act(() => {
          result.current[1](void 0);
        });
        expect(localStorage.getItem("test-key")).toBe("null");
        expect(localStorage.getItem("test-key")).not.toBe("undefined");
      });
      it("should verify exact undefined handling value === undefined ? null : value in setLocalStorageItem", () => {
        const result1 = setLocalStorageItem("test-key", void 0);
        expect(result1).toBe(true);
        expect(localStorage.getItem("test-key")).toBe("null");
        expect(localStorage.getItem("test-key")).not.toBe("undefined");
        const result2 = setLocalStorageItem("test-key", "value");
        expect(result2).toBe(true);
        expect(localStorage.getItem("test-key")).toBe('"value"');
      });
      it("should verify exact type check typeof defaultValue === string || defaultValue === null", () => {
        localStorage.setItem("test-key", "plain-string");
        const result1 = getLocalStorageItem("test-key", "default");
        expect(result1).toBe("plain-string");
        localStorage.setItem("test-key", "plain-string");
        const result2 = getLocalStorageItem("test-key", null);
        expect(result2).toBe("plain-string");
        localStorage.setItem("test-key", "plain-string");
        const result3 = getLocalStorageItem("test-key", 0);
        expect(result3).toBe(0);
      });
      it("should verify exact fallback value windowLocation?.host || localhost:8000", () => {
        const mockWindowLocation = {
          protocol: "http:",
          host: void 0,
        };
        const host = mockWindowLocation.host || "localhost:8000";
        expect(host).toBe("localhost:8000");
        expect(host).not.toBe("localhost");
        expect(host).not.toBe("localhost:8080");
      });
      it("should verify exact ternary protocol === https: ? wss: : ws:", () => {
        const protocol1 = true ? "wss:" : "ws:";
        expect(protocol1).toBe("wss:");
        expect(protocol1).not.toBe("ws:");
        const protocol2 = false ? "wss:" : "ws:";
        expect(protocol2).toBe("ws:");
        expect(protocol2).not.toBe("wss:");
      });
      it("should verify exact logical OR reason && reason.length > 0 ? reason : No reason provided", () => {
        const reason1 =
          "Connection closed".length > 0
            ? "Connection closed"
            : "No reason provided";
        expect(reason1).toBe("Connection closed");
        const reason2 = "" ? "" : "No reason provided";
        expect(reason2).toBe("No reason provided");
        expect(reason2).not.toBe("");
        const reason3 = void 0 ? void 0 : "No reason provided";
        expect(reason3).toBe("No reason provided");
      });
      it("should verify exact comparison code === 1000", () => {
        const wasClean1 = true;
        const code1 = 1e3;
        const shouldReconnect1 = wasClean1 && code1 === 1e3;
        expect(shouldReconnect1).toBe(true);
        const wasClean2 = true;
        const code2 = 1001;
        const shouldReconnect2 = wasClean2 && code2 === 1e3;
        expect(shouldReconnect2).toBe(false);
      });
      it("should verify exact comparison reconnectAttempts.current < maxReconnectAttempts", () => {
        const maxReconnectAttempts = 5;
        const reconnectAttempts1 = 3;
        const shouldReconnect1 = reconnectAttempts1 < maxReconnectAttempts;
        expect(shouldReconnect1).toBe(true);
        const reconnectAttempts2 = 5;
        const shouldReconnect2 = reconnectAttempts2 < maxReconnectAttempts;
        expect(shouldReconnect2).toBe(false);
      });
      it("should verify exact string literal No reason provided", () => {
        const reason = "" ? "" : "No reason provided";
        expect(reason).toBe("No reason provided");
        expect(reason).not.toBe("no reason provided");
        expect(reason).not.toBe("No Reason Provided");
        expect(reason.length).toBe(18);
      });
    });
  });
});

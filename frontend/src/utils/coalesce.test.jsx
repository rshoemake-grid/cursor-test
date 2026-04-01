import { coalesce } from "./coalesce";
describe("coalesce utilities", () => {
  describe("coalesce", () => {
    it("should return default value for null", () => {
      expect(coalesce(null, "default")).toBe("default");
      expect(coalesce(null, 0)).toBe(0);
      expect(coalesce(null, false)).toBe(false);
      expect(coalesce(null, [])).toEqual([]);
      expect(coalesce(null, {})).toEqual({});
    });
    it("should return default value for undefined", () => {
      expect(coalesce(void 0, "default")).toBe("default");
      expect(coalesce(void 0, 0)).toBe(0);
      expect(coalesce(void 0, false)).toBe(false);
      expect(coalesce(void 0, [])).toEqual([]);
      expect(coalesce(void 0, {})).toEqual({});
    });
    it("should return value for defined values", () => {
      expect(coalesce("test", "default")).toBe("test");
      expect(coalesce(123, 0)).toBe(123);
      expect(coalesce(true, false)).toBe(true);
      expect(coalesce([1, 2], [])).toEqual([1, 2]);
      expect(coalesce({ key: "value" }, {})).toEqual({ key: "value" });
    });
    it("should handle falsy but defined values", () => {
      expect(coalesce(0, 10)).toBe(0);
      expect(coalesce(false, true)).toBe(false);
      expect(coalesce("", "default")).toBe("");
      expect(coalesce(NaN, 0)).toBe(NaN);
    });
    it("should work with different types", () => {
      expect(coalesce("hello", "world")).toBe("hello");
      expect(coalesce(null, "world")).toBe("world");
      expect(coalesce(42, 0)).toBe(42);
      expect(coalesce(null, 0)).toBe(0);
      expect(coalesce(true, false)).toBe(true);
      expect(coalesce(null, false)).toBe(false);
      expect(coalesce([1, 2, 3], [])).toEqual([1, 2, 3]);
      expect(coalesce(null, [])).toEqual([]);
      expect(coalesce({ a: 1 }, {})).toEqual({ a: 1 });
      expect(coalesce(null, {})).toEqual({});
    });
    it("should preserve type information", () => {
      const value = "test";
      const result = coalesce(value, "default");
      expect(typeof result).toBe("string");
      expect(result.toUpperCase()).toBe("TEST");
    });
    it("should work with complex objects", () => {
      const value = { id: 1, name: "test" };
      const defaultValue = { id: 0, name: "default" };
      expect(coalesce(value, defaultValue)).toEqual({ id: 1, name: "test" });
      expect(coalesce(null, defaultValue)).toEqual(defaultValue);
    });
    it("should handle edge cases", () => {
      expect(coalesce("", "default")).toBe("");
      expect(coalesce(0, 10)).toBe(0);
      expect(coalesce(false, true)).toBe(false);
      expect(coalesce([], [1, 2, 3])).toEqual([]);
      expect(coalesce({}, { key: "value" })).toEqual({});
    });
  });
});

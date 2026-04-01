import {
  logicalOr,
  logicalOrToNull,
  logicalOrToEmptyObject,
  logicalOrToEmptyArray
} from "./logicalOr";
describe("logicalOr", () => {
  it("should return value when truthy", () => {
    expect(logicalOr("test", "default")).toBe("test");
    expect(logicalOr(1, 0)).toBe(1);
    expect(logicalOr(true, false)).toBe(true);
  });
  it("should return fallback when value is falsy", () => {
    expect(logicalOr(null, "default")).toBe("default");
    expect(logicalOr(void 0, "default")).toBe("default");
    expect(logicalOr("", "default")).toBe("default");
    expect(logicalOr(0, 1)).toBe(1);
    expect(logicalOr(false, true)).toBe(true);
  });
  it("should handle undefined fallback", () => {
    expect(logicalOr(null, void 0)).toBeUndefined();
    expect(logicalOr(void 0, void 0)).toBeUndefined();
    expect(logicalOr("test", void 0)).toBe("test");
  });
});
describe("logicalOrToNull", () => {
  it("should return value when truthy", () => {
    expect(logicalOrToNull("test")).toBe("test");
    expect(logicalOrToNull(1)).toBe(1);
    expect(logicalOrToNull(true)).toBe(true);
  });
  it("should return null when value is falsy", () => {
    expect(logicalOrToNull(null)).toBeNull();
    expect(logicalOrToNull(void 0)).toBeNull();
    expect(logicalOrToNull("")).toBeNull();
    expect(logicalOrToNull(0)).toBeNull();
    expect(logicalOrToNull(false)).toBeNull();
  });
});
describe("logicalOrToEmptyObject", () => {
  it("should return value when truthy", () => {
    const obj = { a: 1 };
    expect(logicalOrToEmptyObject(obj)).toBe(obj);
  });
  it("should return empty object when value is falsy", () => {
    expect(logicalOrToEmptyObject(null)).toEqual({});
    expect(logicalOrToEmptyObject(void 0)).toEqual({});
  });
});
describe("logicalOrToEmptyArray", () => {
  it("should return value when truthy", () => {
    const arr = [1, 2, 3];
    expect(logicalOrToEmptyArray(arr)).toBe(arr);
  });
  it("should return empty array when value is falsy", () => {
    expect(logicalOrToEmptyArray(null)).toEqual([]);
    expect(logicalOrToEmptyArray(void 0)).toEqual([]);
  });
});

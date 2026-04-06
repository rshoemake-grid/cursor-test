import { isEmptySelection, isStorageAvailable } from "./validationUtils";
describe("validationUtils", () => {
  describe("isEmptySelection", () => {
    it("should return true when set is empty", () => {
      const ids = new Set();
      expect(isEmptySelection(ids)).toBe(true);
    });
    it("should return false when set has one item", () => {
      const ids = new Set(["id1"]);
      expect(isEmptySelection(ids)).toBe(false);
    });
    it("should return false when set has multiple items", () => {
      const ids = new Set(["id1", "id2", "id3"]);
      expect(isEmptySelection(ids)).toBe(false);
    });
    it("should verify exact size comparison - size === 0", () => {
      const emptySet = new Set();
      expect(emptySet.size).toBe(0);
      expect(isEmptySelection(emptySet)).toBe(true);
    });
    it("should verify exact size comparison - size !== 0", () => {
      const nonEmptySet = new Set(["id1"]);
      expect(nonEmptySet.size).toBe(1);
      expect(isEmptySelection(nonEmptySet)).toBe(false);
    });
  });
  describe("isStorageAvailable", () => {
    it("should return false when storage is null", () => {
      expect(isStorageAvailable(null)).toBe(false);
    });
    it("should return false when storage is undefined", () => {
      expect(isStorageAvailable(void 0)).toBe(false);
    });
    it("should return true when storage is an object", () => {
      const storage = { getItem: jest.fn() };
      expect(isStorageAvailable(storage)).toBe(true);
    });
    it("should return true when storage is an empty object", () => {
      expect(isStorageAvailable({})).toBe(true);
    });
    it("should verify exact AND condition - storage !== null && storage !== undefined (both true)", () => {
      const storage = { getItem: jest.fn() };
      expect(storage !== null).toBe(true);
      expect(storage !== void 0).toBe(true);
      expect(isStorageAvailable(storage)).toBe(true);
    });
    it("should verify exact AND condition - storage === null (first false)", () => {
      const storage = null;
      expect(storage !== null).toBe(false);
      expect(isStorageAvailable(storage)).toBe(false);
    });
    it("should verify exact AND condition - storage === undefined (second false)", () => {
      const storage = void 0;
      expect(storage !== void 0).toBe(false);
      expect(isStorageAvailable(storage)).toBe(false);
    });
    it("should return true for truthy values like empty string", () => {
      expect(isStorageAvailable("")).toBe(true);
    });
    it("should return true for number 0", () => {
      expect(isStorageAvailable(0)).toBe(true);
    });
    it("should return true for boolean false", () => {
      expect(isStorageAvailable(false)).toBe(true);
    });
  });
});

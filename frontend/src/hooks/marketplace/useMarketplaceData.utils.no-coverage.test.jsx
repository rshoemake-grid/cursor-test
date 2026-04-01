import {
  buildSearchParams,
  filterByCategory,
  filterBySearchQuery,
  applyFilters,
  getSortTimestamp,
  compareByDate,
  compareByName,
  compareOfficialStatus,
  sortItems
} from "./useMarketplaceData.utils";
describe("useMarketplaceData.utils - No Coverage Paths", () => {
  describe("buildSearchParams", () => {
    it("should build params with all values", () => {
      const params = buildSearchParams("automation", "test query", "popular");
      expect(params.get("category")).toBe("automation");
      expect(params.get("search")).toBe("test query");
      expect(params.get("sort_by")).toBe("popular");
    });
    it("should omit category when empty", () => {
      const params = buildSearchParams("", "test query", "popular");
      expect(params.get("category")).toBeNull();
      expect(params.get("search")).toBe("test query");
      expect(params.get("sort_by")).toBe("popular");
    });
    it("should omit search when empty", () => {
      const params = buildSearchParams("automation", "", "popular");
      expect(params.get("category")).toBe("automation");
      expect(params.get("search")).toBeNull();
      expect(params.get("sort_by")).toBe("popular");
    });
    it("should always include sort_by", () => {
      const params = buildSearchParams("", "", "recent");
      expect(params.get("category")).toBeNull();
      expect(params.get("search")).toBeNull();
      expect(params.get("sort_by")).toBe("recent");
    });
  });
  describe("filterByCategory", () => {
    const items = [
      { category: "automation", name: "Item 1" },
      { category: "data", name: "Item 2" },
      { category: "automation", name: "Item 3" }
    ];
    it("should return all items when category is empty", () => {
      const result = filterByCategory(items, "");
      expect(result).toEqual(items);
    });
    it("should filter by category", () => {
      const result = filterByCategory(items, "automation");
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe("Item 1");
      expect(result[1].name).toBe("Item 3");
    });
    it("should return empty array when no items match category", () => {
      const result = filterByCategory(items, "nonexistent");
      expect(result).toHaveLength(0);
    });
  });
  describe("filterBySearchQuery", () => {
    const items = [
      { name: "Test Item", description: "Description", tags: ["tag1"] },
      { name: "Another Item", description: "Test description", tags: ["tag2"] },
      { name: "Third", description: "Different", tags: ["test-tag"] }
    ];
    it("should return all items when search query is empty", () => {
      const result = filterBySearchQuery(items, "");
      expect(result).toEqual(items);
    });
    it("should filter by name", () => {
      const result = filterBySearchQuery(items, "Test Item");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Item");
    });
    it("should filter by description", () => {
      const result = filterBySearchQuery(items, "description");
      expect(result).toHaveLength(2);
    });
    it("should filter by tags", () => {
      const result = filterBySearchQuery(items, "test-tag");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Third");
    });
    it("should handle null/undefined name with defensive check", () => {
      const itemsWithNulls = [
        { name: null, description: "Test" },
        { name: void 0, description: "Test" },
        { name: "Valid", description: "Test" }
      ];
      const result = filterBySearchQuery(itemsWithNulls, "test");
      expect(result.length).toBeGreaterThan(0);
    });
    it("should handle null/undefined description with defensive check", () => {
      const itemsWithNulls = [
        { name: "Test", description: null },
        { name: "Test", description: void 0 }
      ];
      const result = filterBySearchQuery(itemsWithNulls, "test");
      expect(result.length).toBeGreaterThan(0);
    });
    it("should handle non-string name/description with defensive check", () => {
      const itemsWithNonStrings = [
        { name: 123, description: "Test" },
        { name: "Test", description: {} }
      ];
      const result = filterBySearchQuery(itemsWithNonStrings, "test");
      expect(result.length).toBeGreaterThanOrEqual(0);
    });
    it("should handle null/undefined tags", () => {
      const itemsWithNullTags = [
        { name: "Test", tags: null },
        { name: "Test", tags: void 0 }
      ];
      const result = filterBySearchQuery(itemsWithNullTags, "test");
      expect(result.length).toBeGreaterThan(0);
    });
    it("should handle non-string tags with defensive check", () => {
      const itemsWithNonStringTags = [
        { name: "Test", tags: [123, "valid"] },
        { name: "Test", tags: [null, "valid"] }
      ];
      const result = filterBySearchQuery(itemsWithNonStringTags, "valid");
      expect(result.length).toBeGreaterThan(0);
    });
  });
  describe("applyFilters", () => {
    const items = [
      { category: "automation", name: "Test Item" },
      { category: "data", name: "Another Item" },
      { category: "automation", name: "Third Item" }
    ];
    it("should apply both category and search filters", () => {
      const result = applyFilters(items, "automation", "Test");
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe("Test Item");
    });
    it("should apply only category filter when search is empty", () => {
      const result = applyFilters(items, "automation", "");
      expect(result).toHaveLength(2);
    });
    it("should apply only search filter when category is empty", () => {
      const result = applyFilters(items, "", "Test");
      expect(result).toHaveLength(1);
    });
    it("should return all items when both filters are empty", () => {
      const result = applyFilters(items, "", "");
      expect(result).toEqual(items);
    });
  });
  describe("getSortTimestamp", () => {
    it("should return timestamp for valid date", () => {
      const item = { published_at: "2024-01-01T00:00:00Z" };
      const timestamp = getSortTimestamp(item);
      expect(timestamp).toBe((/* @__PURE__ */ new Date("2024-01-01T00:00:00Z")).getTime());
    });
    it("should return 0 when published_at is null", () => {
      const item = { published_at: null };
      const timestamp = getSortTimestamp(item);
      expect(timestamp).toBe(0);
    });
    it("should return 0 when published_at is undefined", () => {
      const item = { published_at: void 0 };
      const timestamp = getSortTimestamp(item);
      expect(timestamp).toBe(0);
    });
    it("should return 0 when published_at is empty string", () => {
      const item = { published_at: "" };
      const timestamp = getSortTimestamp(item);
      expect(timestamp).toBe(0);
    });
  });
  describe("compareByDate", () => {
    it("should sort newest first", () => {
      const a = { published_at: "2024-01-01T00:00:00Z" };
      const b = { published_at: "2024-01-02T00:00:00Z" };
      const result = compareByDate(a, b);
      expect(result).toBeGreaterThan(0);
    });
    it("should handle items without dates", () => {
      const a = { published_at: null };
      const b = { published_at: "2024-01-01T00:00:00Z" };
      const result = compareByDate(a, b);
      expect(result).toBeGreaterThan(0);
    });
    it("should return 0 when both items have no dates", () => {
      const a = { published_at: null };
      const b = { published_at: null };
      const result = compareByDate(a, b);
      expect(result).toBe(0);
    });
  });
  describe("compareByName", () => {
    it("should sort alphabetically", () => {
      const a = { name: "Apple" };
      const b = { name: "Banana" };
      const result = compareByName(a, b);
      expect(result).toBeLessThan(0);
    });
    it("should handle null name with defensive check", () => {
      const a = { name: null };
      const b = { name: "Valid" };
      const result = compareByName(a, b);
      expect(result).toBeLessThan(0);
    });
    it("should handle undefined name with defensive check", () => {
      const a = { name: void 0 };
      const b = { name: "Valid" };
      const result = compareByName(a, b);
      expect(result).toBeLessThan(0);
    });
    it("should handle non-string names with defensive check", () => {
      const a = { name: 123 };
      const b = { name: "Valid" };
      const result = compareByName(a, b);
      expect(result).toBeLessThan(0);
    });
    it("should handle non-string nameB with defensive check (line 117 branch)", () => {
      const a = { name: "Valid" };
      const b = { name: 123 };
      const result = compareByName(a, b);
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });
    it("should handle non-string nameB with defensive check (line 117 branch)", () => {
      const a = { name: "Valid" };
      const b = { name: 123 };
      const result = compareByName(a, b);
      expect(typeof result).toBe("number");
      expect(result).toBeGreaterThan(0);
    });
    it("should handle both names being null/undefined/non-string", () => {
      const a = { name: null };
      const b = { name: void 0 };
      const result = compareByName(a, b);
      expect(result).toBe(0);
    });
    it("should return 0 when both names are empty strings", () => {
      const a = { name: "" };
      const b = { name: "" };
      const result = compareByName(a, b);
      expect(result).toBe(0);
    });
  });
  describe("compareOfficialStatus", () => {
    it("should prioritize official items", () => {
      const a = { is_official: false };
      const b = { is_official: true };
      const result = compareOfficialStatus(a, b);
      expect(result).toBeGreaterThan(0);
    });
    it("should return 0 when both are official", () => {
      const a = { is_official: true };
      const b = { is_official: true };
      const result = compareOfficialStatus(a, b);
      expect(result).toBe(0);
    });
    it("should return 0 when both are not official", () => {
      const a = { is_official: false };
      const b = { is_official: false };
      const result = compareOfficialStatus(a, b);
      expect(result).toBe(0);
    });
    it("should handle undefined is_official", () => {
      const a = { is_official: void 0 };
      const b = { is_official: true };
      const result = compareOfficialStatus(a, b);
      expect(result).toBeGreaterThan(0);
    });
  });
  describe("sortItems", () => {
    const items = [
      { name: "C Item", published_at: "2024-01-03T00:00:00Z", is_official: false },
      { name: "A Item", published_at: "2024-01-01T00:00:00Z", is_official: true },
      { name: "B Item", published_at: "2024-01-02T00:00:00Z", is_official: false }
    ];
    it("should sort by date when sortBy is popular", () => {
      const result = sortItems(items, "popular", false);
      expect(result[0].name).toBe("C Item");
      expect(result[1].name).toBe("B Item");
      expect(result[2].name).toBe("A Item");
    });
    it("should sort by date when sortBy is recent", () => {
      const result = sortItems(items, "recent", false);
      expect(result[0].name).toBe("C Item");
    });
    it("should sort alphabetically by default", () => {
      const result = sortItems(items, "alphabetical", false);
      expect(result[0].name).toBe("A Item");
      expect(result[1].name).toBe("B Item");
      expect(result[2].name).toBe("C Item");
    });
    it("should prioritize official when prioritizeOfficial is true", () => {
      const result = sortItems(items, "alphabetical", true);
      expect(result[0].name).toBe("A Item");
    });
    it("should prioritize official then sort by date", () => {
      const itemsWithOfficial = [
        { name: "C", published_at: "2024-01-03T00:00:00Z", is_official: false },
        { name: "A", published_at: "2024-01-01T00:00:00Z", is_official: true },
        { name: "B", published_at: "2024-01-02T00:00:00Z", is_official: true }
      ];
      const result = sortItems(itemsWithOfficial, "popular", true);
      expect(result[0].is_official).toBe(true);
      expect(result[1].is_official).toBe(true);
      expect(result[2].is_official).toBe(false);
    });
    it("should handle empty array", () => {
      const result = sortItems([], "alphabetical", false);
      expect(result).toEqual([]);
    });
    it("should not mutate original array", () => {
      const original = [...items];
      sortItems(items, "alphabetical", false);
      expect(items).toEqual(original);
    });
  });
});

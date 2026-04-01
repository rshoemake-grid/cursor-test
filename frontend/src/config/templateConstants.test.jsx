import {
  TEMPLATE_CATEGORIES,
  TEMPLATE_DIFFICULTIES,
  formatCategory,
  formatDifficulty
} from "./templateConstants";
describe("templateConstants", () => {
  describe("TEMPLATE_CATEGORIES", () => {
    it("should contain all expected categories", () => {
      expect(TEMPLATE_CATEGORIES).toContain("content_creation");
      expect(TEMPLATE_CATEGORIES).toContain("data_analysis");
      expect(TEMPLATE_CATEGORIES).toContain("customer_service");
      expect(TEMPLATE_CATEGORIES).toContain("research");
      expect(TEMPLATE_CATEGORIES).toContain("automation");
      expect(TEMPLATE_CATEGORIES).toContain("education");
      expect(TEMPLATE_CATEGORIES).toContain("marketing");
      expect(TEMPLATE_CATEGORIES).toContain("other");
    });
    it("should have exactly 8 categories", () => {
      expect(TEMPLATE_CATEGORIES).toHaveLength(8);
    });
  });
  describe("TEMPLATE_DIFFICULTIES", () => {
    it("should contain all expected difficulties", () => {
      expect(TEMPLATE_DIFFICULTIES).toContain("beginner");
      expect(TEMPLATE_DIFFICULTIES).toContain("intermediate");
      expect(TEMPLATE_DIFFICULTIES).toContain("advanced");
    });
    it("should have exactly 3 difficulties", () => {
      expect(TEMPLATE_DIFFICULTIES).toHaveLength(3);
    });
  });
  describe("formatCategory", () => {
    it("should replace underscores with spaces", () => {
      expect(formatCategory("content_creation")).toBe("content creation");
      expect(formatCategory("data_analysis")).toBe("data analysis");
      expect(formatCategory("customer_service")).toBe("customer service");
    });
    it("should handle categories with multiple underscores", () => {
      expect(formatCategory("content_creation")).toBe("content creation");
    });
    it("should handle categories without underscores", () => {
      expect(formatCategory("other")).toBe("other");
    });
  });
  describe("formatDifficulty", () => {
    it("should capitalize the first letter", () => {
      expect(formatDifficulty("beginner")).toBe("Beginner");
      expect(formatDifficulty("intermediate")).toBe("Intermediate");
      expect(formatDifficulty("advanced")).toBe("Advanced");
    });
    it("should leave the rest of the string unchanged", () => {
      expect(formatDifficulty("beginner")).toBe("Beginner");
      expect(formatDifficulty("intermediate")).toBe("Intermediate");
    });
  });
});

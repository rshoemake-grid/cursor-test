import { getDifficultyBadgeTheme } from "./difficultyColors";
import { colors } from "../styles/designTokens";

describe("getDifficultyBadgeTheme", () => {
  it("should map known difficulties to design token colors", () => {
    expect(getDifficultyBadgeTheme("beginner")).toEqual({
      background: colors.green100,
      color: colors.green800,
    });
    expect(getDifficultyBadgeTheme("intermediate")).toEqual({
      background: colors.yellow100,
      color: colors.yellow800,
    });
    expect(getDifficultyBadgeTheme("advanced")).toEqual({
      background: colors.red100,
      color: colors.red800,
    });
    expect(getDifficultyBadgeTheme("unknown")).toEqual({
      background: colors.gray100,
      color: colors.gray800,
    });
  });

  it("should return default theme for empty, expert, or non-matching case", () => {
    const fallback = {
      background: colors.gray100,
      color: colors.gray800,
    };
    expect(getDifficultyBadgeTheme("")).toEqual(fallback);
    expect(getDifficultyBadgeTheme("expert")).toEqual(fallback);
    expect(getDifficultyBadgeTheme("BEGINNER")).toEqual(fallback);
    expect(getDifficultyBadgeTheme("Intermediate")).toEqual(fallback);
  });
});

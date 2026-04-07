import { colors as c } from "../styles/designTokens";

/** Theme for styled-components badges (single source for marketplace cards). */
function getDifficultyBadgeTheme(difficulty) {
  switch (difficulty) {
    case "beginner":
      return { background: c.green100, color: c.green800 };
    case "intermediate":
      return { background: c.yellow100, color: c.yellow800 };
    case "advanced":
      return { background: c.red100, color: c.red800 };
    default:
      return { background: c.gray100, color: c.gray800 };
  }
}

export { getDifficultyBadgeTheme };

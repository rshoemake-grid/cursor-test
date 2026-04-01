const TEMPLATE_CATEGORIES = [
  "content_creation",
  "data_analysis",
  "customer_service",
  "research",
  "automation",
  "education",
  "marketing",
  "other"
];
const TEMPLATE_DIFFICULTIES = ["beginner", "intermediate", "advanced"];
function formatCategory(category) {
  return category.replace(/_/g, " ");
}
function formatDifficulty(difficulty) {
  return difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
}
export {
  TEMPLATE_CATEGORIES,
  TEMPLATE_DIFFICULTIES,
  formatCategory,
  formatDifficulty
};

function parseTags(tags) {
  return tags.split(",").map((t) => t.trim()).filter(Boolean);
}
function getDefaultPublishForm() {
  return {
    category: "automation",
    tags: "",
    difficulty: "beginner",
    estimated_time: ""
  };
}
export {
  getDefaultPublishForm,
  parseTags
};

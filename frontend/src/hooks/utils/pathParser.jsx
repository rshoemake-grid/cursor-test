function parsePath(path) {
  if (Array.isArray(path)) {
    return path.filter(Boolean);
  }
  if (typeof path === "string") {
    return path.split(".").filter(Boolean);
  }
  return [];
}
function validatePath(path) {
  const keys = parsePath(path);
  if (keys.length === 0) return false;
  return keys.every((key) => {
    return typeof key === "string" && key.length > 0;
  });
}
function hasArrayIndices(path) {
  const keys = parsePath(path);
  return keys.some((key) => /^\d+$/.test(key));
}
export { hasArrayIndices, parsePath, validatePath };

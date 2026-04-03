function getWindowType() {
  const windowType = typeof window;
  return windowType === "undefined" ? "undefined" : "object";
}
function isBrowserEnvironment() {
  return getWindowType() !== "undefined";
}
function isServerEnvironment() {
  return getWindowType() === "undefined";
}
export { isBrowserEnvironment, isServerEnvironment };

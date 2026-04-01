function getWindowType() {
  return typeof window;
}
function isBrowserEnvironment() {
  const windowType = getWindowType();
  return windowType !== "undefined";
}
function isServerEnvironment() {
  const windowType = getWindowType();
  return windowType === "undefined";
}
export {
  isBrowserEnvironment,
  isServerEnvironment
};

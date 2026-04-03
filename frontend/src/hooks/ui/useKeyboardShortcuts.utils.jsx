function isInputElement(target) {
  return (
    target.tagName === "INPUT" ||
    target.tagName === "TEXTAREA" ||
    target.isContentEditable === true
  );
}
function hasModifierKey(event) {
  return event.ctrlKey || event.metaKey;
}
function matchesKeyCombination(event, key, requireModifier = true) {
  if (requireModifier && !hasModifierKey(event)) {
    return false;
  }
  return event.key.toLowerCase() === key.toLowerCase();
}
function isDeleteKey(event) {
  return event.key === "Delete" || event.key === "Backspace";
}
export { hasModifierKey, isDeleteKey, isInputElement, matchesKeyCombination };

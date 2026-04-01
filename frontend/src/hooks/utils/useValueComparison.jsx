function defaultComparisonStrategy(current, previous) {
  if (typeof current === "object" && current !== null) {
    return JSON.stringify(current) !== JSON.stringify(previous);
  }
  return current !== previous;
}
function hasValueChanged(current, previous, strategy = defaultComparisonStrategy) {
  return strategy(current, previous);
}
export {
  defaultComparisonStrategy,
  hasValueChanged
};

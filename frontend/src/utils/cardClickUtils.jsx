function shouldIgnoreClick(target) {
  return (
    target.closest('input[type="checkbox"]') !== null ||
    target.closest("button") !== null ||
    target.tagName === "BUTTON" ||
    target.tagName === "INPUT" ||
    target.tagName === "SELECT" ||
    target.tagName === "A"
  );
}
function createCardClickHandler(toggleFn) {
  return (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    const target = e.target;
    if (shouldIgnoreClick(target)) {
      return;
    }
    toggleFn(id);
  };
}
export { createCardClickHandler, shouldIgnoreClick };

import { useEffect, useCallback } from "react";
function useKeyboardShortcuts({ shortcuts, enabled = true, target }) {
  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) {
        return;
      }
      for (const shortcut of shortcuts) {
        const keyMatches =
          event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatches =
          shortcut.ctrlKey === void 0 || event.ctrlKey === shortcut.ctrlKey;
        const shiftMatches =
          shortcut.shiftKey === void 0 || event.shiftKey === shortcut.shiftKey;
        const altMatches =
          shortcut.altKey === void 0 || event.altKey === shortcut.altKey;
        const metaMatches =
          shortcut.metaKey === void 0 || event.metaKey === shortcut.metaKey;
        if (
          keyMatches &&
          ctrlMatches &&
          shiftMatches &&
          altMatches &&
          metaMatches
        ) {
          const target2 = event.target;
          if (
            target2.tagName === "INPUT" ||
            target2.tagName === "TEXTAREA" ||
            target2.isContentEditable
          ) {
            continue;
          }
          event.preventDefault();
          shortcut.handler(event);
          break;
        }
      }
    },
    [shortcuts, enabled],
  );
  useEffect(() => {
    if (!enabled) {
      return;
    }
    const targetElement = target || window;
    targetElement.addEventListener("keydown", handleKeyDown);
    return () => {
      targetElement.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown, enabled, target]);
}
export { useKeyboardShortcuts };

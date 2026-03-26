/**
 * Keyboard Shortcuts Utility Functions
 * Extracted from useKeyboardShortcuts.ts to improve testability
 */ /**
 * Check if target element is an input field
 */ export function isInputElement(target) {
    return target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable === true;
}
/**
 * Check if modifier keys are pressed (Ctrl or Cmd)
 */ export function hasModifierKey(event) {
    return event.ctrlKey || event.metaKey;
}
/**
 * Check if key combination matches
 */ export function matchesKeyCombination(event, key, requireModifier = true) {
    if (requireModifier && !hasModifierKey(event)) {
        return false;
    }
    return event.key.toLowerCase() === key.toLowerCase();
}
/**
 * Check if delete key is pressed (Delete or Backspace)
 */ export function isDeleteKey(event) {
    return event.key === 'Delete' || event.key === 'Backspace';
}

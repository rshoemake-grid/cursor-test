/**
 * Custom Hook for Keyboard Shortcuts
 * SOLID: Single Responsibility - only manages keyboard shortcuts
 * DRY: Reusable keyboard shortcut logic
 * DIP: Depends on abstractions
 */ import { useEffect, useCallback } from 'react';
/**
 * Custom hook for managing keyboard shortcuts
 * 
 * @param options - Keyboard shortcuts configuration
 */ export function useKeyboardShortcuts({ shortcuts, enabled = true, target }) {
    const handleKeyDown = useCallback((event)=>{
        if (!enabled) {
            return;
        }
        for (const shortcut of shortcuts){
            const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase();
            const ctrlMatches = shortcut.ctrlKey === undefined || event.ctrlKey === shortcut.ctrlKey;
            const shiftMatches = shortcut.shiftKey === undefined || event.shiftKey === shortcut.shiftKey;
            const altMatches = shortcut.altKey === undefined || event.altKey === shortcut.altKey;
            const metaMatches = shortcut.metaKey === undefined || event.metaKey === shortcut.metaKey;
            if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
                // Don't trigger if typing in input/textarea/contenteditable
                const target = event.target;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
                    continue;
                }
                event.preventDefault();
                shortcut.handler(event);
                break;
            }
        }
    }, [
        shortcuts,
        enabled
    ]);
    useEffect(()=>{
        if (!enabled) {
            return;
        }
        const targetElement = target || window;
        targetElement.addEventListener('keydown', handleKeyDown);
        return ()=>{
            targetElement.removeEventListener('keydown', handleKeyDown);
        };
    }, [
        handleKeyDown,
        enabled,
        target
    ]);
}

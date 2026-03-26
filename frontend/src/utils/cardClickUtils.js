/**
 * Card Click Handler Utilities
 * DRY: Reusable logic for handling card clicks with selection
 * Single Responsibility: Only handles click event logic
 */ /**
 * Check if click target should be ignored (interactive elements)
 * 
 * @param target - The click target element
 * @returns True if click should be ignored
 */ export function shouldIgnoreClick(target) {
    return target.closest('input[type="checkbox"]') !== null || target.closest('button') !== null || target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.tagName === 'SELECT' || target.tagName === 'A';
}
/**
 * Create a card click handler that toggles selection
 * 
 * @template T - Type of ID being selected
 * @param toggleFn - Function to toggle selection for an ID
 * @returns Click handler function
 */ export function createCardClickHandler(toggleFn) {
    return (e, id)=>{
        e.preventDefault();
        e.stopPropagation();
        const target = e.target;
        if (shouldIgnoreClick(target)) {
            return;
        }
        toggleFn(id);
    };
}

/**
 * Validation Utilities
 * Common validation functions for form fields and user input
 */ /**
 * Validate workflow/tab name
 * 
 * @param name Name to validate
 * @returns Object with isValid flag and error message if invalid
 */ export function validateWorkflowName(name) {
    const trimmed = name.trim();
    if (trimmed === '') {
        return {
            isValid: false,
            error: 'Workflow name cannot be empty.'
        };
    }
    // Add more validation rules as needed
    if (trimmed.length > 100) {
        return {
            isValid: false,
            error: 'Workflow name cannot exceed 100 characters.'
        };
    }
    return {
        isValid: true
    };
}
/**
 * Sanitize and trim a name
 * 
 * @param name Name to sanitize
 * @returns Sanitized name
 */ export function sanitizeName(name) {
    return name.trim();
}
/**
 * Check if a name is valid (non-empty after trimming)
 * 
 * @param name Name to check
 * @returns True if name is valid
 */ export function isValidName(name) {
    return sanitizeName(name).length > 0;
}
/**
 * Validate that name has changed
 * 
 * @param newName New name value
 * @param currentName Current name value
 * @returns True if name has actually changed
 */ export function hasNameChanged(newName, currentName) {
    return sanitizeName(newName) !== sanitizeName(currentName);
}

/**
 * Error Factory Utility
 * 
 * Provides safe error creation functions for use in hooks and components.
 * Uses fallback strategies to ensure errors are always created successfully.
 */

/**
 * Safely create an error object that won't crash processes even when mutated
 * 
 * This function uses multiple fallback strategies to ensure an error is always created.
 * It never throws synchronously.
 * 
 * @param message - The error message
 * @param name - The error name/type
 * @returns An Error object (or error-like object if Error constructor fails)
 */
export function createSafeError(message: string, name: string): Error {
  try {
    // Strategy 1: Standard Error constructor
    const error = new Error(message ?? '');
    // Preserve empty string if provided, otherwise use 'Error' as default
    error.name = name ?? 'Error';
    return error;
  } catch {
    try {
      // Strategy 2: Create error with Error prototype
      const error = Object.create(Error.prototype);
      error.message = message ?? '';
      // Preserve empty string if provided, otherwise use 'Error' as default
      error.name = name ?? 'Error';
      error.stack = '';
      return error;
    } catch {
      // Strategy 3: Plain object with error-like structure (ultimate fallback)
      return {
        message: message ?? '',
        // Preserve empty string if provided, otherwise use 'Error' as default
        name: name ?? 'Error',
        stack: '',
      } as Error;
    }
  }
}

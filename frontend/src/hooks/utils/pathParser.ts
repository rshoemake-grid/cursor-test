/**
 * Path Parser Utility
 * Single Responsibility: Only parses and validates paths
 * DRY: Single source of truth for path parsing logic
 */

/**
 * Parse path string or array into normalized array
 * DRY: Single source of truth for path parsing
 * 
 * @param path Path as string (dot-notation) or array
 * @returns Normalized array of path keys
 */
export function parsePath(path: string | string[]): string[] {
  if (Array.isArray(path)) {
    return path.filter(Boolean) // Remove empty strings
  }
  if (typeof path === 'string') {
    return path.split('.').filter(Boolean)
  }
  return []
}

/**
 * Validate path format
 * Single Responsibility: Only validates
 * 
 * @param path Path to validate
 * @returns True if path is valid, false otherwise
 */
export function validatePath(path: string | string[]): boolean {
  const keys = parsePath(path)
  if (keys.length === 0) return false
  
  // Validate each key format (no empty strings, basic format check)
  return keys.every(key => {
    return typeof key === 'string' && key.length > 0
  })
}

/**
 * Check if path contains array indices
 * 
 * @param path Path to check
 * @returns True if path contains numeric indices
 */
export function hasArrayIndices(path: string | string[]): boolean {
  const keys = parsePath(path)
  return keys.some(key => /^\d+$/.test(key))
}

/**
 * Form Field Utilities (Hooks)
 * Re-exports from utils/formUtils for convenience in hooks
 * 
 * This file provides a convenient import path for hooks that need form utilities.
 * The actual implementation is in utils/formUtils.ts to avoid duplication.
 */

export {
  getNestedValue,
  setNestedValue,
  hasNestedValue,
} from '../../utils/formUtils'

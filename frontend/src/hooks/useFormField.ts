import { useState, useEffect, useRef, useCallback } from 'react'

/**
 * Reusable form field hook
 * Follows DRY principle by eliminating duplicated form field state management code
 */
export interface UseFormFieldOptions<T> {
  initialValue: T
  onUpdate: (value: T) => void
  nodeData?: any
  dataPath?: string | string[] // Path to value in nodeData (e.g., 'agent_config.model' or ['agent_config', 'model'])
  syncWithNodeData?: boolean // Whether to sync with nodeData changes
}

/**
 * Get nested value from object using path
 */
function getNestedValue(obj: any, path: string | string[]): any {
  if (!obj || !path) return undefined
  
  const keys = Array.isArray(path) ? path : path.split('.')
  let value = obj
  
  for (const key of keys) {
    if (value === null || value === undefined) {
      return undefined
    }
    value = value[key]
  }
  
  return value
}

/**
 * Custom hook for managing form field state with node data synchronization
 */
export function useFormField<T>(
  options: UseFormFieldOptions<T>
): {
  value: T
  setValue: (value: T | ((prev: T) => T)) => void
  inputRef: React.RefObject<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
} {
  const {
    initialValue,
    onUpdate,
    nodeData,
    dataPath,
    syncWithNodeData = true,
  } = options

  const [value, setValueState] = useState<T>(() => {
    if (nodeData && dataPath && syncWithNodeData) {
      const nodeValue = getNestedValue(nodeData, dataPath)
      return nodeValue !== undefined ? nodeValue : initialValue
    }
    return initialValue
  })

  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  // Sync with nodeData changes (but not when user is actively editing)
  useEffect(() => {
    if (!syncWithNodeData || !nodeData || !dataPath) {
      return
    }

    // Don't update if the input is currently focused (user is typing)
    if (document.activeElement === inputRef.current) {
      return
    }

    const nodeValue = getNestedValue(nodeData, dataPath)
    if (nodeValue !== undefined && nodeValue !== value) {
      setValueState(nodeValue as T)
    }
  }, [nodeData, dataPath, syncWithNodeData, value])

  const setValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      const valueToSet = typeof newValue === 'function' 
        ? (newValue as (prev: T) => T)(value)
        : newValue
      
      setValueState(valueToSet)
      onUpdate(valueToSet)
    },
    [value, onUpdate]
  )

  return {
    value,
    setValue,
    inputRef,
  }
}

/**
 * Simplified version for basic form fields without node data sync
 */
export function useSimpleFormField<T>(
  initialValue: T,
  onUpdate: (value: T) => void
) {
  return useFormField({
    initialValue,
    onUpdate,
    syncWithNodeData: false,
  })
}

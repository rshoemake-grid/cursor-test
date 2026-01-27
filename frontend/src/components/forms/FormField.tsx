import React, { useRef } from 'react'
import { useFormField } from '../../hooks/useFormField'

export interface FormFieldProps<T = any> {
  label: string
  id: string
  value: T
  onChange: (value: T) => void
  type?: 'text' | 'textarea' | 'select' | 'number' | 'checkbox' | 'email' | 'password'
  placeholder?: string
  description?: string
  options?: Array<{ value: string; label: string }>
  required?: boolean
  disabled?: boolean
  className?: string
  // For node data synchronization
  nodeData?: any
  dataPath?: string | string[]
  syncWithNodeData?: boolean
  // Additional props
  min?: number
  max?: number
  rows?: number // For textarea
  'aria-label'?: string
}

/**
 * Reusable form field component
 * Follows DRY principle by eliminating duplicated form field rendering code
 */
export function FormField<T = any>({
  label,
  id,
  value: controlledValue,
  onChange,
  type = 'text',
  placeholder,
  description,
  options,
  required = false,
  disabled = false,
  className = '',
  nodeData,
  dataPath,
  syncWithNodeData = false,
  min,
  max,
  rows = 4,
  'aria-label': ariaLabel,
}: FormFieldProps<T>) {
  // Use controlled value if provided, otherwise use hook for node data sync
  const useHook = syncWithNodeData && nodeData && dataPath
  const fieldHook = useHook
    ? useFormField({
        initialValue: controlledValue as T,
        onUpdate: onChange,
        nodeData,
        dataPath,
        syncWithNodeData: true,
      })
    : null

  const value = useHook ? fieldHook!.value : controlledValue
  const inputRef = useHook ? fieldHook!.inputRef : useRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(null)

  const baseInputClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent'
  const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : ''

  const renderInput = () => {
    const commonProps = {
      id,
      ref: inputRef as any,
      value: value as any,
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        if (type === 'checkbox') {
          onChange((e.target as HTMLInputElement).checked as T)
        } else if (type === 'number') {
          onChange(Number(e.target.value) as T)
        } else {
          onChange(e.target.value as T)
        }
      },
      disabled,
      required,
      'aria-label': ariaLabel || label,
      className: `${baseInputClasses} ${disabledClasses} ${className}`,
    }

    switch (type) {
      case 'textarea':
        return (
          <textarea
            {...commonProps}
            placeholder={placeholder}
            rows={rows}
          />
        )

      case 'select':
        return (
          <select {...commonProps}>
            {options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        )

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <input
              {...commonProps}
              type="checkbox"
              checked={value as boolean}
              className="w-4 h-4"
            />
            {description && (
              <span className="text-sm text-gray-600">{description}</span>
            )}
          </div>
        )

      default:
        return (
          <input
            {...commonProps}
            type={type}
            placeholder={placeholder}
            min={min}
            max={max}
          />
        )
    }
  }

  return (
    <div className="mb-4">
      {type !== 'checkbox' && (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {renderInput()}
      {description && type !== 'checkbox' && (
        <p className="text-xs text-gray-500 mt-1">{description}</p>
      )}
    </div>
  )
}

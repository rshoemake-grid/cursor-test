import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useRef } from 'react';
// Domain-based imports - Phase 7
import { useFormField } from '../../hooks/forms';
// DRY: Use centralized input type handler
import { useInputTypeHandler } from '../../hooks/forms/useInputTypeHandler';
/**
 * Reusable form field component
 * Follows DRY principle by eliminating duplicated form field rendering code
 */ export function FormField({ label, id, value: controlledValue, onChange, type = 'text', placeholder, description, options, required = false, disabled = false, className = '', nodeData, dataPath, syncWithNodeData = false, min, max, rows = 4, 'aria-label': ariaLabel }) {
    // Always call hooks unconditionally - React Hooks rules
    // Use controlled value if provided, otherwise use hook for node data sync
    const useHook = syncWithNodeData && nodeData && dataPath;
    const fieldHook = useFormField({
        initialValue: controlledValue,
        onUpdate: onChange,
        nodeData: useHook ? nodeData : undefined,
        dataPath: useHook ? dataPath : undefined,
        syncWithNodeData: useHook ? true : false
    });
    const fallbackRef = useRef(null);
    const value = useHook ? fieldHook.value : controlledValue;
    const inputRef = useHook ? fieldHook.inputRef : fallbackRef;
    // DRY: Use centralized input type handler
    const handleInputChange = useInputTypeHandler(type, onChange);
    const baseInputClasses = 'w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent';
    const disabledClasses = disabled ? 'bg-gray-100 cursor-not-allowed' : '';
    const renderInput = ()=>{
        const commonProps = {
            id,
            ref: inputRef,
            value: value,
            onChange: handleInputChange,
            disabled,
            required,
            'aria-label': ariaLabel || label,
            className: `${baseInputClasses} ${disabledClasses} ${className}`
        };
        switch(type){
            case 'textarea':
                return /*#__PURE__*/ _jsx("textarea", {
                    ...commonProps,
                    placeholder: placeholder,
                    rows: rows
                });
            case 'select':
                return /*#__PURE__*/ _jsx("select", {
                    ...commonProps,
                    children: options?.map((option)=>/*#__PURE__*/ _jsx("option", {
                            value: option.value,
                            children: option.label
                        }, option.value))
                });
            case 'checkbox':
                return /*#__PURE__*/ _jsxs("div", {
                    className: "flex items-center gap-2",
                    children: [
                        /*#__PURE__*/ _jsx("input", {
                            ...commonProps,
                            type: "checkbox",
                            checked: value,
                            className: "w-4 h-4"
                        }),
                        description && /*#__PURE__*/ _jsx("span", {
                            className: "text-sm text-gray-600",
                            children: description
                        })
                    ]
                });
            default:
                return /*#__PURE__*/ _jsx("input", {
                    ...commonProps,
                    type: type,
                    placeholder: placeholder,
                    min: min,
                    max: max
                });
        }
    };
    return /*#__PURE__*/ _jsxs("div", {
        className: "mb-4",
        children: [
            type !== 'checkbox' && /*#__PURE__*/ _jsxs("label", {
                htmlFor: id,
                className: "block text-sm font-medium text-gray-700 mb-1",
                children: [
                    label,
                    required && /*#__PURE__*/ _jsx("span", {
                        className: "text-red-500 ml-1",
                        children: "*"
                    })
                ]
            }),
            renderInput(),
            description && type !== 'checkbox' && /*#__PURE__*/ _jsx("p", {
                className: "text-xs text-gray-500 mt-1",
                children: description
            })
        ]
    });
}

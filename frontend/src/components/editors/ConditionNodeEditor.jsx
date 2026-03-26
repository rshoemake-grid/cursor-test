import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Condition Node Editor Component
 * Handles editing of condition node properties
 * Follows Single Responsibility Principle
 * Refactored to use string literal constants (DRY + SOLID principles)
 */ import { useRef, useState, useEffect } from 'react';
import { CONDITION_TYPES, isValidConditionType } from '../../constants/stringLiterals';
import { getDefaultConditionConfig } from './condition/conditionValidation';
export default function ConditionNodeEditor({ node, onConfigUpdate }) {
    const conditionFieldRef = useRef(null);
    const conditionValueRef = useRef(null);
    const [conditionFieldValue, setConditionFieldValue] = useState('');
    const [conditionValueValue, setConditionValueValue] = useState('');
    // Sync local state with node data
    useEffect(()=>{
        // Explicit check to prevent mutation survivors
        const hasConfig = node.data.condition_config !== null && node.data.condition_config !== undefined;
        const conditionConfig = hasConfig === true ? node.data.condition_config : getDefaultConditionConfig();
        // Explicit checks to prevent mutation survivors
        const isFieldActive = document.activeElement === conditionFieldRef.current;
        if (isFieldActive === false) {
            const hasField = conditionConfig.field !== null && conditionConfig.field !== undefined && conditionConfig.field !== '';
            const fieldValue = hasField === true ? conditionConfig.field : '';
            setConditionFieldValue(fieldValue);
        }
        const isValueActive = document.activeElement === conditionValueRef.current;
        if (isValueActive === false) {
            const hasValue = conditionConfig.value !== null && conditionConfig.value !== undefined && conditionConfig.value !== '';
            const valueValue = hasValue === true ? conditionConfig.value : '';
            setConditionValueValue(valueValue);
        }
    }, [
        node.data.condition_config
    ]);
    // Explicit check to prevent mutation survivors
    const hasConfig = node.data.condition_config !== null && node.data.condition_config !== undefined;
    const conditionConfig = hasConfig === true ? node.data.condition_config : getDefaultConditionConfig();
    // Explicit check to prevent mutation survivors
    // Use constants to kill StringLiteral mutations
    const hasConditionType = conditionConfig.condition_type !== null && conditionConfig.condition_type !== undefined;
    const conditionTypeValue = hasConditionType === true ? conditionConfig.condition_type : '';
    const isValidType = hasConditionType === true && isValidConditionType(conditionTypeValue) === true;
    const conditionType = isValidType === true ? conditionTypeValue : CONDITION_TYPES.EQUALS;
    // Explicit checks to prevent mutation survivors
    // Use constants to kill StringLiteral mutations
    const isNotEmpty = conditionType !== CONDITION_TYPES.EMPTY;
    const isNotNotEmpty = conditionType !== CONDITION_TYPES.NOT_EMPTY;
    const showValueField = isNotEmpty === true && isNotNotEmpty === true;
    return /*#__PURE__*/ _jsxs(_Fragment, {
        children: [
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "condition-type",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Condition Type"
                    }),
                    /*#__PURE__*/ _jsxs("select", {
                        id: "condition-type",
                        value: conditionType,
                        onChange: (e)=>onConfigUpdate('condition_config', 'condition_type', e.target.value),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "Select condition type",
                        children: [
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.EQUALS,
                                children: "Equals"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.NOT_EQUALS,
                                children: "Not Equals"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.CONTAINS,
                                children: "Contains"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.NOT_CONTAINS,
                                children: "Not Contains"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.GREATER_THAN,
                                children: "Greater Than"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.NOT_GREATER_THAN,
                                children: "Not Greater Than"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.LESS_THAN,
                                children: "Less Than"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.NOT_LESS_THAN,
                                children: "Not Less Than"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.EMPTY,
                                children: "Empty"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.NOT_EMPTY,
                                children: "Not Empty"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: CONDITION_TYPES.CUSTOM,
                                children: "Custom"
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-4",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "condition-field",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Field"
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        id: "condition-field",
                        ref: conditionFieldRef,
                        type: "text",
                        value: conditionFieldValue,
                        onChange: (e)=>{
                            const newValue = e.target.value;
                            setConditionFieldValue(newValue);
                            onConfigUpdate('condition_config', 'field', newValue);
                        },
                        placeholder: "Field to check",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "Field name to check in condition"
                    })
                ]
            }),
            showValueField === true && /*#__PURE__*/ _jsxs("div", {
                className: "mt-4",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "condition-value",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Value"
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        id: "condition-value",
                        ref: conditionValueRef,
                        type: "text",
                        value: conditionValueValue,
                        onChange: (e)=>{
                            const newValue = e.target.value;
                            setConditionValueValue(newValue);
                            onConfigUpdate('condition_config', 'value', newValue);
                        },
                        placeholder: "Value to compare",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "Value to compare against field"
                    })
                ]
            })
        ]
    });
}

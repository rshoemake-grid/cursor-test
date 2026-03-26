import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
/**
 * Extracted execution input dialog component
 * Follows Single Responsibility Principle - only handles input collection UI
 */ export default function ExecutionInputDialog({ isOpen, onClose, onSubmit, nodes, workflowName }) {
    const [inputs, setInputs] = useState({});
    // Reset inputs when dialog opens/closes
    useEffect(()=>{
        if (isOpen) {
            // Initialize inputs from nodes that have input_config
            const initialInputs = {};
            nodes.forEach((node)=>{
                if (node.type === 'start' && node.input_config) {
                    const inputConfig = node.input_config;
                    if (inputConfig.inputs) {
                        inputConfig.inputs.forEach((input)=>{
                            initialInputs[input.name] = input.default_value || '';
                        });
                    }
                }
            });
            setInputs(initialInputs);
        } else {
            setInputs({});
        }
    }, [
        isOpen,
        nodes
    ]);
    if (!isOpen) return null;
    // Get input nodes (nodes with input_config)
    const inputNodes = nodes.filter((node)=>node.type === 'start' && node.input_config);
    const handleSubmit = (e)=>{
        e.preventDefault();
        onSubmit(inputs);
        onClose();
    };
    const handleInputChange = (name, value)=>{
        setInputs((prev)=>({
                ...prev,
                [name]: value
            }));
    };
    return /*#__PURE__*/ _jsx("div", {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
        children: /*#__PURE__*/ _jsxs("div", {
            className: "bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto",
            children: [
                /*#__PURE__*/ _jsxs("div", {
                    className: "flex items-center justify-between p-6 border-b border-gray-200",
                    children: [
                        /*#__PURE__*/ _jsx("h2", {
                            className: "text-xl font-semibold text-gray-900",
                            children: workflowName ? `Execute: ${workflowName}` : 'Execute Workflow'
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            onClick: onClose,
                            className: "text-gray-400 hover:text-gray-600 transition-colors",
                            "aria-label": "Close dialog",
                            children: /*#__PURE__*/ _jsx(X, {
                                className: "w-6 h-6"
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("form", {
                    onSubmit: handleSubmit,
                    className: "p-6",
                    children: [
                        inputNodes.length === 0 ? /*#__PURE__*/ _jsx("div", {
                            className: "text-gray-600 mb-6",
                            children: "This workflow doesn't require any inputs. Click Execute to run it."
                        }) : /*#__PURE__*/ _jsx("div", {
                            className: "space-y-4 mb-6",
                            children: inputNodes.map((node)=>{
                                const inputConfig = node.input_config;
                                if (!inputConfig.inputs || inputConfig.inputs.length === 0) {
                                    return null;
                                }
                                return /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("h3", {
                                            className: "text-sm font-medium text-gray-700 mb-3",
                                            children: node.name || 'Inputs'
                                        }),
                                        /*#__PURE__*/ _jsx("div", {
                                            className: "space-y-3",
                                            children: inputConfig.inputs.map((input)=>/*#__PURE__*/ _jsxs("div", {
                                                    children: [
                                                        /*#__PURE__*/ _jsxs("label", {
                                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                                            children: [
                                                                input.label || input.name,
                                                                input.required && /*#__PURE__*/ _jsx("span", {
                                                                    className: "text-red-500 ml-1",
                                                                    children: "*"
                                                                })
                                                            ]
                                                        }),
                                                        input.type === 'textarea' ? /*#__PURE__*/ _jsx("textarea", {
                                                            value: inputs[input.name] || '',
                                                            onChange: (e)=>handleInputChange(input.name, e.target.value),
                                                            required: input.required,
                                                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                                            rows: 4,
                                                            placeholder: input.placeholder || ''
                                                        }) : /*#__PURE__*/ _jsx("input", {
                                                            type: input.type || 'text',
                                                            value: inputs[input.name] || '',
                                                            onChange: (e)=>handleInputChange(input.name, input.type === 'number' ? Number(e.target.value) : e.target.value),
                                                            required: input.required,
                                                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500",
                                                            placeholder: input.placeholder || ''
                                                        }),
                                                        input.description && /*#__PURE__*/ _jsx("p", {
                                                            className: "mt-1 text-xs text-gray-500",
                                                            children: input.description
                                                        })
                                                    ]
                                                }, input.name))
                                        })
                                    ]
                                }, node.id);
                            })
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center justify-end gap-3 pt-4 border-t border-gray-200",
                            children: [
                                /*#__PURE__*/ _jsx("button", {
                                    type: "button",
                                    onClick: onClose,
                                    className: "px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors",
                                    children: "Cancel"
                                }),
                                /*#__PURE__*/ _jsx("button", {
                                    type: "submit",
                                    className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors",
                                    children: "Execute"
                                })
                            ]
                        })
                    ]
                })
            ]
        })
    });
}

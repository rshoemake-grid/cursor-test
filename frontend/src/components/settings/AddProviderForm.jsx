import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * Add Provider Form Component
 * Extracted from SettingsTabContent to improve SRP compliance
 * Single Responsibility: Only handles add provider form rendering
 */ import { Plus } from 'lucide-react';
/**
 * Add Provider Form Component
 * DRY: Centralized add provider form rendering
 */ export function AddProviderForm({ showAddProvider, onShowAddProvider, selectedTemplate, onSelectedTemplateChange, onAddProvider }) {
    if (!showAddProvider) {
        return /*#__PURE__*/ _jsxs("button", {
            onClick: ()=>onShowAddProvider(true),
            className: "w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-primary-500 hover:text-primary-600 flex items-center justify-center gap-2",
            children: [
                /*#__PURE__*/ _jsx(Plus, {
                    className: "w-5 h-5"
                }),
                "Add LLM Provider"
            ]
        });
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
        children: [
            /*#__PURE__*/ _jsx("h3", {
                className: "text-lg font-semibold text-gray-900 mb-4",
                children: "Add New Provider"
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "provider-type-select",
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Select Provider Type"
                            }),
                            /*#__PURE__*/ _jsxs("select", {
                                id: "provider-type-select",
                                value: selectedTemplate,
                                onChange: (e)=>onSelectedTemplateChange(e.target.value),
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                                children: [
                                    /*#__PURE__*/ _jsx("option", {
                                        value: "openai",
                                        children: "OpenAI (GPT-4, GPT-3.5, etc.)"
                                    }),
                                    /*#__PURE__*/ _jsx("option", {
                                        value: "anthropic",
                                        children: "Anthropic (Claude)"
                                    }),
                                    /*#__PURE__*/ _jsx("option", {
                                        value: "gemini",
                                        children: "Google Gemini"
                                    }),
                                    /*#__PURE__*/ _jsx("option", {
                                        value: "custom",
                                        children: "Custom Provider"
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex gap-3",
                        children: [
                            /*#__PURE__*/ _jsx("button", {
                                onClick: onAddProvider,
                                className: "flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700",
                                children: "Add Provider"
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>onShowAddProvider(false),
                                className: "flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200",
                                children: "Cancel"
                            })
                        ]
                    })
                ]
            })
        ]
    });
}

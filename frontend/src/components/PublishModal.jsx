import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/**
 * PublishModal Component
 * Renders the publish to marketplace modal form
 */ import { X } from 'lucide-react';
import { TEMPLATE_CATEGORIES, TEMPLATE_DIFFICULTIES, formatCategory, formatDifficulty } from '../config/templateConstants';
export function PublishModal({ isOpen, form, isPublishing, onClose, onFormChange, onSubmit }) {
    if (!isOpen) return null;
    return /*#__PURE__*/ _jsx("div", {
        className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40",
        children: /*#__PURE__*/ _jsxs("form", {
            onSubmit: (e)=>{
                e.preventDefault();
                onSubmit(e);
            },
            className: "bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4",
            children: [
                /*#__PURE__*/ _jsxs("div", {
                    className: "flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ _jsx("h3", {
                            className: "text-lg font-semibold text-gray-900",
                            children: "Publish to Marketplace"
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            type: "button",
                            onClick: onClose,
                            className: "text-gray-500 hover:text-gray-700",
                            children: /*#__PURE__*/ _jsx(X, {
                                className: "w-5 h-5"
                            })
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    children: [
                        /*#__PURE__*/ _jsx("label", {
                            className: "block text-sm font-medium text-gray-700 mb-1",
                            children: "Workflow Name"
                        }),
                        /*#__PURE__*/ _jsx("input", {
                            type: "text",
                            value: form.name,
                            onChange: (e)=>onFormChange('name', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                            required: true
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    children: [
                        /*#__PURE__*/ _jsx("label", {
                            className: "block text-sm font-medium text-gray-700 mb-1",
                            children: "Description (optional)"
                        }),
                        /*#__PURE__*/ _jsx("textarea", {
                            value: form.description,
                            onChange: (e)=>onFormChange('description', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                            rows: 3
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    children: [
                        /*#__PURE__*/ _jsx("label", {
                            className: "block text-sm font-medium text-gray-700 mb-1",
                            children: "Category"
                        }),
                        /*#__PURE__*/ _jsx("select", {
                            value: form.category,
                            onChange: (e)=>onFormChange('category', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                            children: TEMPLATE_CATEGORIES.map((category)=>/*#__PURE__*/ _jsx("option", {
                                    value: category,
                                    children: formatCategory(category)
                                }, category))
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "flex gap-4",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex-1",
                            children: [
                                /*#__PURE__*/ _jsx("label", {
                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                    children: "Difficulty"
                                }),
                                /*#__PURE__*/ _jsx("select", {
                                    value: form.difficulty,
                                    onChange: (e)=>onFormChange('difficulty', e.target.value),
                                    className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                                    children: TEMPLATE_DIFFICULTIES.map((diff)=>/*#__PURE__*/ _jsx("option", {
                                            value: diff,
                                            children: formatDifficulty(diff)
                                        }, diff))
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex-1",
                            children: [
                                /*#__PURE__*/ _jsx("label", {
                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                    children: "Estimated Time"
                                }),
                                /*#__PURE__*/ _jsx("input", {
                                    type: "text",
                                    value: form.estimated_time,
                                    onChange: (e)=>onFormChange('estimated_time', e.target.value),
                                    className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                                    placeholder: "e.g. 30 minutes"
                                })
                            ]
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    children: [
                        /*#__PURE__*/ _jsx("label", {
                            className: "block text-sm font-medium text-gray-700 mb-1",
                            children: "Tags (comma separated)"
                        }),
                        /*#__PURE__*/ _jsx("input", {
                            type: "text",
                            value: form.tags,
                            onChange: (e)=>onFormChange('tags', e.target.value),
                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                            placeholder: "automation, ai, ... "
                        })
                    ]
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "flex justify-end gap-2",
                    children: [
                        /*#__PURE__*/ _jsx("button", {
                            type: "button",
                            onClick: onClose,
                            className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50",
                            children: "Cancel"
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            type: "submit",
                            disabled: isPublishing,
                            className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2",
                            children: isPublishing ? 'Publishing...' : 'Publish'
                        })
                    ]
                })
            ]
        })
    });
}

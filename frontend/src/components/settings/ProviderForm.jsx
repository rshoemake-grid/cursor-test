import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Provider Form Component
 * Extracted from SettingsPage to improve SRP compliance and reusability
 * Single Responsibility: Only handles provider form rendering and interactions
 */ import { Eye, EyeOff, Trash2, ChevronDown, ChevronRight, Plus, Loader, CheckCircle, XCircle } from 'lucide-react';
import { showError } from '../../utils/notifications';
/**
 * Provider Form Component
 * DRY: Reusable form for all providers
 */ export function ProviderForm({ provider, showApiKeys, expandedProviders, expandedModels, testingProvider, testResults, onToggleProviderModels, onToggleApiKeyVisibility, onUpdateProvider, onDeleteProvider, onAddCustomModel, onTestProvider, onToggleModel, isModelExpanded }) {
    const isExpanded = expandedProviders[provider.id] || false;
    const isTesting = testingProvider === provider.id;
    const testResult = testResults[provider.id];
    return /*#__PURE__*/ _jsxs("div", {
        className: "bg-white rounded-lg shadow-sm border border-gray-200 p-6",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-start justify-between mb-4",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center gap-3",
                        children: [
                            /*#__PURE__*/ _jsx("input", {
                                type: "checkbox",
                                checked: provider.enabled,
                                onChange: (e)=>onUpdateProvider(provider.id, {
                                        enabled: e.target.checked
                                    }),
                                className: "w-5 h-5 text-primary-600 rounded"
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                children: [
                                    /*#__PURE__*/ _jsx("h3", {
                                        className: "text-lg font-semibold text-gray-900",
                                        children: provider.name
                                    }),
                                    /*#__PURE__*/ _jsx("span", {
                                        className: "text-sm text-gray-500 capitalize",
                                        children: provider.type
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>onToggleProviderModels(provider.id),
                                className: "text-gray-600 hover:text-gray-700 p-2",
                                title: isExpanded ? "Collapse models" : "Expand models",
                                children: isExpanded ? /*#__PURE__*/ _jsx(ChevronDown, {
                                    className: "w-5 h-5"
                                }) : /*#__PURE__*/ _jsx(ChevronRight, {
                                    className: "w-5 h-5"
                                })
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>onDeleteProvider(provider.id),
                                className: "text-red-600 hover:text-red-700 p-2",
                                title: "Delete provider",
                                children: /*#__PURE__*/ _jsx(Trash2, {
                                    className: "w-5 h-5"
                                })
                            })
                        ]
                    })
                ]
            }),
            isExpanded && /*#__PURE__*/ _jsxs("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "API Key"
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "relative",
                                children: [
                                    /*#__PURE__*/ _jsx("input", {
                                        type: showApiKeys[provider.id] ? "text" : "password",
                                        value: provider.apiKey || '',
                                        onChange: (e)=>onUpdateProvider(provider.id, {
                                                apiKey: e.target.value
                                            }),
                                        placeholder: "sk-...",
                                        className: "w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    }),
                                    /*#__PURE__*/ _jsx("button", {
                                        type: "button",
                                        onClick: ()=>onToggleApiKeyVisibility(provider.id),
                                        className: "absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700 focus:outline-none",
                                        title: showApiKeys[provider.id] ? "Hide API key" : "Show API key",
                                        children: showApiKeys[provider.id] ? /*#__PURE__*/ _jsx(EyeOff, {
                                            className: "w-5 h-5"
                                        }) : /*#__PURE__*/ _jsx(Eye, {
                                            className: "w-5 h-5"
                                        })
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Base URL"
                            }),
                            /*#__PURE__*/ _jsx("input", {
                                type: "text",
                                value: provider.baseUrl || '',
                                onChange: (e)=>onUpdateProvider(provider.id, {
                                        baseUrl: e.target.value
                                    }),
                                placeholder: "https://api.example.com/v1",
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                className: "block text-sm font-medium text-gray-700 mb-2",
                                children: "Default Model"
                            }),
                            /*#__PURE__*/ _jsxs("div", {
                                className: "flex gap-2",
                                children: [
                                    /*#__PURE__*/ _jsx("select", {
                                        value: provider.defaultModel || '',
                                        onChange: (e)=>onUpdateProvider(provider.id, {
                                                defaultModel: e.target.value
                                            }),
                                        className: "flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                                        children: (provider.models || []).map((model)=>/*#__PURE__*/ _jsx("option", {
                                                value: model,
                                                children: model
                                            }, model))
                                    }),
                                    /*#__PURE__*/ _jsx("button", {
                                        onClick: ()=>onAddCustomModel(provider.id),
                                        className: "px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2",
                                        title: "Add custom model",
                                        children: /*#__PURE__*/ _jsx(Plus, {
                                            className: "w-4 h-4"
                                        })
                                    })
                                ]
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx(ModelList, {
                        provider: provider,
                        expandedModels: expandedModels,
                        onUpdateProvider: onUpdateProvider,
                        onToggleModel: onToggleModel,
                        isModelExpanded: isModelExpanded
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center gap-3 pt-2",
                        children: [
                            /*#__PURE__*/ _jsx("button", {
                                onClick: ()=>onTestProvider(provider),
                                disabled: !provider.apiKey || isTesting,
                                className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2",
                                children: isTesting ? /*#__PURE__*/ _jsxs(_Fragment, {
                                    children: [
                                        /*#__PURE__*/ _jsx(Loader, {
                                            className: "w-4 h-4 animate-spin"
                                        }),
                                        "Testing..."
                                    ]
                                }) : 'Test Connection'
                            }),
                            testResult?.status === 'success' && /*#__PURE__*/ _jsxs("div", {
                                className: "flex items-center gap-2 text-green-600",
                                children: [
                                    /*#__PURE__*/ _jsx(CheckCircle, {
                                        className: "w-5 h-5"
                                    }),
                                    /*#__PURE__*/ _jsx("span", {
                                        children: testResult.message
                                    })
                                ]
                            }),
                            testResult?.status === 'error' && /*#__PURE__*/ _jsxs("div", {
                                className: "flex flex-col gap-1",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "flex items-center gap-2 text-red-600",
                                        children: [
                                            /*#__PURE__*/ _jsx(XCircle, {
                                                className: "w-5 h-5"
                                            }),
                                            /*#__PURE__*/ _jsx("span", {
                                                className: "font-medium",
                                                children: "Connection failed"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsx("p", {
                                        className: "text-sm text-red-700 ml-7",
                                        children: testResult.message
                                    })
                                ]
                            })
                        ]
                    })
                ]
            })
        ]
    });
}
function ModelList({ provider, onUpdateProvider, onToggleModel, isModelExpanded,
expandedModels: _expandedModels // Unused but part of interface - prefix with underscore to indicate intentionally unused
 }) {
    const handleDeleteModel = (model)=>{
        if ((provider.models || []).length > 1) {
            const newModels = (provider.models || []).filter((m)=>m !== model);
            const newDefaultModel = provider.defaultModel === model ? newModels[0] || '' : provider.defaultModel;
            onUpdateProvider(provider.id, {
                models: newModels,
                defaultModel: newDefaultModel
            });
            // Remove from expanded state if it was expanded
            if (isModelExpanded(provider.id, model)) {
                onToggleModel(provider.id, model);
            }
        }
    };
    return /*#__PURE__*/ _jsxs("div", {
        children: [
            /*#__PURE__*/ _jsx("label", {
                className: "block text-sm font-medium text-gray-700 mb-2",
                children: "Models"
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "space-y-1",
                children: (provider.models || []).map((model, index)=>{
                    const modelKey = `${provider.id}-${model}-${index}`;
                    const isExpanded = isModelExpanded(provider.id, model);
                    return /*#__PURE__*/ _jsxs("div", {
                        className: "border-b border-gray-100 last:border-b-0",
                        children: [
                            /*#__PURE__*/ _jsxs("button", {
                                type: "button",
                                onClick: (e)=>{
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onToggleModel(provider.id, model);
                                },
                                className: "w-full flex items-center gap-2 text-sm text-gray-900 hover:text-gray-700 transition-colors py-2 text-left",
                                children: [
                                    /*#__PURE__*/ _jsx("span", {
                                        className: "flex-shrink-0 w-4 h-4 flex items-center justify-center text-gray-600 font-bold",
                                        children: isExpanded ? /*#__PURE__*/ _jsx(ChevronDown, {
                                            className: "w-4 h-4",
                                            strokeWidth: 2.5
                                        }) : /*#__PURE__*/ _jsx(ChevronRight, {
                                            className: "w-4 h-4",
                                            strokeWidth: 2.5
                                        })
                                    }),
                                    /*#__PURE__*/ _jsx("span", {
                                        className: "font-medium",
                                        children: model
                                    }),
                                    model === provider.defaultModel && /*#__PURE__*/ _jsx("span", {
                                        className: "text-xs px-2 py-0.5 bg-primary-100 text-primary-700 rounded",
                                        children: "Default"
                                    })
                                ]
                            }),
                            isExpanded && /*#__PURE__*/ _jsxs("div", {
                                className: "ml-6 mt-2 mb-2 space-y-3 pb-2",
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("label", {
                                                className: "block text-xs font-medium text-gray-700 mb-1",
                                                children: "Model Name"
                                            }),
                                            /*#__PURE__*/ _jsx("input", {
                                                type: "text",
                                                value: model,
                                                onChange: (e)=>{
                                                    const newModels = (provider.models || []).map((m)=>m === model ? e.target.value : m);
                                                    const newDefaultModel = provider.defaultModel === model ? e.target.value : provider.defaultModel;
                                                    onUpdateProvider(provider.id, {
                                                        models: newModels,
                                                        defaultModel: newDefaultModel
                                                    });
                                                },
                                                className: "w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ _jsx("button", {
                                                type: "button",
                                                onClick: (e)=>{
                                                    e.stopPropagation();
                                                    if (provider.defaultModel !== model) {
                                                        onUpdateProvider(provider.id, {
                                                            defaultModel: model
                                                        });
                                                    }
                                                },
                                                className: `text-xs px-3 py-1.5 rounded ${model === provider.defaultModel ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`,
                                                children: model === provider.defaultModel ? 'Default Model' : 'Set as Default'
                                            }),
                                            /*#__PURE__*/ _jsx("button", {
                                                type: "button",
                                                onClick: (e)=>{
                                                    e.stopPropagation();
                                                    if ((provider.models || []).length > 1) {
                                                        handleDeleteModel(model);
                                                    } else {
                                                        showError('Cannot delete the last model. Add another model first.');
                                                    }
                                                },
                                                className: "text-xs px-3 py-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200",
                                                children: "Remove"
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    }, modelKey);
                })
            })
        ]
    });
}

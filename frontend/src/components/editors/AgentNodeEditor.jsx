import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
/**
 * Agent Node Editor Component
 * Handles editing of LLM agent node properties
 * Follows Single Responsibility Principle
 */ import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Download } from 'lucide-react';
import { showSuccess } from '../../utils/notifications';
export default function AgentNodeEditor({ node, availableModels, onUpdate, onConfigUpdate }) {
    const systemPromptRef = useRef(null);
    const maxTokensRef = useRef(null);
    const [systemPromptValue, setSystemPromptValue] = useState('');
    const [maxTokensValue, setMaxTokensValue] = useState('');
    // Sync local state with node data
    useEffect(()=>{
        const agentConfig = node.data.agent_config || {};
        if (document.activeElement !== systemPromptRef.current) {
            setSystemPromptValue(agentConfig.system_prompt || '');
        }
        if (document.activeElement !== maxTokensRef.current) {
            setMaxTokensValue(agentConfig.max_tokens || '');
        }
    }, [
        node.data.agent_config
    ]);
    const agentConfig = useMemo(()=>node.data.agent_config || {}, [
        node.data.agent_config
    ]);
    const agentType = agentConfig.agent_type || 'workflow';
    const currentModel = agentConfig.model || (availableModels.length > 0 ? availableModels[0].value : 'gpt-4o-mini');
    const adkConfig = agentConfig.adk_config || {};
    const handleExportConfig = useCallback(()=>{
        const exportData = {
            label: node.data.label || node.data.name || 'Agent',
            description: node.data.description || '',
            agent_config: agentConfig,
            type: 'agent'
        };
        const filename = `${(exportData.label || 'agent').replace(/\s+/g, '-')}-config.json`;
        const blob = new Blob([
            JSON.stringify(exportData, null, 2)
        ], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
        showSuccess('Agent config exported');
    }, [
        node.data.label,
        node.data.name,
        node.data.description,
        agentConfig
    ]);
    return /*#__PURE__*/ _jsxs("div", {
        className: "border-t pt-4",
        children: [
            /*#__PURE__*/ _jsx("h4", {
                className: "text-sm font-semibold text-gray-900 mb-3",
                children: "LLM Agent Configuration"
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mb-4 p-3 bg-gray-50 border border-gray-200 rounded-lg",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "agent-type",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Agent Type"
                    }),
                    /*#__PURE__*/ _jsxs("select", {
                        id: "agent-type",
                        value: agentType,
                        onChange: (e)=>onUpdate('agent_config', {
                                ...agentConfig,
                                agent_type: e.target.value
                            }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "Select agent type",
                        children: [
                            /*#__PURE__*/ _jsx("option", {
                                value: "workflow",
                                children: "Workflow Agent (Default)"
                            }),
                            /*#__PURE__*/ _jsx("option", {
                                value: "adk",
                                children: "ADK Agent (Google ADK)"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children: agentType === 'adk' ? 'Uses Google ADK for agent execution. Requires Gemini models.' : 'Uses direct LLM API calls with workflow orchestration.'
                    })
                ]
            }),
            agentType === 'adk' && /*#__PURE__*/ _jsxs("div", {
                className: "mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg",
                children: [
                    /*#__PURE__*/ _jsx("h5", {
                        className: "text-sm font-semibold text-blue-900 mb-2",
                        children: "ADK Configuration"
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "mb-3",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "adk-name",
                                className: "block text-xs font-medium text-gray-700 mb-1",
                                children: "Agent Name *"
                            }),
                            /*#__PURE__*/ _jsx("input", {
                                id: "adk-name",
                                type: "text",
                                value: typeof adkConfig.name === 'string' ? adkConfig.name : '',
                                onChange: (e)=>onUpdate('agent_config', {
                                        ...agentConfig,
                                        adk_config: {
                                            ...adkConfig,
                                            name: e.target.value
                                        }
                                    }),
                                className: "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500",
                                placeholder: "e.g., assistant_agent",
                                required: true
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "mb-3",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "adk-description",
                                className: "block text-xs font-medium text-gray-700 mb-1",
                                children: "Description"
                            }),
                            /*#__PURE__*/ _jsx("input", {
                                id: "adk-description",
                                type: "text",
                                value: typeof adkConfig.description === 'string' ? adkConfig.description : '',
                                onChange: (e)=>onUpdate('agent_config', {
                                        ...agentConfig,
                                        adk_config: {
                                            ...adkConfig,
                                            description: e.target.value
                                        }
                                    }),
                                className: "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500",
                                placeholder: "Brief description of the agent"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "mb-3",
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "adk-tools",
                                className: "block text-xs font-medium text-gray-700 mb-1",
                                children: "ADK Tools (comma-separated)"
                            }),
                            /*#__PURE__*/ _jsx("input", {
                                id: "adk-tools",
                                type: "text",
                                value: Array.isArray(adkConfig.adk_tools) ? adkConfig.adk_tools.join(', ') : '',
                                onChange: (e)=>onUpdate('agent_config', {
                                        ...agentConfig,
                                        adk_config: {
                                            ...adkConfig,
                                            adk_tools: e.target.value.split(',').map((t)=>t.trim()).filter((t)=>t)
                                        }
                                    }),
                                className: "w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-primary-500",
                                placeholder: "google_search, load_web_page"
                            }),
                            /*#__PURE__*/ _jsx("p", {
                                className: "text-xs text-gray-500 mt-1",
                                children: "Available: google_search, load_web_page, enterprise_web_search"
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "agent-model",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Model"
                    }),
                    /*#__PURE__*/ _jsx("select", {
                        id: "agent-model",
                        value: currentModel,
                        onChange: (e)=>onUpdate('agent_config', {
                                ...agentConfig,
                                model: e.target.value
                            }),
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "Select LLM model for agent",
                        children: availableModels.length > 0 ? availableModels.map((model)=>/*#__PURE__*/ _jsx("option", {
                                value: model.value,
                                children: model.label
                            }, model.value)) : /*#__PURE__*/ _jsxs(_Fragment, {
                            children: [
                                /*#__PURE__*/ _jsx("option", {
                                    value: "gpt-4o-mini",
                                    children: "GPT-4o Mini (OpenAI)"
                                }),
                                /*#__PURE__*/ _jsx("option", {
                                    value: "gpt-4o",
                                    children: "GPT-4o (OpenAI)"
                                }),
                                /*#__PURE__*/ _jsx("option", {
                                    value: "gpt-4",
                                    children: "GPT-4 (OpenAI)"
                                }),
                                /*#__PURE__*/ _jsx("option", {
                                    value: "gpt-3.5-turbo",
                                    children: "GPT-3.5 Turbo (OpenAI)"
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-gray-500 mt-1",
                        children: availableModels.length > 0 ? `This agent will use the configured LLM provider with the selected model` : 'This agent will call the OpenAI API with this model. Configure providers in Settings.'
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-4",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "agent-system-prompt",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: agentType === 'adk' ? 'Instruction' : 'System Prompt'
                    }),
                    /*#__PURE__*/ _jsx("textarea", {
                        id: "agent-system-prompt",
                        ref: systemPromptRef,
                        value: systemPromptValue,
                        onChange: (e)=>{
                            const newValue = e.target.value;
                            setSystemPromptValue(newValue);
                            const updatedConfig = {
                                ...agentConfig,
                                system_prompt: newValue
                            };
                            // For ADK agents, also update instruction in adk_config
                            if (agentType === 'adk' && adkConfig) {
                                updatedConfig.adk_config = {
                                    ...adkConfig,
                                    instruction: newValue
                                };
                            }
                            onConfigUpdate('agent_config', 'system_prompt', newValue);
                            // Also update the full config to sync ADK config
                            if (agentType === 'adk') {
                                onUpdate('agent_config', updatedConfig);
                            }
                        },
                        rows: 4,
                        placeholder: "You are a helpful assistant that...",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "System prompt for agent behavior",
                        "aria-describedby": "system-prompt-help"
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        id: "system-prompt-help",
                        className: "text-xs text-gray-500 mt-1",
                        children: "Instructions that define the agent's role and behavior"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-4",
                children: [
                    /*#__PURE__*/ _jsxs("label", {
                        htmlFor: "agent-temperature",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: [
                            "Temperature: ",
                            agentConfig.temperature?.toFixed(1) || '0.7'
                        ]
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        id: "agent-temperature",
                        type: "range",
                        min: "0",
                        max: "1",
                        step: "0.1",
                        value: agentConfig.temperature || 0.7,
                        onChange: (e)=>onUpdate('agent_config', {
                                ...agentConfig,
                                temperature: parseFloat(e.target.value)
                            }),
                        className: "w-full",
                        "aria-label": "Temperature control for agent creativity",
                        "aria-valuemin": 0,
                        "aria-valuemax": 1,
                        "aria-valuenow": agentConfig.temperature || 0.7
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex justify-between text-xs text-gray-500 mt-1",
                        children: [
                            /*#__PURE__*/ _jsx("span", {
                                children: "Focused (0.0)"
                            }),
                            /*#__PURE__*/ _jsx("span", {
                                children: "Creative (1.0)"
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "mt-4",
                children: [
                    /*#__PURE__*/ _jsx("label", {
                        htmlFor: "agent-max-tokens",
                        className: "block text-sm font-medium text-gray-700 mb-1",
                        children: "Max Tokens (optional)"
                    }),
                    /*#__PURE__*/ _jsx("input", {
                        id: "agent-max-tokens",
                        ref: maxTokensRef,
                        type: "number",
                        value: maxTokensValue,
                        onChange: (e)=>{
                            const newValue = e.target.value ? parseInt(e.target.value) : undefined;
                            setMaxTokensValue(e.target.value);
                            onConfigUpdate('agent_config', 'max_tokens', newValue);
                        },
                        placeholder: "Leave blank for default",
                        className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                        "aria-label": "Maximum tokens for agent response",
                        "aria-describedby": "max-tokens-help"
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        id: "max-tokens-help",
                        className: "text-xs text-gray-500 mt-1",
                        children: "Maximum length of the agent's response"
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4",
                role: "status",
                children: [
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-blue-900 font-medium mb-1",
                        children: "🤖 This is a Real LLM Agent"
                    }),
                    /*#__PURE__*/ _jsx("p", {
                        className: "text-xs text-blue-700",
                        children: "When executed, this agent will call OpenAI's API with your configured model and prompt. The agent receives data from its inputs and produces output for the next nodes."
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "mt-4",
                children: /*#__PURE__*/ _jsxs("button", {
                    type: "button",
                    onClick: handleExportConfig,
                    className: "w-full flex items-center justify-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 bg-white hover:bg-gray-50 focus:ring-2 focus:ring-primary-500 transition-colors",
                    "aria-label": "Export agent config to JSON file",
                    children: [
                        /*#__PURE__*/ _jsx(Download, {
                            className: "w-4 h-4"
                        }),
                        "Export Agent Config"
                    ]
                })
            })
        ]
    });
}

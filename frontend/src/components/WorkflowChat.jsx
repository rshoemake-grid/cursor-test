import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { Send, Loader, Bot, User } from 'lucide-react';
import { logger } from '../utils/logger';
import { defaultAdapters } from '../types/adapters';
import { api } from '../api/client';
import { handleApiError } from '../utils/errorHandler';
import { safeStorageGet, safeStorageSet } from '../utils/storageHelpers';
import { getChatHistoryKey } from '../config/constants';
export default function WorkflowChat({ workflowId, onWorkflowUpdate, storage = defaultAdapters.createLocalStorageAdapter(), logger: injectedLogger = logger }) {
    // Load conversation history from storage on mount or workflow change
    const loadConversationHistory = (workflowId)=>{
        const storageKey = getChatHistoryKey(workflowId);
        const saved = safeStorageGet(storage, storageKey, [], 'WorkflowChat');
        // Explicit checks to prevent mutation survivors
        if (Array.isArray(saved) === true && saved.length > 0) {
            return saved;
        }
        // Return default greeting if no history found
        // Explicit check to prevent mutation survivors
        return [
            {
                role: 'assistant',
                content: workflowId !== null && workflowId !== undefined && workflowId !== '' ? "Hello! I can help you create or modify this workflow. What would you like to do?" : "Hello! I can help you create a new workflow. What would you like to build?"
            }
        ];
    };
    const [messages, setMessages] = useState(()=>loadConversationHistory(workflowId));
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    // Save conversation history to storage whenever messages change
    useEffect(()=>{
        // Explicit check to prevent mutation survivors
        if (messages.length > 0) {
            const storageKey = getChatHistoryKey(workflowId);
            safeStorageSet(storage, storageKey, messages, 'WorkflowChat');
        }
    }, [
        messages,
        workflowId,
        storage
    ]);
    useEffect(()=>{
        messagesEndRef.current?.scrollIntoView({
            behavior: 'smooth'
        });
    }, [
        messages
    ]);
    useEffect(()=>{
        // Load conversation history when workflow changes
        const history = loadConversationHistory(workflowId);
        setMessages(history);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        workflowId
    ]); // Note: loadConversationHistory depends on storage, but we don't want to reload on storage changes
    const handleSend = async ()=>{
        // Explicit checks to prevent mutation survivors
        if (input.trim() === '' || isLoading === true) return;
        const userMessage = {
            role: 'user',
            content: input.trim()
        };
        setMessages((prev)=>[
                ...prev,
                userMessage
            ]);
        setInput('');
        setIsLoading(true);
        try {
            const data = await api.chat({
                workflow_id: workflowId,
                message: userMessage.content,
                conversation_history: messages.map((m)=>({
                        role: m.role,
                        content: m.content
                    }))
            });
            const assistantMessage = {
                role: 'assistant',
                content: data.message
            };
            setMessages((prev)=>[
                    ...prev,
                    assistantMessage
                ]);
            // Apply workflow changes if any
            // Explicit checks to prevent mutation survivors
            if (data.workflow_changes !== null && data.workflow_changes !== undefined && onWorkflowUpdate !== null && onWorkflowUpdate !== undefined) {
                injectedLogger.debug('Received workflow changes:', data.workflow_changes);
                injectedLogger.debug('Nodes to delete:', data.workflow_changes.nodes_to_delete);
                onWorkflowUpdate(data.workflow_changes);
            }
        } catch (error) {
            const errorMessage = handleApiError(error, {
                context: 'WorkflowChat',
                showNotification: false
            });
            const chatErrorMessage = {
                role: 'assistant',
                content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`
            };
            setMessages((prev)=>[
                    ...prev,
                    chatErrorMessage
                ]);
        } finally{
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };
    const handleKeyPress = (e)=>{
        // Explicit checks to prevent mutation survivors
        if (e.key === 'Enter' && e.shiftKey === false) {
            e.preventDefault();
            handleSend();
        }
    };
    return /*#__PURE__*/ _jsxs("div", {
        className: "flex flex-col h-full bg-gray-900 text-gray-100",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "flex-1 overflow-y-auto p-4 space-y-4",
                children: [
                    messages.map((message, idx)=>/*#__PURE__*/ _jsxs("div", {
                            className: `flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`,
                            children: [
                                message.role === 'assistant' && /*#__PURE__*/ _jsx("div", {
                                    className: "w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0",
                                    children: /*#__PURE__*/ _jsx(Bot, {
                                        className: "w-5 h-5"
                                    })
                                }),
                                /*#__PURE__*/ _jsx("div", {
                                    className: `max-w-[80%] rounded-lg px-4 py-2 ${message.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-800 text-gray-100'}`,
                                    children: /*#__PURE__*/ _jsx("p", {
                                        className: "text-sm whitespace-pre-wrap",
                                        children: message.content
                                    })
                                }),
                                message.role === 'user' && /*#__PURE__*/ _jsx("div", {
                                    className: "w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0",
                                    children: /*#__PURE__*/ _jsx(User, {
                                        className: "w-5 h-5"
                                    })
                                })
                            ]
                        }, idx)),
                    isLoading === true && /*#__PURE__*/ _jsxs("div", {
                        className: "flex gap-3 justify-start",
                        children: [
                            /*#__PURE__*/ _jsx("div", {
                                className: "w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0",
                                children: /*#__PURE__*/ _jsx(Bot, {
                                    className: "w-5 h-5"
                                })
                            }),
                            /*#__PURE__*/ _jsx("div", {
                                className: "bg-gray-800 rounded-lg px-4 py-2",
                                children: /*#__PURE__*/ _jsx(Loader, {
                                    className: "w-5 h-5 animate-spin"
                                })
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        ref: messagesEndRef
                    })
                ]
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "border-t border-gray-800 p-4",
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "flex gap-2",
                    children: [
                        /*#__PURE__*/ _jsx("textarea", {
                            ref: inputRef,
                            value: input,
                            onChange: (e)=>setInput(e.target.value),
                            onKeyPress: handleKeyPress,
                            placeholder: "Type your message... (Press Enter to send, Shift+Enter for new line)",
                            className: "flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500",
                            rows: 2,
                            disabled: isLoading
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            onClick: handleSend,
                            disabled: input.trim() === '' || isLoading === true,
                            className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors",
                            children: isLoading === true ? /*#__PURE__*/ _jsx(Loader, {
                                className: "w-5 h-5 animate-spin"
                            }) : /*#__PURE__*/ _jsxs(_Fragment, {
                                children: [
                                    /*#__PURE__*/ _jsx(Send, {
                                        className: "w-5 h-5"
                                    }),
                                    "Send"
                                ]
                            })
                        })
                    ]
                })
            })
        ]
    });
}

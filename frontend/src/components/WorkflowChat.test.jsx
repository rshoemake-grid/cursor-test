import { jsx as _jsx } from "react/jsx-runtime";
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WorkflowChat from './WorkflowChat';
import { AuthProvider } from '../contexts/AuthContext';
// Helper to ensure all waitFor calls have timeouts
const waitForWithTimeout = (callback, timeout = 2000)=>{
    return waitFor(callback, {
        timeout
    });
};
// Mock logger
jest.mock('../utils/logger', ()=>({
        logger: {
            debug: jest.fn(),
            error: jest.fn(),
            warn: jest.fn(),
            info: jest.fn()
        }
    }));
// Mock API client (WorkflowChat uses api.chat)
const mockChat = jest.fn();
jest.mock('../api/client', ()=>({
        api: {
            chat: (...args)=>mockChat(...args)
        }
    }));
jest.mock('../utils/errorHandler', ()=>({
        handleApiError: jest.fn((error)=>{
            return error?.message || 'Unknown error';
        })
    }));
jest.mock('../utils/storageHelpers', ()=>({
        safeStorageGet: jest.fn((storage, key, defaultValue)=>{
            if (!storage) return defaultValue;
            try {
                const item = storage.getItem(key);
                if (!item) return defaultValue;
                return JSON.parse(item);
            } catch  {
                return defaultValue;
            }
        }),
        safeStorageSet: jest.fn((storage, key, value)=>{
            if (!storage) return false;
            try {
                storage.setItem(key, JSON.stringify(value));
                return true;
            } catch  {
                return false;
            }
        })
    }));
jest.mock('../config/constants', ()=>({
        API_CONFIG: {
            BASE_URL: 'http://localhost:8000/api',
            ENDPOINTS: {
                CHAT: '/workflow-chat/chat'
            }
        },
        STORAGE_KEYS: {
            AUTH_TOKEN: 'auth_token',
            AUTH_USER: 'auth_user',
            AUTH_REMEMBER_ME: 'auth_remember_me'
        },
        getChatHistoryKey: jest.fn((workflowId)=>{
            return workflowId ? `chat_history_${workflowId}` : 'chat_history_new_workflow';
        })
    }));
// Mock fetch
global.fetch = jest.fn();
// Mock useAuth
jest.mock('../contexts/AuthContext', ()=>({
        ...jest.requireActual('../contexts/AuthContext'),
        useAuth: ()=>({
                token: 'test-token',
                user: {
                    id: '1',
                    username: 'testuser'
                },
                isAuthenticated: true
            })
    }));
const renderWithProvider = (component)=>{
    return render(/*#__PURE__*/ _jsx(AuthProvider, {
        children: component
    }));
};
describe('WorkflowChat', ()=>{
    const mockOnWorkflowUpdate = jest.fn();
    beforeEach(()=>{
        jest.clearAllMocks();
        localStorage.clear();
        const { safeStorageGet } = require('../utils/storageHelpers');
        const { safeStorageSet } = require('../utils/storageHelpers');
        const { handleApiError } = require('../utils/errorHandler');
        mockChat.mockClear();
        // Default: api.chat returns success
        mockChat.mockResolvedValue({
            message: 'Response message'
        });
        // Default storage helpers to use real localStorage
        safeStorageGet.mockImplementation((storage, key, defaultValue)=>{
            if (!storage) return defaultValue;
            try {
                const item = storage.getItem(key);
                if (!item) return defaultValue;
                return JSON.parse(item);
            } catch  {
                return defaultValue;
            }
        });
        safeStorageSet.mockImplementation((storage, key, value)=>{
            if (!storage) return false;
            try {
                storage.setItem(key, JSON.stringify(value));
                return true;
            } catch  {
                return false;
            }
        });
        handleApiError.mockImplementation((error)=>{
            return error?.message || 'Unknown error';
        });
        // Mock scrollIntoView
        Element.prototype.scrollIntoView = jest.fn();
    });
    it('should render chat interface', ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        expect(screen.getByPlaceholderText(/Type your message/)).toBeInTheDocument();
        expect(screen.getByText('Send')).toBeInTheDocument();
    });
    it('should display default greeting for existing workflow', ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        expect(screen.getByText(/Hello! I can help you create or modify this workflow/)).toBeInTheDocument();
    });
    it('should display default greeting for new workflow', ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: null
        }));
        expect(screen.getByText(/Hello! I can help you create a new workflow/)).toBeInTheDocument();
    });
    it('should load conversation history from localStorage', ()=>{
        const history = [
            {
                role: 'user',
                content: 'Hello'
            },
            {
                role: 'assistant',
                content: 'Hi there!'
            }
        ];
        localStorage.setItem('chat_history_workflow-1', JSON.stringify(history));
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        expect(screen.getByText('Hello')).toBeInTheDocument();
        expect(screen.getByText('Hi there!')).toBeInTheDocument();
    });
    it('should handle invalid localStorage history gracefully', ()=>{
        const { safeStorageGet } = require('../utils/storageHelpers');
        safeStorageGet.mockReturnValueOnce([]); // Return empty array on parse error
        localStorage.setItem('chat_history_workflow-1', 'invalid json');
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        // Should show default greeting
        expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument();
    });
    it('should send message when send button is clicked', async ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        await waitForWithTimeout(()=>{
            expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({
                workflow_id: 'workflow-1',
                message: 'Test message'
            }));
        }, 3000); // API call completion
    });
    it('should send message when Enter is pressed', async ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        fireEvent.keyPress(input, {
            key: 'Enter',
            code: 'Enter',
            charCode: 13
        });
        await waitForWithTimeout(()=>{
            expect(mockChat).toHaveBeenCalled();
        }, 3000); // API call completion
    });
    it('should not send message when Shift+Enter is pressed', ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        fireEvent.keyPress(input, {
            key: 'Enter',
            code: 'Enter',
            charCode: 13,
            shiftKey: true
        });
        expect(mockChat).not.toHaveBeenCalled();
    });
    it('should not send empty message', ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const sendButton = screen.getByText('Send');
        expect(sendButton).toBeDisabled();
    });
    it('should display user and assistant messages', async ()=>{
        mockChat.mockResolvedValue({
            message: 'Assistant response'
        });
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'User message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        await waitForWithTimeout(()=>{
            expect(screen.getByText('User message')).toBeInTheDocument();
        }, 2000); // Component rendering
        await waitForWithTimeout(()=>{
            expect(screen.getByText('Assistant response')).toBeInTheDocument();
        }, 3000); // API response rendering
    });
    it('should handle API error', async ()=>{
        const { handleApiError } = require('../utils/errorHandler');
        handleApiError.mockReturnValue('HTTP error! status: 500');
        mockChat.mockRejectedValue(new Error('HTTP 500'));
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        await waitForWithTimeout(()=>{
            expect(screen.getByText(/HTTP error/)).toBeInTheDocument();
        }, 2000); // Error message display
    });
    it('should apply workflow changes when received', async ()=>{
        mockChat.mockResolvedValue({
            message: 'Response',
            workflow_changes: {
                nodes_to_add: [],
                nodes_to_delete: [
                    'node-1'
                ]
            }
        });
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1",
            onWorkflowUpdate: mockOnWorkflowUpdate
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        await waitForWithTimeout(()=>{
            expect(mockOnWorkflowUpdate).toHaveBeenCalledWith({
                nodes_to_add: [],
                nodes_to_delete: [
                    'node-1'
                ]
            });
        }, 3000); // Workflow update callback
    });
    it('should save conversation history to localStorage', async ()=>{
        mockChat.mockResolvedValue({
            message: 'Response'
        });
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        await waitForWithTimeout(()=>{
            const saved = localStorage.getItem('chat_history_workflow-1');
            expect(saved).toBeDefined();
            const parsed = JSON.parse(saved);
            expect(parsed.length).toBeGreaterThan(1);
        }, 2000); // Storage operation
    });
    it('should load conversation history when workflowId changes', async ()=>{
        mockChat.mockResolvedValue({
            message: 'Response'
        });
        const history1 = [
            {
                role: 'user',
                content: 'Message 1'
            }
        ];
        localStorage.setItem('chat_history_workflow-1', JSON.stringify(history1));
        const { unmount } = renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        await waitForWithTimeout(()=>{
            expect(screen.getByText('Message 1')).toBeInTheDocument();
        }, 2000); // Message rendering
        unmount();
        const history2 = [
            {
                role: 'user',
                content: 'Message 2'
            }
        ];
        localStorage.setItem('chat_history_workflow-2', JSON.stringify(history2));
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-2"
        }));
        await waitForWithTimeout(()=>{
            expect(screen.getByText('Message 2')).toBeInTheDocument();
        }, 2000); // Message rendering
    });
    it('should show loading state while sending', async ()=>{
        let resolvePromise;
        const promise = new Promise((resolve)=>{
            resolvePromise = resolve;
        });
        mockChat.mockReturnValue(promise);
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        // Should show loading state
        await waitForWithTimeout(()=>{
            expect(screen.queryByText('Send')).not.toBeInTheDocument();
        }, 2000); // UI state update
        resolvePromise({
            message: 'Response'
        });
        await waitForWithTimeout(()=>{
            expect(screen.getByText('Send')).toBeInTheDocument();
        }, 2000); // UI state update
    });
    it('should handle non-Error exception', async ()=>{
        const { handleApiError } = require('../utils/errorHandler');
        handleApiError.mockReturnValue('Unknown error');
        mockChat.mockRejectedValue('String error');
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        await waitForWithTimeout(()=>{
            expect(screen.getByText(/Unknown error/)).toBeInTheDocument();
        }, 2000); // Error message display
    });
    it('should handle empty history array', ()=>{
        localStorage.setItem('chat_history_workflow-1', JSON.stringify([]));
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        // Should show default greeting
        expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument();
    });
    it('should not call onWorkflowUpdate when workflow_changes is missing', async ()=>{
        mockChat.mockResolvedValue({
            message: 'Response'
        });
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1",
            onWorkflowUpdate: mockOnWorkflowUpdate
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        await waitForWithTimeout(()=>{
            expect(screen.getByText('Response')).toBeInTheDocument();
        }, 3000); // API response rendering
        expect(mockOnWorkflowUpdate).not.toHaveBeenCalled();
    });
    it('should handle network errors', async ()=>{
        const { handleApiError } = require('../utils/errorHandler');
        handleApiError.mockReturnValue('Network error');
        mockChat.mockRejectedValue(new Error('Network error'));
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        await waitForWithTimeout(()=>{
            expect(screen.getByText(/Network error/)).toBeInTheDocument();
        }, 2000); // Error message display
    });
    it('should not send when input is only whitespace', ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: '   '
            }
        });
        const sendButton = screen.getByText('Send');
        expect(sendButton).toBeDisabled();
    });
    it('should not send when isLoading is true', async ()=>{
        let resolvePromise;
        const promise = new Promise((resolve)=>{
            resolvePromise = resolve;
        });
        mockChat.mockReturnValue(promise);
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Test message'
            }
        });
        const sendButton = screen.getByText('Send');
        fireEvent.click(sendButton);
        // Try to send again while loading
        await waitForWithTimeout(()=>{
            expect(sendButton).toBeDisabled();
        }, 2000); // Loading state update
        // Input should be disabled or send button should not exist
        fireEvent.change(input, {
            target: {
                value: 'Another message'
            }
        });
        // Should not trigger another send
        resolvePromise({
            message: 'Response'
        });
    });
    describe('Dependency Injection', ()=>{
        it('should use injected storage adapter', ()=>{
            const mockStorage = {
                getItem: jest.fn().mockReturnValue(JSON.stringify([
                    {
                        role: 'user',
                        content: 'Test message'
                    }
                ])),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };
            renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
                workflowId: "workflow-1",
                storage: mockStorage
            }));
            expect(mockStorage.getItem).toHaveBeenCalledWith('chat_history_workflow-1');
        });
        it('should use API client for chat', async ()=>{
            mockChat.mockResolvedValue({
                message: 'Response from API client'
            });
            renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
                workflowId: "workflow-1"
            }));
            const input = screen.getByPlaceholderText(/Type your message/);
            fireEvent.change(input, {
                target: {
                    value: 'Test message'
                }
            });
            const sendButton = screen.getByText('Send');
            fireEvent.click(sendButton);
            await waitForWithTimeout(()=>{
                expect(mockChat).toHaveBeenCalled();
            }, 3000);
            await waitForWithTimeout(()=>{
                expect(screen.getByText('Response from API client')).toBeInTheDocument();
            }, 3000);
        });
        it('should use injected logger', async ()=>{
            const mockLogger = {
                debug: jest.fn(),
                error: jest.fn(),
                warn: jest.fn(),
                info: jest.fn()
            };
            mockChat.mockResolvedValue({
                message: 'Response',
                workflow_changes: {
                    nodes_to_delete: [
                        'node-1'
                    ]
                }
            });
            renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
                workflowId: "workflow-1",
                logger: mockLogger,
                onWorkflowUpdate: mockOnWorkflowUpdate
            }));
            const input = screen.getByPlaceholderText(/Type your message/);
            fireEvent.change(input, {
                target: {
                    value: 'Test message'
                }
            });
            const sendButton = screen.getByText('Send');
            fireEvent.click(sendButton);
            await waitForWithTimeout(()=>{
                expect(screen.getByText('Response')).toBeInTheDocument();
            });
            await waitForWithTimeout(()=>{
                expect(mockLogger.debug).toHaveBeenCalledWith('Received workflow changes:', expect.objectContaining({
                    nodes_to_delete: [
                        'node-1'
                    ]
                }));
            }, 2000);
        });
        it('should handle storage errors gracefully', ()=>{
            const { safeStorageGet } = require('../utils/storageHelpers');
            safeStorageGet.mockReturnValueOnce([]); // Return empty array on error
            const mockStorage = {
                getItem: jest.fn().mockImplementation(()=>{
                    throw new Error('Storage quota exceeded');
                }),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };
            renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
                workflowId: "workflow-1",
                storage: mockStorage
            }));
            // Should show default greeting when storage fails
            expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument();
        });
        it('should handle storage setItem errors', async ()=>{
            const { safeStorageSet } = require('../utils/storageHelpers');
            safeStorageSet.mockReturnValue(false); // Simulate storage error
            mockChat.mockResolvedValue({
                message: 'Response'
            });
            renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
                workflowId: "workflow-1"
            }));
            const input = screen.getByPlaceholderText(/Type your message/);
            fireEvent.change(input, {
                target: {
                    value: 'Test message'
                }
            });
            const sendButton = screen.getByText('Send');
            fireEvent.click(sendButton);
            await waitForWithTimeout(()=>{
                expect(screen.getByText('Response')).toBeInTheDocument();
            });
        // Should handle storage error gracefully (no crash)
        });
        it('should handle HTTP client errors', async ()=>{
            const { handleApiError } = require('../utils/errorHandler');
            handleApiError.mockReturnValue('Network error');
            mockChat.mockRejectedValue(new Error('Network error'));
            renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
                workflowId: "workflow-1"
            }));
            const input = screen.getByPlaceholderText(/Type your message/);
            fireEvent.change(input, {
                target: {
                    value: 'Test message'
                }
            });
            const sendButton = screen.getByText('Send');
            fireEvent.click(sendButton);
            await waitForWithTimeout(()=>{
                expect(screen.getByText(/Network error/)).toBeInTheDocument();
            }, 2000); // Error message display
            expect(handleApiError).toHaveBeenCalled();
        });
        it('should handle null storage adapter', ()=>{
            renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
                workflowId: "workflow-1",
                storage: null
            }));
            // Should show default greeting when storage is null
            expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument();
        });
        it('should save to injected storage adapter', async ()=>{
            const mockStorage = {
                getItem: jest.fn().mockReturnValue(null),
                setItem: jest.fn(),
                removeItem: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn()
            };
            mockChat.mockResolvedValue({
                message: 'Response'
            });
            renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
                workflowId: "workflow-1",
                storage: mockStorage
            }));
            const input = screen.getByPlaceholderText(/Type your message/);
            fireEvent.change(input, {
                target: {
                    value: 'Test message'
                }
            });
            const sendButton = screen.getByText('Send');
            fireEvent.click(sendButton);
            await waitForWithTimeout(()=>{
                expect(mockStorage.setItem).toHaveBeenCalledWith('chat_history_workflow-1', expect.stringContaining('Test message'));
            }, 2000); // Storage operation
        });
    });
});

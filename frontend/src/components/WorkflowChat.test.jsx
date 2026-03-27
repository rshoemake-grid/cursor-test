import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
            AUTH_REMEMBER_ME: 'auth_remember_me',
            WORKFLOW_CHAT_ITERATION_LIMIT: 'workflow_chat_iteration_limit'
        },
        getChatHistoryKey: jest.fn((workflowId, tabId)=>{
            if (tabId != null && String(tabId).trim() !== '') {
                return `chat_history_tab_${tabId}`;
            }
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

    function mockSpeechApis() {
        class MockRecognition {
            constructor() {
                this.continuous = true;
                this.interimResults = true;
                this.lang = '';
                this.onresult = null;
                this.onend = null;
                this.onerror = null;
            }

            start() {
                const self = this;
                queueMicrotask(() => {
                    if (self.onresult) {
                        const piece = {
                            0: { transcript: 'voice test' },
                            length: 1,
                            isFinal: true
                        };
                        self.onresult({
                            resultIndex: 0,
                            results: { length: 1, 0: piece }
                        });
                    }
                });
            }

            stop() {
                queueMicrotask(() => {
                    if (this.onend) this.onend();
                });
            }
        }
        global.SpeechRecognition = MockRecognition;
        global.webkitSpeechRecognition = MockRecognition;
        global.SpeechSynthesisUtterance = class MockUtterance {
            constructor(text) {
                this.text = text;
                this.lang = '';
            }
        };
        global.speechSynthesis = {
            speak: jest.fn(),
            cancel: jest.fn()
        };
    }

    beforeEach(()=>{
        jest.clearAllMocks();
        localStorage.clear();
        mockSpeechApis();
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
    it('should call onClearCanvas when Clear canvas is confirmed', ()=>{
        const onClearCanvas = jest.fn();
        window.confirm = jest.fn(()=>true);
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1",
            onClearCanvas
        }));
        fireEvent.click(screen.getByRole('button', {
            name: /Clear canvas/i
        }));
        expect(window.confirm).toHaveBeenCalled();
        expect(onClearCanvas).toHaveBeenCalled();
    });
    it('should not call onClearCanvas when Clear canvas is cancelled', ()=>{
        const onClearCanvas = jest.fn();
        window.confirm = jest.fn(()=>false);
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1",
            onClearCanvas
        }));
        fireEvent.click(screen.getByRole('button', {
            name: /Clear canvas/i
        }));
        expect(onClearCanvas).not.toHaveBeenCalled();
    });
    it('should reset messages when Clear chat is confirmed', async ()=>{
        window.confirm = jest.fn(()=>true);
        const { safeStorageSet } = require('../utils/storageHelpers');
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1",
            chatStorageKey: 'chat_history_tab_my-tab'
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        await userEvent.type(input, 'Hi there');
        fireEvent.click(screen.getByText('Send'));
        await waitForWithTimeout(()=>{
            expect(screen.getByText('Hi there')).toBeInTheDocument();
        });
        fireEvent.click(screen.getByLabelText(/Clear chat/i));
        await waitForWithTimeout(()=>{
            expect(screen.queryByText('Hi there')).not.toBeInTheDocument();
            expect(screen.getByText(/Hello! I can help you create or modify this workflow/)).toBeInTheDocument();
        });
        expect(safeStorageSet).toHaveBeenCalled();
    });
    it('should load different history for different chatStorageKey values', ()=>{
        localStorage.setItem('chat_history_tab_alpha', JSON.stringify([
            {
                role: 'user',
                content: 'Alpha msg'
            }
        ]));
        localStorage.setItem('chat_history_tab_beta', JSON.stringify([
            {
                role: 'user',
                content: 'Beta msg'
            }
        ]));
        const { unmount } = renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: null,
            chatStorageKey: 'chat_history_tab_alpha'
        }));
        expect(screen.getByText('Alpha msg')).toBeInTheDocument();
        unmount();
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: null,
            chatStorageKey: 'chat_history_tab_beta'
        }));
        expect(screen.getByText('Beta msg')).toBeInTheDocument();
        expect(screen.queryByText('Alpha msg')).not.toBeInTheDocument();
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
                message: 'Test message',
                iteration_limit: 10
            }));
        }, 3000); // API call completion
    });
    it('should send iteration_limit from Steps field', async ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        fireEvent.change(screen.getByTitle(/Maximum tool-calling rounds/i), {
            target: {
                value: '7'
            }
        });
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, {
            target: {
                value: 'Hi'
            }
        });
        fireEvent.click(screen.getByText('Send'));
        await waitForWithTimeout(()=>{
            expect(mockChat).toHaveBeenCalledWith(expect.objectContaining({
                iteration_limit: 7
            }));
        }, 3000);
    });
    it('should send message when Enter is pressed', async ()=>{
        const user = userEvent.setup();
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const input = screen.getByPlaceholderText(/Type your message/);
        await user.click(input);
        await user.keyboard('Test message');
        await user.keyboard('{Enter}');
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
        fireEvent.keyDown(input, {
            key: 'Enter',
            code: 'Enter',
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
    it('should expose single listen control next to composer for assistant messages', async ()=>{
        mockChat.mockResolvedValue({
            message: 'Read me aloud'
        });
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        expect(screen.getByLabelText('Auto-read new assistant replies aloud')).toBeInTheDocument();
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, { target: { value: 'Hi' } });
        fireEvent.click(screen.getByText('Send'));
        await waitForWithTimeout(()=>{
            expect(screen.getByText('Read me aloud')).toBeInTheDocument();
        }, 3000);
        const speakButtons = screen.queryAllByLabelText('Auto-read new assistant replies aloud');
        expect(speakButtons).toHaveLength(1);
    });
    it('should not speak existing messages when arming listen mode; only new assistant replies', async ()=>{
        const history = [
            {
                role: 'assistant',
                content: 'First reply'
            },
            {
                role: 'user',
                content: 'Hey'
            },
            {
                role: 'assistant',
                content: 'Already on screen'
            }
        ];
        localStorage.setItem('chat_history_workflow-1', JSON.stringify(history));
        mockChat.mockResolvedValue({
            message: 'Brand new reply'
        });
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        const speak = global.speechSynthesis.speak;
        speak.mockClear();
        fireEvent.click(screen.getByLabelText('Auto-read new assistant replies aloud'));
        expect(speak).not.toHaveBeenCalled();
        const input = screen.getByPlaceholderText(/Type your message/);
        fireEvent.change(input, { target: { value: 'Next question' } });
        fireEvent.click(screen.getByText('Send'));
        await waitForWithTimeout(()=>{
            expect(speak).toHaveBeenCalledTimes(1);
            expect(speak.mock.calls[0][0].text).toBe('Brand new reply');
        }, 3000);
    });
    it('should keep listen mode on until the user turns it off', ()=>{
        renderWithProvider(/*#__PURE__*/ _jsx(WorkflowChat, {
            workflowId: "workflow-1"
        }));
        fireEvent.click(screen.getByLabelText('Auto-read new assistant replies aloud'));
        expect(screen.getByLabelText('Turn off read-aloud')).toBeInTheDocument();
        fireEvent.click(screen.getByLabelText('Turn off read-aloud'));
        expect(screen.getByLabelText('Auto-read new assistant replies aloud')).toBeInTheDocument();
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

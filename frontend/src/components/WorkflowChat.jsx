import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { Send, Loader, Bot, User, Mic, Volume2, Square, Trash2, MessageSquareX } from 'lucide-react';
import { logger } from '../utils/logger';
import { defaultAdapters } from '../types/adapters';
import { api } from '../api/client';
import { handleApiError } from '../utils/errorHandler';
import { safeStorageGet, safeStorageSet } from '../utils/storageHelpers';
import { getChatHistoryKey, STORAGE_KEYS } from '../config/constants';

function clampToolIterations(raw) {
    const x = parseInt(String(raw).trim(), 10);
    if (Number.isNaN(x)) return 10;
    return Math.min(50, Math.max(1, x));
}

function getSpeechRecognitionCtor() {
    if (typeof window === 'undefined') return null;
    return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function defaultGreetingMessages(workflowId) {
    const hasSaved = workflowId !== null && workflowId !== undefined && workflowId !== '';
    return [
        {
            role: 'assistant',
            content: hasSaved
                ? 'Hello! I can help you create or modify this workflow. What would you like to do?'
                : 'Hello! I can help you create a new workflow. What would you like to build?'
        }
    ];
}

export default function WorkflowChat({
    workflowId,
    chatStorageKey,
    onWorkflowUpdate,
    onClearCanvas,
    storage = defaultAdapters.createLocalStorageAdapter(),
    logger: injectedLogger = logger
}) {
    const resolveHistoryStorageKey = useCallback(() => {
        return chatStorageKey ?? getChatHistoryKey(workflowId);
    }, [chatStorageKey, workflowId]);

    const [messages, setMessages] = useState(() => {
        const key = chatStorageKey ?? getChatHistoryKey(workflowId);
        const saved = safeStorageGet(storage, key, [], 'WorkflowChat');
        if (Array.isArray(saved) === true && saved.length > 0) {
            return saved;
        }
        return defaultGreetingMessages(workflowId);
    });
    const [toolIterationsInput, setToolIterationsInput] = useState(() => {
        const stored = safeStorageGet(storage, STORAGE_KEYS.WORKFLOW_CHAT_ITERATION_LIMIT, null, 'WorkflowChat');
        if (typeof stored === 'number' && !Number.isNaN(stored)) {
            return String(clampToolIterations(stored));
        }
        return '10';
    });
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [speechSupported] = useState(() => !!getSpeechRecognitionCtor());
    const [ttsSupported] = useState(
        () => typeof window !== 'undefined' && typeof window.speechSynthesis !== 'undefined'
    );
    /** Stays on after playback ends until the user clicks Stop (avoids looking "turned off" when idle). */
    const [ttsListenModeOn, setTtsListenModeOn] = useState(false);

    const assistantSpeechTexts = useMemo(
        () =>
            messages
                .filter((m) => m.role === 'assistant' && m.content?.trim())
                .map((m) => m.content.trim()),
        [messages]
    );
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);
    const sendInFlightRef = useRef(false);
    const recognitionRef = useRef(null);
    const speechTextRef = useRef('');
    const sendAfterSpeechRef = useRef(false);
    const assistantSpeechCountRef = useRef(0);
    useEffect(() => {
        if (messages.length > 0) {
            const key = resolveHistoryStorageKey();
            safeStorageSet(storage, key, messages, 'WorkflowChat');
        }
    }, [messages, resolveHistoryStorageKey, storage]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        const key = chatStorageKey ?? getChatHistoryKey(workflowId);
        const saved = safeStorageGet(storage, key, [], 'WorkflowChat');
        const history =
            Array.isArray(saved) === true && saved.length > 0 ? saved : defaultGreetingMessages(workflowId);
        setMessages(history);
        assistantSpeechCountRef.current = 0;
        setTtsListenModeOn(false);
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        // storage omitted: default adapter is a new object each render; session key drives reload
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [workflowId, chatStorageKey]);

    const submitMessage = useCallback(
        async (messageText) => {
            const trimmed = messageText.trim();
            if (trimmed === '' || sendInFlightRef.current) return;

            sendInFlightRef.current = true;
            const userMessage = { role: 'user', content: trimmed };
            setMessages((prev) => [...prev, userMessage]);
            setInput('');
            setIsLoading(true);

            const historyForApi = messages.map((m) => ({ role: m.role, content: m.content }));

            try {
                const data = await api.chat({
                    workflow_id: workflowId,
                    message: trimmed,
                    conversation_history: historyForApi,
                    iteration_limit: clampToolIterations(toolIterationsInput)
                });

                const assistantMessage = { role: 'assistant', content: data.message };
                setMessages((prev) => [...prev, assistantMessage]);

                if (data.workflow_changes != null && onWorkflowUpdate != null) {
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
                setMessages((prev) => [...prev, chatErrorMessage]);
            } finally {
                sendInFlightRef.current = false;
                setIsLoading(false);
                inputRef.current?.focus();
            }
        },
        [workflowId, onWorkflowUpdate, injectedLogger, messages, toolIterationsInput]
    );

    const persistToolIterations = useCallback(() => {
        const clamped = clampToolIterations(toolIterationsInput);
        setToolIterationsInput(String(clamped));
        safeStorageSet(storage, STORAGE_KEYS.WORKFLOW_CHAT_ITERATION_LIMIT, clamped, 'WorkflowChat');
    }, [toolIterationsInput, storage]);

    const handleSend = () => {
        void submitMessage(input);
    };

    const stopRecognition = useCallback(() => {
        const rec = recognitionRef.current;
        if (rec) {
            try {
                rec.stop();
            } catch {
                /* ignore */
            }
            recognitionRef.current = null;
        }
    }, []);

    const handleMicPointerDown = (e) => {
        if (!speechSupported || isLoading) return;

        const Ctor = getSpeechRecognitionCtor();
        if (!Ctor) return;

        e.preventDefault();
        try {
            e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }

        sendAfterSpeechRef.current = true;
        speechTextRef.current = '';

        const rec = new Ctor();
        rec.continuous = true;
        rec.interimResults = true;
        rec.lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

        let finalTranscript = '';

        rec.onresult = (event) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const piece = event.results[i];
                if (piece.isFinal) {
                    finalTranscript += piece[0].transcript;
                } else {
                    interim += piece[0].transcript;
                }
            }
            const combined = (finalTranscript + interim).trim();
            speechTextRef.current = combined;
            setInput(combined);
        };

        rec.onerror = (err) => {
            injectedLogger.warn('WorkflowChat speech recognition error:', err.error);
            setIsListening(false);
            recognitionRef.current = null;
            sendAfterSpeechRef.current = false;
        };

        rec.onend = () => {
            setIsListening(false);
            recognitionRef.current = null;
            if (sendAfterSpeechRef.current) {
                sendAfterSpeechRef.current = false;
                const text = speechTextRef.current.trim();
                if (text) {
                    void submitMessage(text);
                }
            }
        };

        recognitionRef.current = rec;
        setIsListening(true);
        try {
            rec.start();
        } catch (err) {
            injectedLogger.warn('WorkflowChat could not start speech recognition:', err);
            setIsListening(false);
            recognitionRef.current = null;
            sendAfterSpeechRef.current = false;
        }
    };

    const handleMicPointerUp = (e) => {
        try {
            e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
            /* ignore */
        }
        stopRecognition();
    };

    const handleMicPointerCancel = () => {
        sendAfterSpeechRef.current = false;
        speechTextRef.current = '';
        stopRecognition();
        setIsListening(false);
    };

    useEffect(() => {
        return () => {
            sendAfterSpeechRef.current = false;
            stopRecognition();
            assistantSpeechCountRef.current = 0;
            if (typeof window !== 'undefined' && window.speechSynthesis) {
                window.speechSynthesis.cancel();
            }
        };
    }, [stopRecognition]);

    const cancelSpeechSynthesisOnly = () => {
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
    };

    const exitTtsListenMode = () => {
        cancelSpeechSynthesisOnly();
        setTtsListenModeOn(false);
        assistantSpeechCountRef.current = 0;
    };

    const queueAssistantSpeechParts = useCallback((parts) => {
        if (parts.length === 0 || typeof window === 'undefined' || !window.speechSynthesis) return;

        const lang = (typeof navigator !== 'undefined' && navigator.language) || 'en-US';

        parts.forEach((text) => {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = lang;
            window.speechSynthesis.speak(utterance);
        });
    }, []);

    useEffect(() => {
        if (!ttsListenModeOn || !ttsSupported) return;
        const n = assistantSpeechTexts.length;
        if (n <= assistantSpeechCountRef.current) return;
        const newParts = assistantSpeechTexts.slice(assistantSpeechCountRef.current);
        assistantSpeechCountRef.current = n;
        queueAssistantSpeechParts(newParts);
    }, [assistantSpeechTexts, ttsListenModeOn, ttsSupported, queueAssistantSpeechParts]);

    const handleListenToggle = () => {
        if (ttsListenModeOn) {
            exitTtsListenMode();
            return;
        }
        if (!ttsSupported) return;

        const n = assistantSpeechTexts.length;
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        // Skip everything already in the thread; only assistant messages appended after this count are spoken.
        assistantSpeechCountRef.current = n;
        setTtsListenModeOn(true);
    };

    const handleKeyDown = (e) => {
        if ((e.key === 'Enter' || e.code === 'Enter') && e.shiftKey === false) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearCanvasClick = () => {
        if (typeof onClearCanvas !== 'function') return;
        const ok = window.confirm(
            'Clear every node and edge from the canvas? This does not save automatically—use Save if the workflow is stored.'
        );
        if (ok) {
            onClearCanvas();
        }
    };

    const handleClearChatClick = () => {
        const ok = window.confirm('Clear all messages in this chat?');
        if (!ok) return;
        const key = resolveHistoryStorageKey();
        const fresh = defaultGreetingMessages(workflowId);
        setMessages(fresh);
        assistantSpeechCountRef.current = 0;
        setTtsListenModeOn(false);
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            window.speechSynthesis.cancel();
        }
        safeStorageSet(storage, key, fresh, 'WorkflowChat');
    };

    return (
        <div className="flex flex-col h-full bg-gray-900 text-gray-100">
            <div className="flex justify-end items-center gap-2 px-4 pt-3 pb-0">
                <button
                    type="button"
                    onClick={handleClearChatClick}
                    disabled={isLoading}
                    className="p-2 rounded-md border border-gray-600 text-gray-300 bg-gray-800/80 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Clear chat messages and start fresh"
                    aria-label="Clear chat"
                >
                    <MessageSquareX className="w-4 h-4" aria-hidden />
                </button>
                {typeof onClearCanvas === 'function' && (
                    <button
                        type="button"
                        onClick={handleClearCanvasClick}
                        disabled={isLoading}
                        className="text-xs flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border border-amber-700/80 text-amber-200 bg-amber-950/40 hover:bg-amber-900/50 disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Remove all nodes and edges from the canvas (local only until you save)"
                    >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden />
                        Clear canvas
                    </button>
                )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message, idx) => (
                    <div
                        key={idx}
                        className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.role === 'assistant' && (
                            <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                <Bot className="w-5 h-5" />
                            </div>
                        )}
                        <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                                message.role === 'user'
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800 text-gray-100'
                            }`}
                        >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        </div>
                        {message.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <User className="w-5 h-5" />
                            </div>
                        )}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <Bot className="w-5 h-5" />
                        </div>
                        <div className="bg-gray-800 rounded-lg px-4 py-2">
                            <Loader className="w-5 h-5 animate-spin" />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>
            <div className="border-t border-gray-800 p-4">
                <div className="flex gap-2 items-end">
                    <textarea
                        ref={inputRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your message… (Enter to send, Shift+Enter for new line). Hold Dictate to speak."
                        className="flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        disabled={isLoading}
                    />
                    <div className="flex gap-2 items-end flex-shrink-0">
                        <div className="flex flex-col items-center justify-end gap-0.5 w-[3.25rem]">
                            <label htmlFor="workflow-chat-tool-iterations" className="text-[9px] text-gray-500 leading-none text-center px-0.5">
                                Steps
                            </label>
                            <input
                                id="workflow-chat-tool-iterations"
                                type="number"
                                min={1}
                                max={50}
                                inputMode="numeric"
                                value={toolIterationsInput}
                                onChange={(e) => setToolIterationsInput(e.target.value)}
                                onBlur={persistToolIterations}
                                disabled={isLoading}
                                className="w-full bg-gray-800 border border-gray-600 rounded-md px-1 py-1.5 text-xs text-gray-100 text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                title="Maximum tool-calling rounds (1–50) for this message"
                            />
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <button
                                type="button"
                                disabled={!speechSupported || isLoading}
                                onPointerDown={handleMicPointerDown}
                                onPointerUp={handleMicPointerUp}
                                onPointerCancel={handleMicPointerCancel}
                                className={`w-12 min-h-[2.75rem] px-2 py-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors border border-gray-600 ${
                                    isListening
                                        ? 'bg-red-600 text-white border-red-500 animate-pulse'
                                        : 'bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed'
                                }`}
                                title={
                                    speechSupported
                                        ? 'Speech-to-text: hold to talk (Chrome). Release to send.'
                                        : 'Speech recognition not supported in this browser'
                                }
                                aria-label={
                                    speechSupported
                                        ? 'Hold to dictate; release to send'
                                        : 'Speech recognition unavailable'
                                }
                                aria-pressed={isListening}
                            >
                                <Mic className="w-5 h-5" aria-hidden />
                                <span
                                    className={`text-[9px] leading-none font-medium ${
                                        isListening ? 'text-white/90' : 'text-gray-400'
                                    }`}
                                >
                                    Dictate
                                </span>
                            </button>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <button
                                type="button"
                                disabled={!ttsSupported}
                                onClick={handleListenToggle}
                                className={`w-12 min-h-[2.75rem] px-2 py-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-colors border border-gray-600 ${
                                    ttsListenModeOn
                                        ? 'bg-amber-700 text-white border-amber-500 hover:bg-amber-600'
                                        : 'bg-gray-800 text-gray-200 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed'
                                }`}
                                title={
                                    ttsSupported
                                        ? ttsListenModeOn
                                            ? 'Read-aloud is on. Click to stop and return to standby.'
                                            : 'Auto-read new assistant replies only. Does not replay existing messages. Stays on until you turn it off.'
                                        : 'Text-to-speech not supported in this browser'
                                }
                                aria-label={
                                    ttsListenModeOn
                                        ? 'Turn off read-aloud'
                                        : 'Auto-read new assistant replies aloud'
                                }
                                aria-pressed={ttsListenModeOn}
                            >
                                {ttsListenModeOn ? (
                                    <Square className="w-5 h-5" aria-hidden />
                                ) : (
                                    <Volume2 className="w-5 h-5" aria-hidden />
                                )}
                                <span
                                    className={`text-[9px] leading-none font-medium ${
                                        ttsListenModeOn ? 'text-white/90' : 'text-gray-400'
                                    }`}
                                >
                                    Listen
                                </span>
                            </button>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleSend}
                        disabled={input.trim() === '' || isLoading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors"
                    >
                        {isLoading ? (
                            <Loader className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <Send className="w-5 h-5" />
                                Send
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

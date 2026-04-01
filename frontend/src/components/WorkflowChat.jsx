import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect, useCallback } from "react";
import PropTypes from "prop-types";
import { Send, Loader, Bot, User, Mic, Volume2 } from "lucide-react";
import { logger } from "../utils/logger";
import { defaultAdapters } from "../types/adapters";
import { api } from "../api/client";
import { handleApiError } from "../utils/errorHandler";
import { safeStorageGet, safeStorageSet } from "../utils/storageHelpers";
import { getChatHistoryKey } from "../config/constants";
import {
  usePushToTalk,
  isSpeechSynthesisSupported,
  speakChatMessage,
  stopSpeaking,
} from "../hooks/chat/voice";
function WorkflowChat({
  workflowId,
  onWorkflowUpdate,
  storage = defaultAdapters.createLocalStorageAdapter(),
  logger: injectedLogger = logger
}) {
  const loadConversationHistory = (workflowId2) => {
    const storageKey = getChatHistoryKey(workflowId2);
    const saved = safeStorageGet(
      storage,
      storageKey,
      [],
      "WorkflowChat"
    );
    if (Array.isArray(saved) === true && saved.length > 0) {
      return saved;
    }
    return [{
      role: "assistant",
      content: workflowId2 !== null && workflowId2 !== void 0 && workflowId2 !== "" ? "Hello! I can help you create or modify this workflow. What would you like to do?" : "Hello! I can help you create a new workflow. What would you like to build?"
    }];
  };
  const [messages, setMessages] = useState(() => loadConversationHistory(workflowId));
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [ttsEnabled, setTtsEnabled] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const inputLiveRef = useRef("");
  inputLiveRef.current = input;

  const getInputSnapshot = useCallback(() => inputLiveRef.current, []);
  const sendMessage = useCallback(
    async (rawText) => {
      const userContent = typeof rawText === "string" ? rawText.trim() : "";
      if (userContent === "" || isLoading === true) return;
      const userMessage = {
        role: "user",
        content: userContent
      };
      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);
      try {
        const data = await api.chat({
          workflow_id: workflowId,
          message: userMessage.content,
          conversation_history: messages.map((m) => ({
            role: m.role,
            content: m.content
          }))
        });
        const assistantMessage = {
          role: "assistant",
          content: data.message
        };
        setMessages((prev) => [...prev, assistantMessage]);
        if (ttsEnabled === true) {
          speakChatMessage(assistantMessage.content);
        }
        if (data.workflow_changes !== null && data.workflow_changes !== void 0 && (onWorkflowUpdate !== null && onWorkflowUpdate !== void 0)) {
          injectedLogger.debug("Received workflow changes:", data.workflow_changes);
          injectedLogger.debug("Nodes to delete:", data.workflow_changes.nodes_to_delete);
          onWorkflowUpdate(data.workflow_changes);
        }
      } catch (error) {
        const errorMessage = handleApiError(error, {
          context: "WorkflowChat",
          showNotification: false
        });
        const chatErrorMessage = {
          role: "assistant",
          content: `Sorry, I encountered an error: ${errorMessage}. Please try again.`
        };
        setMessages((prev) => [...prev, chatErrorMessage]);
      } finally {
        setIsLoading(false);
        inputRef.current?.focus();
      }
    },
    [
      isLoading,
      workflowId,
      messages,
      ttsEnabled,
      onWorkflowUpdate,
      injectedLogger
    ]
  );
  const {
    isListening,
    onPushStart,
    onPushEnd,
    supported: sttSupported,
  } = usePushToTalk({
    getInput: getInputSnapshot,
    setInput,
    logger: injectedLogger,
    onSessionEnd: (text) => {
      void sendMessage(text);
    }
  });
  const ttsSupported = isSpeechSynthesisSupported();

  useEffect(() => {
    return () => {
      stopSpeaking();
    };
  }, []);
  useEffect(() => {
    if (messages.length > 0) {
      const storageKey = getChatHistoryKey(workflowId);
      safeStorageSet(storage, storageKey, messages, "WorkflowChat");
    }
  }, [messages, workflowId, storage]);
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    const history = loadConversationHistory(workflowId);
    setMessages(history);
  }, [workflowId]);
  const handleSend = useCallback(() => {
    void sendMessage(input);
  }, [sendMessage, input]);

  const toggleTts = () => {
    setTtsEnabled((prev) => {
      if (prev === true) {
        stopSpeaking();
        return false;
      }
      return true;
    });
  };
  const handleKeyPress = (e) => {
    if (e.key === "Enter" && e.shiftKey === false) {
      e.preventDefault();
      handleSend();
    }
  };
  return /* @__PURE__ */ jsxs("div", { className: "flex flex-col h-full bg-gray-900 text-gray-100", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex-1 overflow-y-auto p-4 space-y-4", children: [
      messages.map((message, idx) => /* @__PURE__ */ jsxs(
        "div",
        {
          className: `flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`,
          children: [
            message.role === "assistant" && /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Bot, { className: "w-5 h-5" }) }),
            /* @__PURE__ */ jsx(
              "div",
              {
                className: `max-w-[80%] rounded-lg px-4 py-2 ${message.role === "user" ? "bg-blue-600 text-white" : "bg-gray-800 text-gray-100"}`,
                children: /* @__PURE__ */ jsx("p", { className: "text-sm whitespace-pre-wrap", children: message.content })
              }
            ),
            message.role === "user" && /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(User, { className: "w-5 h-5" }) })
          ]
        },
        idx
      )),
      isLoading === true && /* @__PURE__ */ jsxs("div", { className: "flex gap-3 justify-start", children: [
        /* @__PURE__ */ jsx("div", { className: "w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0", children: /* @__PURE__ */ jsx(Bot, { className: "w-5 h-5" }) }),
        /* @__PURE__ */ jsx("div", { className: "bg-gray-800 rounded-lg px-4 py-2", children: /* @__PURE__ */ jsx(Loader, { className: "w-5 h-5 animate-spin" }) })
      ] }),
      /* @__PURE__ */ jsx("div", { ref: messagesEndRef })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-gray-800 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2 items-end", children: [
      /* @__PURE__ */ jsx(
        "textarea",
        {
          ref: inputRef,
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyPress: handleKeyPress,
          placeholder: "Type your message... (Enter to send, Shift+Enter for newline). Hold mic to dictate; release to send to the assistant.",
          className: "flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[4.5rem]",
          rows: 2,
          disabled: isLoading
        }
      ),
      /* @__PURE__ */ jsxs("div", { className: "flex gap-1 flex-shrink-0 items-center", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-label": "Push to talk",
            title: sttSupported ? "Hold to speak; release to send dictated text to the assistant" : "Speech recognition not supported in this browser",
            disabled: isLoading === true || sttSupported === false,
            className: `px-3 py-2 rounded-lg flex items-center justify-center transition-colors border border-gray-700 ${isListening === true ? "bg-red-900/50 border-red-500 text-red-200" : "bg-gray-800 text-gray-200 hover:bg-gray-700"} disabled:opacity-40 disabled:cursor-not-allowed`,
            onPointerDown: (e) => {
              if (isLoading === true || sttSupported === false) return;
              e.preventDefault();
              onPushStart();
            },
            onPointerUp: onPushEnd,
            onPointerLeave: onPushEnd,
            onPointerCancel: onPushEnd,
            children: /* @__PURE__ */ jsx(Mic, { className: `w-5 h-5 ${isListening === true ? "animate-pulse" : ""}` })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            "aria-label": ttsEnabled === true ? "Turn off read aloud" : "Turn on read aloud",
            "aria-pressed": ttsEnabled === true,
            title: ttsSupported ? "Read assistant replies aloud (browser speech synthesis)" : "Text-to-speech not supported in this browser",
            disabled: ttsSupported === false,
            onClick: toggleTts,
            className: `px-3 py-2 rounded-lg flex items-center justify-center transition-colors border ${ttsEnabled === true ? "bg-violet-700 border-violet-500 text-white" : "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"} disabled:opacity-40 disabled:cursor-not-allowed`,
            children: /* @__PURE__ */ jsx(Volume2, { className: "w-5 h-5" })
          }
        ),
        /* @__PURE__ */ jsx(
          "button",
          {
            type: "button",
            onClick: handleSend,
            disabled: input.trim() === "" || isLoading === true,
            className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors",
            children: isLoading === true ? /* @__PURE__ */ jsx(Loader, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
              /* @__PURE__ */ jsx(Send, { className: "w-5 h-5" }),
              "Send"
            ] })
          }
        )
      ] })
    ] }) })
  ] });
}

WorkflowChat.propTypes = {
  workflowId: PropTypes.string,
  onWorkflowUpdate: PropTypes.func,
  storage: PropTypes.shape({
    getItem: PropTypes.func,
    setItem: PropTypes.func,
    removeItem: PropTypes.func,
  }),
  logger: PropTypes.shape({
    debug: PropTypes.func,
    info: PropTypes.func,
    warn: PropTypes.func,
    error: PropTypes.func,
    log: PropTypes.func,
  }),
};

export {
  WorkflowChat as default
};

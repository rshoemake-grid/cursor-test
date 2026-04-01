import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from "react";
import { Send, Loader, Bot, User } from "lucide-react";
import { logger } from "../utils/logger";
import { defaultAdapters } from "../types/adapters";
import { api } from "../api/client";
import { handleApiError } from "../utils/errorHandler";
import { safeStorageGet, safeStorageSet } from "../utils/storageHelpers";
import { getChatHistoryKey } from "../config/constants";
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
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
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
  const handleSend = async () => {
    if (input.trim() === "" || isLoading === true) return;
    const userMessage = {
      role: "user",
      content: input.trim()
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
      if (data.workflow_changes !== null && data.workflow_changes !== void 0 && (onWorkflowUpdate !== null && onWorkflowUpdate !== void 0)) {
        injectedLogger.debug("Received workflow changes:", data.workflow_changes);
        injectedLogger.debug("Nodes to delete:", data.workflow_changes.nodes_to_delete);
        onWorkflowUpdate(data.workflow_changes);
      }
    } catch (error) {
      const errorMessage = handleApiError(error, {
        context: "WorkflowChat",
        showNotification: false
        // We'll show error in chat instead
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
    /* @__PURE__ */ jsx("div", { className: "border-t border-gray-800 p-4", children: /* @__PURE__ */ jsxs("div", { className: "flex gap-2", children: [
      /* @__PURE__ */ jsx(
        "textarea",
        {
          ref: inputRef,
          value: input,
          onChange: (e) => setInput(e.target.value),
          onKeyPress: handleKeyPress,
          placeholder: "Type your message... (Press Enter to send, Shift+Enter for new line)",
          className: "flex-1 bg-gray-800 text-gray-100 rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500",
          rows: 2,
          disabled: isLoading
        }
      ),
      /* @__PURE__ */ jsx(
        "button",
        {
          onClick: handleSend,
          disabled: input.trim() === "" || isLoading === true,
          className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors",
          children: isLoading === true ? /* @__PURE__ */ jsx(Loader, { className: "w-5 h-5 animate-spin" }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Send, { className: "w-5 h-5" }),
            "Send"
          ] })
        }
      )
    ] }) })
  ] });
}
export {
  WorkflowChat as default
};

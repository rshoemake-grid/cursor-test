import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import WorkflowChat from "./WorkflowChat";
import { AuthProvider } from "../contexts/AuthContext";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, {
    timeout,
  });
};
jest.mock("../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn(),
  },
}));
jest.mock("../api/client", () => ({
  api: {
    chat: jest.fn(),
  },
}));
import { api } from "../api/client";
jest.mock("../utils/errorHandler", () => ({
  handleApiError: jest.fn((error) => {
    return error?.message || "Unknown error";
  }),
}));
jest.mock("../utils/storageHelpers", () => ({
  safeStorageGet: jest.fn((storage, key, defaultValue) => {
    if (!storage) return defaultValue;
    try {
      const item = storage.getItem(key);
      if (!item) return defaultValue;
      return JSON.parse(item);
    } catch {
      return defaultValue;
    }
  }),
  safeStorageSet: jest.fn((storage, key, value) => {
    if (!storage) return false;
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  }),
  safeStorageRemove: jest.fn((storage, key) => {
    if (!storage) return false;
    try {
      storage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  }),
}));
global.fetch = jest.fn();
const mockUseAuth = jest.fn(() => ({
  token: "test-token",
  user: {
    id: "1",
    username: "testuser",
  },
  isAuthenticated: true,
}));
jest.mock("../contexts/AuthContext", () => ({
  ...jest.requireActual("../contexts/AuthContext"),
  useAuth: () => mockUseAuth(),
}));
const renderWithProvider = (component) => {
  return render(
    <MemoryRouter>
      <AuthProvider>{component}</AuthProvider>
    </MemoryRouter>,
  );
};
describe("WorkflowChat", () => {
  const mockOnWorkflowUpdate = jest.fn();
  beforeEach(() => {
    mockUseAuth.mockReturnValue({
      token: "test-token",
      user: {
        id: "1",
        username: "testuser",
      },
      isAuthenticated: true,
    });
    class MockSpeechRecognition {
      constructor() {
        this.continuous = false;
        this.interimResults = false;
        this.start = jest.fn();
        this.stop = jest.fn();
        this.abort = jest.fn();
      }
    }
    window.SpeechRecognition = MockSpeechRecognition;
    window.webkitSpeechRecognition = MockSpeechRecognition;
    window.speechSynthesis = {
      speak: jest.fn(),
      cancel: jest.fn(),
      resume: jest.fn(),
      getVoices: jest.fn(() => []),
    };
    global.SpeechSynthesisUtterance = function Utterance(text) {
      this.text = text;
      this.lang = "";
    };
    localStorage.clear();
    const {
      safeStorageGet,
      safeStorageSet,
      safeStorageRemove,
    } = require("../utils/storageHelpers");
    const { handleApiError } = require("../utils/errorHandler");
    api.chat.mockClear();
    api.chat.mockResolvedValue({
      message: "Response message",
    });
    safeStorageGet.mockImplementation((storage, key, defaultValue) => {
      if (!storage) return defaultValue;
      try {
        const item = storage.getItem(key);
        if (!item) return defaultValue;
        return JSON.parse(item);
      } catch {
        return defaultValue;
      }
    });
    safeStorageSet.mockImplementation((storage, key, value) => {
      if (!storage) return false;
      try {
        storage.setItem(key, JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    });
    safeStorageRemove.mockImplementation((storage, key) => {
      if (!storage) return false;
      try {
        storage.removeItem(key);
        return true;
      } catch {
        return false;
      }
    });
    handleApiError.mockImplementation((error) => {
      return error?.message || "Unknown error";
    });
    Element.prototype.scrollIntoView = jest.fn();
  });
  it("should disable chat input and send when not authenticated", () => {
    mockUseAuth.mockReturnValue({
      token: null,
      user: null,
      isAuthenticated: false,
    });
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    expect(screen.getByPlaceholderText(/Sign in to chat/)).toBeDisabled();
    expect(screen.getByLabelText(/max iterations/i)).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Send$/ })).toBeDisabled();
    expect(
      screen.getByRole("link", {
        name: /sign in/i,
      }),
    ).toBeInTheDocument();
  });
  it("should render chat interface", () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    expect(
      screen.getByRole("button", {
        name: /clear chat and start over/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText(/Type your message/),
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/max iterations/i)).toHaveValue(20);
    expect(screen.getByRole("button", { name: /^Send$/ })).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /push to talk/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /turn on read aloud/i,
      }),
    ).toBeInTheDocument();
  });
  it("should call speech synthesis when read aloud is on and assistant replies", async () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    fireEvent.click(
      screen.getByRole("button", {
        name: /turn on read aloud/i,
      }),
    );
    expect(
      screen.getByRole("button", {
        name: /turn off read aloud/i,
      }),
    ).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Type your message/), {
      target: {
        value: "Hello",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitForWithTimeout(() => {
      expect(window.speechSynthesis.speak).toHaveBeenCalled();
    });
  });
  it("should display default greeting for existing workflow", () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    expect(
      screen.getByText(/Hello! I can help you create or modify this workflow/),
    ).toBeInTheDocument();
  });
  it("should display default greeting for new workflow", () => {
    renderWithProvider(<WorkflowChat workflowId={null} />);
    expect(
      screen.getByText(/Hello! I can help you create a new workflow/),
    ).toBeInTheDocument();
  });
  it("should load conversation history from localStorage", () => {
    const history = [
      {
        role: "user",
        content: "Hello",
      },
      {
        role: "assistant",
        content: "Hi there!",
      },
    ];
    localStorage.setItem("chat_history_workflow-1", JSON.stringify(history));
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    expect(screen.getByText("Hi there!")).toBeInTheDocument();
  });
  it("should reset chat when chatClearNonce increases (clear workflow)", async () => {
    const { safeStorageRemove } = require("../utils/storageHelpers");
    const history = [
      {
        role: "user",
        content: "Wipe me",
      },
      {
        role: "assistant",
        content: "Ok",
      },
    ];
    localStorage.setItem("chat_history_workflow-1", JSON.stringify(history));
    const { rerender } = renderWithProvider(
      <WorkflowChat workflowId="workflow-1" chatClearNonce={0} />,
    );
    expect(screen.getByText("Wipe me")).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <AuthProvider>
          <WorkflowChat workflowId="workflow-1" chatClearNonce={1} />
        </AuthProvider>
      </MemoryRouter>,
    );
    await waitForWithTimeout(() => {
      expect(screen.queryByText("Wipe me")).not.toBeInTheDocument();
      expect(
        screen.getByText(
          /Hello! I can help you create or modify this workflow/,
        ),
      ).toBeInTheDocument();
    });
    expect(safeStorageRemove).toHaveBeenCalledWith(
      expect.anything(),
      "chat_history_workflow-1",
      "WorkflowChat",
    );
  });
  it("should use separate chat storage per tab when workflowId is null", () => {
    localStorage.setItem(
      "chat_history_tab_tab-a",
      JSON.stringify([
        {
          role: "user",
          content: "Message A",
        },
      ]),
    );
    localStorage.setItem(
      "chat_history_tab_tab-b",
      JSON.stringify([
        {
          role: "user",
          content: "Message B",
        },
      ]),
    );
    const { unmount } = renderWithProvider(
      <WorkflowChat workflowId={null} tabId="tab-a" />,
    );
    expect(screen.getByText("Message A")).toBeInTheDocument();
    expect(screen.queryByText("Message B")).not.toBeInTheDocument();
    unmount();
    renderWithProvider(<WorkflowChat workflowId={null} tabId="tab-b" />);
    expect(screen.getByText("Message B")).toBeInTheDocument();
    expect(screen.queryByText("Message A")).not.toBeInTheDocument();
  });
  it("should migrate tab-scoped chat to workflow key after save", () => {
    localStorage.setItem(
      "chat_history_tab_draft-tab",
      JSON.stringify([
        {
          role: "user",
          content: "Before save",
        },
      ]),
    );
    const { rerender } = renderWithProvider(
      <WorkflowChat workflowId={null} tabId="draft-tab" />,
    );
    expect(screen.getByText("Before save")).toBeInTheDocument();
    rerender(
      <MemoryRouter>
        <AuthProvider>
          <WorkflowChat workflowId="saved-wf-1" tabId="draft-tab" />
        </AuthProvider>
      </MemoryRouter>,
    );
    expect(screen.getByText("Before save")).toBeInTheDocument();
    expect(localStorage.getItem("chat_history_tab_draft-tab")).toBeNull();
    const migrated = JSON.parse(
      localStorage.getItem("chat_history_saved-wf-1"),
    );
    expect(migrated.some((m) => m.content === "Before save")).toBe(true);
  });
  it("should clear chat session, remove storage, and reset to greeting", () => {
    const { safeStorageRemove } = require("../utils/storageHelpers");
    const history = [
      {
        role: "user",
        content: "Hello",
      },
      {
        role: "assistant",
        content: "Hi there!",
      },
    ];
    localStorage.setItem("chat_history_workflow-1", JSON.stringify(history));
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    expect(screen.getByText("Hello")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText(/Type your message/), {
      target: {
        value: "draft",
      },
    });
    fireEvent.click(
      screen.getByRole("button", {
        name: /clear chat and start over/i,
      }),
    );
    expect(screen.queryByText("Hello")).not.toBeInTheDocument();
    expect(screen.queryByText("Hi there!")).not.toBeInTheDocument();
    expect(
      screen.getByText(/Hello! I can help you create or modify this workflow/),
    ).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Type your message/)).toHaveValue("");
    expect(safeStorageRemove).toHaveBeenCalledWith(
      expect.anything(),
      "chat_history_workflow-1",
      "WorkflowChat",
    );
    const saved = localStorage.getItem("chat_history_workflow-1");
    expect(saved).toBeTruthy();
    const parsed = JSON.parse(saved);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].role).toBe("assistant");
    expect(parsed[0].content).toMatch(
      /Hello! I can help you create or modify this workflow/,
    );
  });
  it("should disable clear chat button while sending", async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    api.chat.mockReturnValue(promise);
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    fireEvent.change(screen.getByPlaceholderText(/Type your message/), {
      target: {
        value: "Hi",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitForWithTimeout(() => {
      expect(
        screen.getByRole("button", {
          name: /clear chat and start over/i,
        }),
      ).toBeDisabled();
    }, 2e3);
    resolvePromise({
      message: "Done",
    });
    await waitForWithTimeout(() => {
      expect(
        screen.getByRole("button", {
          name: /clear chat and start over/i,
        }),
      ).not.toBeDisabled();
    }, 2e3);
  });
  it("should handle invalid localStorage history gracefully", () => {
    const { safeStorageGet } = require("../utils/storageHelpers");
    safeStorageGet.mockReturnValueOnce([]);
    localStorage.setItem("chat_history_workflow-1", "invalid json");
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument();
  });
  it("should coerce missing message content when sending so API always gets string content", async () => {
    const { safeStorageGet } = require("../utils/storageHelpers");
    const { getChatHistoryKey } = require("../config/constants");
    const historyPayload = [
      {
        role: "assistant",
      },
      {
        role: "user",
        content: "Hi",
      },
    ];
    const historyKey = getChatHistoryKey("workflow-1");
    safeStorageGet.mockImplementation((storage, key, defaultValue) => {
      if (key === historyKey) {
        return historyPayload;
      }
      if (Array.isArray(defaultValue)) {
        return defaultValue;
      }
      return defaultValue ?? null;
    });
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Next",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitForWithTimeout(() => {
      expect(api.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Next",
          iteration_limit: 20,
          conversation_history: [
            {
              role: "assistant",
              content: "",
            },
            {
              role: "user",
              content: "Hi",
            },
            {
              role: "user",
              content: "Next",
            },
          ],
        }),
      );
    }, 3e3);
  });
  it("should send message when send button is clicked", async () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      expect(api.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          workflow_id: "workflow-1",
          message: "Test message",
          iteration_limit: 20,
        }),
      );
    }, 3e3);
  });
  it("should send custom iteration_limit from the iterations field", async () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    fireEvent.change(screen.getByLabelText(/max iterations/i), {
      target: {
        value: "7",
      },
    });
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Hi",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitForWithTimeout(() => {
      expect(api.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          message: "Hi",
          iteration_limit: 7,
        }),
      );
    }, 3e3);
  });
  it("should send canvas_snapshot when getCanvasSnapshot returns nodes and edges", async () => {
    const getCanvasSnapshot = jest.fn(() => ({
      nodes: [
        {
          id: "n1",
          type: "start",
          name: "S",
          position: {
            x: 0,
            y: 0,
          },
        },
      ],
      edges: [
        {
          id: "e1",
          source: "n1",
          target: "n2",
        },
      ],
    }));
    renderWithProvider(
      <WorkflowChat
        workflowId="workflow-1"
        getCanvasSnapshot={getCanvasSnapshot}
      />,
    );
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Hi",
      },
    });
    fireEvent.click(screen.getByRole("button", { name: /^Send$/ }));
    await waitForWithTimeout(() => {
      expect(api.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          canvas_snapshot: {
            nodes: [
              {
                id: "n1",
                type: "start",
                name: "S",
                position: {
                  x: 0,
                  y: 0,
                },
              },
            ],
            edges: [
              {
                id: "e1",
                source: "n1",
                target: "n2",
              },
            ],
          },
        }),
      );
    }, 3e3);
    expect(getCanvasSnapshot).toHaveBeenCalled();
  });
  it("should send message when Enter is pressed", async () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    fireEvent.keyPress(input, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
    });
    await waitForWithTimeout(() => {
      expect(api.chat).toHaveBeenCalled();
    }, 3e3);
  });
  it("should not send message when Shift+Enter is pressed", () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    fireEvent.keyPress(input, {
      key: "Enter",
      code: "Enter",
      charCode: 13,
      shiftKey: true,
    });
    expect(api.chat).not.toHaveBeenCalled();
  });
  it("should not send empty message", () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    expect(sendButton).toBeDisabled();
  });
  it("should display user and assistant messages", async () => {
    api.chat.mockResolvedValue({
      message: "Assistant response",
    });
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "User message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText("User message")).toBeInTheDocument();
    }, 2e3);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Assistant response")).toBeInTheDocument();
    }, 3e3);
  });
  it("should handle API error", async () => {
    const { handleApiError } = require("../utils/errorHandler");
    handleApiError.mockReturnValue("HTTP error! status: 500");
    api.chat.mockRejectedValue(new Error("HTTP 500"));
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText(/HTTP error/)).toBeInTheDocument();
    }, 2e3);
  });
  it("should apply workflow changes when received", async () => {
    api.chat.mockResolvedValue({
      message: "Response",
      workflow_changes: {
        nodes_to_add: [],
        nodes_to_delete: ["node-1"],
      },
    });
    renderWithProvider(
      <WorkflowChat
        workflowId="workflow-1"
        onWorkflowUpdate={mockOnWorkflowUpdate}
      />,
    );
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      expect(mockOnWorkflowUpdate).toHaveBeenCalledWith({
        nodes_to_add: [],
        nodes_to_delete: ["node-1"],
      });
    }, 3e3);
  });
  it("should save conversation history to localStorage", async () => {
    api.chat.mockResolvedValue({
      message: "Response",
    });
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      const saved = localStorage.getItem("chat_history_workflow-1");
      expect(saved).toBeDefined();
      const parsed = JSON.parse(saved);
      expect(parsed.length).toBeGreaterThan(1);
    }, 2e3);
  });
  it("should load conversation history when workflowId changes", async () => {
    api.chat.mockResolvedValue({
      message: "Response",
    });
    const history1 = [
      {
        role: "user",
        content: "Message 1",
      },
    ];
    localStorage.setItem("chat_history_workflow-1", JSON.stringify(history1));
    const { unmount } = renderWithProvider(
      <WorkflowChat workflowId="workflow-1" />,
    );
    await waitForWithTimeout(() => {
      expect(screen.getByText("Message 1")).toBeInTheDocument();
    }, 2e3);
    unmount();
    const history2 = [
      {
        role: "user",
        content: "Message 2",
      },
    ];
    localStorage.setItem("chat_history_workflow-2", JSON.stringify(history2));
    renderWithProvider(<WorkflowChat workflowId="workflow-2" />);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Message 2")).toBeInTheDocument();
    }, 2e3);
  });
  it("should show loading state while sending", async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    api.chat.mockReturnValue(promise);
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      expect(screen.queryByText("Send")).not.toBeInTheDocument();
    }, 2e3);
    resolvePromise({
      message: "Response",
    });
    await waitForWithTimeout(() => {
      expect(screen.getByRole("button", { name: /^Send$/ })).toBeInTheDocument();
    }, 2e3);
  });
  it("should handle non-Error exception", async () => {
    const { handleApiError } = require("../utils/errorHandler");
    handleApiError.mockReturnValue("Unknown error");
    api.chat.mockRejectedValue("String error");
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText(/Unknown error/)).toBeInTheDocument();
    }, 2e3);
  });
  it("should handle empty history array", () => {
    localStorage.setItem("chat_history_workflow-1", JSON.stringify([]));
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument();
  });
  it("should not call onWorkflowUpdate when workflow_changes is missing", async () => {
    api.chat.mockResolvedValue({
      message: "Response",
    });
    renderWithProvider(
      <WorkflowChat
        workflowId="workflow-1"
        onWorkflowUpdate={mockOnWorkflowUpdate}
      />,
    );
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Response")).toBeInTheDocument();
    }, 3e3);
    expect(mockOnWorkflowUpdate).not.toHaveBeenCalled();
  });
  it("should handle network errors", async () => {
    const { handleApiError } = require("../utils/errorHandler");
    handleApiError.mockReturnValue("Network error");
    api.chat.mockRejectedValue(new Error("Network error"));
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      expect(screen.getByText(/Network error/)).toBeInTheDocument();
    }, 2e3);
  });
  it("should not send when input is only whitespace", () => {
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "   ",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    expect(sendButton).toBeDisabled();
  });
  it("should not send when isLoading is true", async () => {
    let resolvePromise;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    api.chat.mockReturnValue(promise);
    renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
    const input = screen.getByPlaceholderText(/Type your message/);
    fireEvent.change(input, {
      target: {
        value: "Test message",
      },
    });
    const sendButton = screen.getByRole("button", { name: /^Send$/ });
    fireEvent.click(sendButton);
    await waitForWithTimeout(() => {
      expect(sendButton).toBeDisabled();
    }, 2e3);
    fireEvent.change(input, {
      target: {
        value: "Another message",
      },
    });
    resolvePromise({
      message: "Response",
    });
  });
  describe("Dependency Injection", () => {
    it("should use injected storage adapter", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(
          JSON.stringify([
            {
              role: "user",
              content: "Test message",
            },
          ]),
        ),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" storage={mockStorage} />,
      );
      expect(mockStorage.getItem).toHaveBeenCalledWith(
        "chat_history_workflow-1",
      );
    });
    it("should use API client for chat", async () => {
      api.chat.mockResolvedValue({
        message: "Response from API client",
      });
      renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
      const input = screen.getByPlaceholderText(/Type your message/);
      fireEvent.change(input, {
        target: {
          value: "Test message",
        },
      });
      const sendButton = screen.getByRole("button", { name: /^Send$/ });
      fireEvent.click(sendButton);
      await waitForWithTimeout(() => {
        expect(api.chat).toHaveBeenCalled();
      }, 3e3);
      await waitForWithTimeout(() => {
        expect(
          screen.getByText("Response from API client"),
        ).toBeInTheDocument();
      }, 3e3);
    });
    it("should use injected logger", async () => {
      const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn(),
      };
      api.chat.mockResolvedValue({
        message: "Response",
        workflow_changes: {
          nodes_to_delete: ["node-1"],
        },
      });
      renderWithProvider(
        <WorkflowChat
          workflowId="workflow-1"
          logger={mockLogger}
          onWorkflowUpdate={mockOnWorkflowUpdate}
        />,
      );
      const input = screen.getByPlaceholderText(/Type your message/);
      fireEvent.change(input, {
        target: {
          value: "Test message",
        },
      });
      const sendButton = screen.getByRole("button", { name: /^Send$/ });
      fireEvent.click(sendButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText("Response")).toBeInTheDocument();
      });
      await waitForWithTimeout(() => {
        expect(mockLogger.debug).toHaveBeenCalledWith(
          "Received workflow changes:",
          expect.objectContaining({
            nodes_to_delete: ["node-1"],
          }),
        );
      }, 2e3);
    });
    it("should handle storage errors gracefully", () => {
      const { safeStorageGet } = require("../utils/storageHelpers");
      safeStorageGet.mockReturnValueOnce([]);
      const mockStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error("Storage quota exceeded");
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" storage={mockStorage} />,
      );
      expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument();
    });
    it("should handle storage setItem errors", async () => {
      const { safeStorageSet } = require("../utils/storageHelpers");
      safeStorageSet.mockReturnValue(false);
      api.chat.mockResolvedValue({
        message: "Response",
      });
      renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
      const input = screen.getByPlaceholderText(/Type your message/);
      fireEvent.change(input, {
        target: {
          value: "Test message",
        },
      });
      const sendButton = screen.getByRole("button", { name: /^Send$/ });
      fireEvent.click(sendButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText("Response")).toBeInTheDocument();
      });
    });
    it("should handle HTTP client errors", async () => {
      const { handleApiError } = require("../utils/errorHandler");
      handleApiError.mockReturnValue("Network error");
      api.chat.mockRejectedValue(new Error("Network error"));
      renderWithProvider(<WorkflowChat workflowId="workflow-1" />);
      const input = screen.getByPlaceholderText(/Type your message/);
      fireEvent.change(input, {
        target: {
          value: "Test message",
        },
      });
      const sendButton = screen.getByRole("button", { name: /^Send$/ });
      fireEvent.click(sendButton);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Network error/)).toBeInTheDocument();
      }, 2e3);
      expect(handleApiError).toHaveBeenCalled();
    });
    it("should handle null storage adapter", () => {
      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" storage={null} />,
      );
      expect(screen.getByText(/Hello! I can help you/)).toBeInTheDocument();
    });
    it("should save to injected storage adapter", async () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
      };
      api.chat.mockResolvedValue({
        message: "Response",
      });
      renderWithProvider(
        <WorkflowChat workflowId="workflow-1" storage={mockStorage} />,
      );
      const input = screen.getByPlaceholderText(/Type your message/);
      fireEvent.change(input, {
        target: {
          value: "Test message",
        },
      });
      const sendButton = screen.getByRole("button", { name: /^Send$/ });
      fireEvent.click(sendButton);
      await waitForWithTimeout(() => {
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          "chat_history_workflow-1",
          expect.stringContaining("Test message"),
        );
      }, 2e3);
    });
  });
});

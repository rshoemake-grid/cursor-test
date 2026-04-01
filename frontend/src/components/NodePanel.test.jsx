import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
import NodePanel from "./NodePanel";
import { logger } from "../utils/logger";
import { showSuccess, showError } from "../utils/notifications";
import { STORAGE_KEYS } from "../config/constants";
jest.mock("../utils/notifications", () => ({
  showSuccess: jest.fn(),
  showError: jest.fn()
}));
jest.mock("../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  }
}));
describe("NodePanel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
  });
  it("should render node palette", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    expect(screen.getByText("Node Palette")).toBeInTheDocument();
    expect(screen.getByText(/Drag nodes onto the canvas/)).toBeInTheDocument();
  });
  it("should render workflow nodes category", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    expect(screen.getByText("Workflow Nodes")).toBeInTheDocument();
  });
  it("should toggle workflow nodes category", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    const toggleButton = screen.getByText("Workflow Nodes").closest("button");
    expect(toggleButton).toBeDefined();
    expect(screen.queryByText("Start")).not.toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(screen.getByText("Start")).toBeInTheDocument();
    expect(screen.getByText("Condition")).toBeInTheDocument();
    expect(screen.getByText("Loop")).toBeInTheDocument();
    expect(screen.getByText("End")).toBeInTheDocument();
  });
  it("should render agent nodes category", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    expect(screen.getByText("Agent Nodes")).toBeInTheDocument();
  });
  it("should toggle agent nodes category", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    const toggleButton = screen.getByText("Agent Nodes").closest("button");
    fireEvent.click(toggleButton);
    expect(screen.queryByText("Agent")).not.toBeInTheDocument();
    fireEvent.click(toggleButton);
    expect(screen.getByText("Agent")).toBeInTheDocument();
  });
  it("should show ADK Agent in palette when agent nodes expanded", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    expect(screen.getByText("ADK Agent")).toBeInTheDocument();
    expect(screen.getByText(/Google ADK agent/)).toBeInTheDocument();
  });
  it("should handle drag start for ADK Agent with agent_type and adk_config", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    const adkAgentNode = screen.getByText("ADK Agent").closest("div");
    expect(adkAgentNode).toBeDefined();
    const dragEvent = new Event("dragstart");
    dragEvent.dataTransfer = {
      setData: jest.fn(),
      effectAllowed: ""
    };
    fireEvent.dragStart(adkAgentNode, dragEvent);
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith("application/reactflow", "agent");
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith("application/custom-agent", expect.any(String));
    const customAgentJson = dragEvent.dataTransfer.setData.mock.calls.find(
      (c) => c[0] === "application/custom-agent"
    )?.[1];
    const parsed = JSON.parse(customAgentJson);
    expect(parsed.agent_config).toMatchObject({ agent_type: "adk", adk_config: { name: "adk_agent" } });
    expect(parsed.label).toBe("ADK Agent");
  });
  it("should render data nodes category", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    expect(screen.getByText("Data Nodes")).toBeInTheDocument();
  });
  it("should toggle data nodes category", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    const toggleButton = screen.getByText("Data Nodes").closest("button");
    fireEvent.click(toggleButton);
    expect(screen.getByText("GCP Bucket")).toBeInTheDocument();
    expect(screen.getByText("AWS S3")).toBeInTheDocument();
    expect(screen.getByText("GCP Pub/Sub")).toBeInTheDocument();
    expect(screen.getByText("Local File")).toBeInTheDocument();
    expect(screen.getByText("Database")).toBeInTheDocument();
    expect(screen.getByText("Firebase")).toBeInTheDocument();
    expect(screen.getByText("BigQuery")).toBeInTheDocument();
  });
  it("should load custom agent nodes from localStorage", () => {
    const customNodes = [
      { id: "custom-1", label: "Custom Agent 1", description: "Custom description" }
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_AGENT_NODES, JSON.stringify(customNodes));
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    expect(screen.getByText("Custom Agent 1")).toBeInTheDocument();
  });
  it("should handle invalid localStorage data gracefully", () => {
    localStorage.setItem(STORAGE_KEYS.CUSTOM_AGENT_NODES, "invalid json");
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    expect(screen.getByText("Node Palette")).toBeInTheDocument();
    expect(logger.error).toHaveBeenCalled();
  });
  it("should handle drag start for workflow nodes", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    const toggleButton = screen.getByText("Workflow Nodes").closest("button");
    fireEvent.click(toggleButton);
    const startNode = screen.getByText("Start").closest("div");
    expect(startNode).toBeDefined();
    const dragEvent = new Event("dragstart");
    dragEvent.dataTransfer = {
      setData: jest.fn(),
      effectAllowed: ""
    };
    fireEvent.dragStart(startNode, dragEvent);
    expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith("application/reactflow", "start");
  });
  it("should handle drag start for agent nodes with custom data", async () => {
    const customNodes = [
      { id: "custom-1", label: "Custom Agent", description: "Description" }
    ];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_AGENT_NODES, JSON.stringify(customNodes));
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    await waitForWithTimeout(() => {
      const customAgentNode = screen.getByText("Custom Agent").closest("div");
      expect(customAgentNode).toBeDefined();
      const dragEvent = new Event("dragstart");
      dragEvent.dataTransfer = {
        setData: jest.fn(),
        effectAllowed: ""
      };
      fireEvent.dragStart(customAgentNode, dragEvent);
      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith("application/reactflow", "agent");
      expect(dragEvent.dataTransfer.setData).toHaveBeenCalledWith("application/custom-agent", expect.any(String));
    });
  });
  it("should display tip message", () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    expect(screen.getByText(/💡 Tip/)).toBeInTheDocument();
    expect(screen.getByText(/Connect nodes by dragging/)).toBeInTheDocument();
  });
  it("should update custom agent nodes when storage event fires", async () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    const newNodes = [{ id: "custom-2", label: "New Agent" }];
    const storageEvent = new StorageEvent("storage", {
      key: STORAGE_KEYS.CUSTOM_AGENT_NODES,
      newValue: JSON.stringify(newNodes)
    });
    window.dispatchEvent(storageEvent);
    await waitForWithTimeout(() => {
      expect(screen.getByText("New Agent")).toBeInTheDocument();
    });
  });
  it("should handle custom storage event for same-window updates", async () => {
    render(/* @__PURE__ */ jsx(NodePanel, {}));
    const newNodes = [{ id: "custom-3", label: "Updated Agent" }];
    localStorage.setItem(STORAGE_KEYS.CUSTOM_AGENT_NODES, JSON.stringify(newNodes));
    const customEvent = new Event("customAgentNodesUpdated");
    window.dispatchEvent(customEvent);
    await waitForWithTimeout(() => {
      expect(screen.getByText("Updated Agent")).toBeInTheDocument();
    });
  });
  describe("Dependency Injection", () => {
    it("should use injected storage adapter", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(JSON.stringify([
          { id: "custom-1", label: "Custom Agent 1" }
        ])),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      render(/* @__PURE__ */ jsx(NodePanel, { storage: mockStorage }));
      expect(mockStorage.getItem).toHaveBeenCalledWith(STORAGE_KEYS.CUSTOM_AGENT_NODES);
    });
    it("should use injected logger", () => {
      const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn()
      };
      const mockStorage = {
        getItem: jest.fn().mockReturnValue("invalid json"),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      render(/* @__PURE__ */ jsx(NodePanel, { storage: mockStorage, logger: mockLogger }));
      expect(mockLogger.error).toHaveBeenCalled();
    });
    it("should handle storage errors gracefully", () => {
      const mockStorage = {
        getItem: jest.fn().mockImplementation(() => {
          throw new Error("Storage error");
        }),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      const mockLogger = {
        debug: jest.fn(),
        error: jest.fn(),
        warn: jest.fn(),
        info: jest.fn()
      };
      render(/* @__PURE__ */ jsx(NodePanel, { storage: mockStorage, logger: mockLogger }));
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
      expect(mockLogger.error).toHaveBeenCalled();
    });
    it("should handle null storage adapter", () => {
      render(/* @__PURE__ */ jsx(NodePanel, { storage: null }));
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
    });
    it("should use window event listeners for storage events", () => {
      const addEventListenerSpy = jest.spyOn(window, "addEventListener");
      const removeEventListenerSpy = jest.spyOn(window, "removeEventListener");
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(null),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      const { unmount } = render(/* @__PURE__ */ jsx(NodePanel, { storage: mockStorage }));
      expect(addEventListenerSpy).toHaveBeenCalledWith("storage", expect.any(Function));
      expect(addEventListenerSpy).toHaveBeenCalledWith("customAgentNodesUpdated", expect.any(Function));
      unmount();
      expect(removeEventListenerSpy).toHaveBeenCalledWith("storage", expect.any(Function));
      expect(removeEventListenerSpy).toHaveBeenCalledWith("customAgentNodesUpdated", expect.any(Function));
      addEventListenerSpy.mockRestore();
      removeEventListenerSpy.mockRestore();
    });
    it("should handle storage event with injected storage", async () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValueOnce(null).mockReturnValueOnce(JSON.stringify([{ id: "custom-1", label: "New Agent" }])),
        // After event
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      render(/* @__PURE__ */ jsx(NodePanel, { storage: mockStorage }));
      const storageEvent = new StorageEvent("storage", {
        key: STORAGE_KEYS.CUSTOM_AGENT_NODES,
        newValue: JSON.stringify([{ id: "custom-1", label: "New Agent" }])
      });
      window.dispatchEvent(storageEvent);
      await waitForWithTimeout(() => {
        expect(screen.getByText("New Agent")).toBeInTheDocument();
      });
    });
  });
  describe("edge cases", () => {
    it("should handle storage event with null newValue", () => {
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const storageEvent = new StorageEvent("storage", {
        key: STORAGE_KEYS.CUSTOM_AGENT_NODES,
        newValue: null
      });
      window.dispatchEvent(storageEvent);
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
    });
    it("should handle storage event with empty string newValue", () => {
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const storageEvent = new StorageEvent("storage", {
        key: STORAGE_KEYS.CUSTOM_AGENT_NODES,
        newValue: ""
      });
      window.dispatchEvent(storageEvent);
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
    });
    it("should handle storage event with invalid JSON newValue", () => {
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const storageEvent = new StorageEvent("storage", {
        key: STORAGE_KEYS.CUSTOM_AGENT_NODES,
        newValue: "{invalid json}"
      });
      window.dispatchEvent(storageEvent);
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
      expect(logger.error).toHaveBeenCalled();
    });
    it("should handle storage event with non-array parsed value", () => {
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const storageEvent = new StorageEvent("storage", {
        key: STORAGE_KEYS.CUSTOM_AGENT_NODES,
        newValue: JSON.stringify({ not: "an array" })
      });
      window.dispatchEvent(storageEvent);
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
    });
    it("should handle customAgentNodesUpdated event when storage is null", () => {
      render(/* @__PURE__ */ jsx(NodePanel, { storage: null }));
      const customEvent = new Event("customAgentNodesUpdated");
      window.dispatchEvent(customEvent);
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
    });
    it("should handle storage.getItem returning non-string value", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(123),
        // Non-string
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      render(/* @__PURE__ */ jsx(NodePanel, { storage: mockStorage }));
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
    });
    it("should handle storage.getItem returning empty string", () => {
      const mockStorage = {
        getItem: jest.fn().mockReturnValue(""),
        setItem: jest.fn(),
        removeItem: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn()
      };
      render(/* @__PURE__ */ jsx(NodePanel, { storage: mockStorage }));
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
    });
    it("should show Import Agent button when agent nodes expanded", () => {
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      expect(screen.getByRole("button", { name: /import agent/i })).toBeInTheDocument();
    });
    it("should import agent config from JSON file", async () => {
      const agentConfig = {
        label: "Imported ADK Agent",
        description: "Test import",
        agent_config: {
          agent_type: "adk",
          adk_config: { name: "imported_agent", description: "From file" },
          model: "gemini-1.5-pro"
        },
        type: "agent"
      };
      const file = new File([JSON.stringify(agentConfig)], "agent.json", { type: "application/json" });
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const fileInput = screen.getByTestId("import-agent-file-input");
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitForWithTimeout(() => {
        expect(showSuccess).toHaveBeenCalledWith(expect.stringContaining("Imported ADK Agent"));
      });
      expect(screen.getByText("Imported ADK Agent")).toBeInTheDocument();
    });
    it("should show error when importing invalid JSON", async () => {
      const file = new File(["invalid json {"], "agent.json", { type: "application/json" });
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const fileInput = screen.getByTestId("import-agent-file-input");
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalled();
      });
    });
    it("should show error when importing JSON without agent_config", async () => {
      const file = new File([JSON.stringify({ label: "No config" })], "agent.json", { type: "application/json" });
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const fileInput = screen.getByTestId("import-agent-file-input");
      fireEvent.change(fileInput, { target: { files: [file] } });
      await waitForWithTimeout(() => {
        expect(showError).toHaveBeenCalledWith("Invalid agent config: missing agent_config");
      });
    });
    it("should handle all categories being expanded", () => {
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const workflowToggle = screen.getByText("Workflow Nodes").closest("button");
      const dataToggle = screen.getByText("Data Nodes").closest("button");
      fireEvent.click(workflowToggle);
      fireEvent.click(dataToggle);
      expect(screen.getByText("Start")).toBeInTheDocument();
      expect(screen.getByText("Agent")).toBeInTheDocument();
      expect(screen.getByText("ADK Agent")).toBeInTheDocument();
      expect(screen.getByText("GCP Bucket")).toBeInTheDocument();
    });
    it("should handle all categories being collapsed", () => {
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const agentToggle = screen.getByText("Agent Nodes").closest("button");
      fireEvent.click(agentToggle);
      expect(screen.queryByText("Start")).not.toBeInTheDocument();
      expect(screen.queryByText("Agent")).not.toBeInTheDocument();
      expect(screen.queryByText("ADK Agent")).not.toBeInTheDocument();
      expect(screen.queryByText("GCP Bucket")).not.toBeInTheDocument();
    });
    it("should handle custom agent nodes with missing properties", () => {
      const customNodes = [
        { id: "custom-1" },
        // Missing label
        { label: "Custom 2" },
        // Missing id
        { id: "custom-3", label: "Custom 3", description: null }
      ];
      localStorage.setItem(STORAGE_KEYS.CUSTOM_AGENT_NODES, JSON.stringify(customNodes));
      render(/* @__PURE__ */ jsx(NodePanel, {}));
      const toggleButton = screen.getByText("Agent Nodes").closest("button");
      fireEvent.click(toggleButton);
      expect(screen.getByText("Node Palette")).toBeInTheDocument();
    });
  });
});

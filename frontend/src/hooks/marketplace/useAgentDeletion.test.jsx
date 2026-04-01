import { renderHook, act } from "@testing-library/react";
import { useAgentDeletion, useRepositoryAgentDeletion } from "./useAgentDeletion";
import { showError, showSuccess } from "../../utils/notifications";
import { showConfirm } from "../../utils/confirm";
import { logger } from "../../utils/logger";
import { STORAGE_KEYS } from "../../config/constants";
jest.mock("../../utils/notifications", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn()
}));
jest.mock("../../utils/confirm", () => ({
  showConfirm: jest.fn()
}));
jest.mock("../../utils/logger", () => ({
  logger: {
    debug: jest.fn(),
    error: jest.fn()
  }
}));
const mockShowError = showError;
const mockShowSuccess = showSuccess;
const mockShowConfirm = showConfirm;
const mockLoggerDebug = logger.debug;
describe("useAgentDeletion", () => {
  const mockStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn()
  };
  const mockSetAgents = jest.fn();
  const mockSetSelectedAgentIds = jest.fn();
  const mockSetRepositoryAgents = jest.fn();
  const mockSetSelectedRepositoryAgentIds = jest.fn();
  const mockAgents = [
    {
      id: "agent-1",
      name: "Test Agent",
      label: "Test Agent",
      description: "Test",
      category: "automation",
      tags: [],
      difficulty: "beginner",
      estimated_time: "5 min",
      agent_config: {},
      author_id: "user-1",
      author_name: "Test User"
    }
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    mockShowConfirm.mockResolvedValue(true);
    mockStorage.getItem.mockReset();
    mockStorage.setItem.mockReset();
    mockStorage.removeItem.mockReset();
  });
  describe("deleteSelectedAgents", () => {
    it("should return early when no agents selected", async () => {
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set());
      });
      expect(mockShowConfirm).not.toHaveBeenCalled();
    });
    it("should filter out official agents", async () => {
      const agents = [
        { ...mockAgents[0], id: "agent-1", is_official: true },
        { ...mockAgents[0], id: "agent-2", is_official: false, author_id: "user-1" }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Cannot delete 1 official agent(s)")
      );
    });
    it("should show error when user owns no agents", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-2" }
        // Different user
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalled();
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should show partial delete confirmation when user owns some agents", async () => {
      const agents = [
        { ...mockAgents[0], id: "agent-1", author_id: "user-1" },
        { ...mockAgents[0], id: "agent-2", author_id: "user-2" }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining("You can only delete 1 of 2 selected agent(s)"),
        expect.objectContaining({
          title: "Partial Delete",
          confirmText: "Delete",
          cancelText: "Cancel",
          type: "warning"
        })
      );
    });
    it("should delete agents successfully", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents));
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowConfirm).toHaveBeenCalled();
      expect(mockStorage.setItem).toHaveBeenCalled();
      expect(mockSetAgents).toHaveBeenCalled();
      expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(/* @__PURE__ */ new Set());
      expect(mockShowSuccess).toHaveBeenCalled();
    });
    it("should handle storage errors", async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete agents")
      );
    });
    it("should handle agents with no author_id", async () => {
      const agents = [
        { ...mockAgents[0], author_id: null }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalled();
    });
  });
  describe("deleteSelectedAgents", () => {
    beforeEach(() => {
      mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents));
    });
    it("should return early when no agents selected", async () => {
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set());
      });
      expect(mockShowConfirm).not.toHaveBeenCalled();
    });
    it("should filter out official agents", async () => {
      const agents = [
        { ...mockAgents[0], id: "agent-1", is_official: true },
        { ...mockAgents[0], id: "agent-2", is_official: false, author_id: "user-1" }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Cannot delete 1 official agent(s)")
      );
    });
    it("should return early when all selected are official", async () => {
      const agents = [
        { ...mockAgents[0], id: "agent-1", is_official: true }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalled();
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should show error when user owns no agents and no author_id", async () => {
      const agents = [
        { ...mockAgents[0], author_id: null }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("were published before author tracking was added")
      );
    });
    it("should show error when user owns no agents but agents have author_id", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-2" }
        // Different user
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("You can only delete agents that you published")
      );
    });
    it("should show partial delete confirmation when user owns some agents", async () => {
      const agents = [
        { ...mockAgents[0], id: "agent-1", author_id: "user-1" },
        { ...mockAgents[0], id: "agent-2", author_id: "user-2" }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining("You can only delete 1 of 2 selected agent(s)"),
        expect.objectContaining({
          title: "Partial Delete",
          confirmText: "Delete",
          cancelText: "Cancel",
          type: "warning"
        })
      );
    });
    it("should show full delete confirmation when user owns all agents", async () => {
      const agents = [
        { ...mockAgents[0], id: "agent-1", author_id: "user-1" },
        { ...mockAgents[0], id: "agent-2", author_id: "user-1" }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining("Are you sure you want to delete 2 selected agent(s)"),
        expect.objectContaining({
          title: "Delete Agents",
          confirmText: "Delete",
          cancelText: "Cancel",
          type: "danger"
        })
      );
    });
    it("should not delete when user cancels confirmation", async () => {
      mockShowConfirm.mockResolvedValue(false);
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should delete agents successfully", async () => {
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockStorage.setItem).toHaveBeenCalled();
      expect(mockSetAgents).toHaveBeenCalled();
      expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(/* @__PURE__ */ new Set());
      expect(mockShowSuccess).toHaveBeenCalledWith("Successfully deleted 1 agent(s)");
    });
    it("should handle missing storage", async () => {
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: null,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith("Storage not available");
    });
    it("should handle storage errors", async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete agents")
      );
    });
    it("should handle when publishedAgents is null", async () => {
      mockStorage.getItem.mockReturnValue(null);
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockStorage.setItem).not.toHaveBeenCalled();
    });
    it("should handle String conversion for author_id comparison", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "123" }
        // Number author_id (testing string conversion)
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "123", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowConfirm).toHaveBeenCalled();
    });
  });
  describe("deleteSelectedAgents edge cases", () => {
    it("should handle user.id as empty string", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-1" }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalled();
    });
    it("should handle author_id as null vs undefined", async () => {
      const agents = [
        { ...mockAgents[0], author_id: null },
        { ...mockAgents[0], id: "agent-2", author_id: void 0 }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("published before author tracking")
      );
    });
    it("should handle String conversion for numeric author_id", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "123" }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "123", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockSetAgents).toHaveBeenCalled();
    });
    it("should handle publishedAgents as empty string", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-1" }
      ];
      mockStorage.getItem.mockReturnValue("");
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockSetAgents).not.toHaveBeenCalled();
    });
    it("should handle JSON.parse throwing error", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-1" }
      ];
      mockStorage.getItem.mockReturnValue("invalid json");
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete agents")
      );
    });
    it("should handle error without message property", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-1" }
      ];
      mockStorage.getItem.mockImplementation(() => {
        throw { toString: () => "Error without message" };
      });
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Unknown error")
      );
    });
  });
  describe("mutation killers for deleteSelectedAgents", () => {
    it("should verify selectedAgentIds.size === 0 early return", async () => {
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: mockAgents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set());
      });
      expect(mockShowError).not.toHaveBeenCalled();
      expect(mockShowConfirm).not.toHaveBeenCalled();
      expect(mockSetAgents).not.toHaveBeenCalled();
    });
    it("should verify agents.filter is called with correct predicate", async () => {
      const agents = [
        { ...mockAgents[0], id: "agent-1" },
        { ...mockAgents[0], id: "agent-2" }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowConfirm).toHaveBeenCalled();
      const confirmCall = mockShowConfirm.mock.calls[0][0];
      expect(confirmCall).toContain("1 selected agent");
    });
    it("should verify officialAgents.length > 0 boundary (exactly 0)", async () => {
      const agents = [
        { ...mockAgents[0], is_official: false }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).not.toHaveBeenCalledWith(
        expect.stringContaining("official agent")
      );
    });
    it("should verify officialAgents.length > 0 boundary (exactly 1)", async () => {
      const agents = [
        { ...mockAgents[0], is_official: true }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("official agent")
      );
    });
    it("should verify deletableAgents.length === 0 check", async () => {
      const agents = [
        { ...mockAgents[0], is_official: true }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowConfirm).not.toHaveBeenCalled();
      expect(mockSetAgents).not.toHaveBeenCalled();
    });
    it("should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length === 0 and officialAgents.length > 0", async () => {
      const agents = [
        { ...mockAgents[0], author_id: null, is_official: false },
        { ...mockAgents[0], id: "agent-2", author_id: null, is_official: true }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        "Selected agents were published before author tracking was added or are official. Please republish them to enable deletion."
      );
    });
    it("should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length === 0 and officialAgents.length === 0", async () => {
      const agents = [
        { ...mockAgents[0], author_id: null, is_official: false }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        "Selected agents were published before author tracking was added. Please republish them to enable deletion."
      );
    });
    it("should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length > 0 and officialAgents.length > 0", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-2", is_official: false },
        { ...mockAgents[0], id: "agent-2", author_id: "user-2", is_official: true }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("You can only delete agents that you published (official agents cannot be deleted)")
      );
    });
    it("should verify userOwnedAgents.length === 0 path with agentsWithAuthorId.length > 0 and officialAgents.length === 0", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-2", is_official: false }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("You can only delete agents that you published")
      );
      expect(mockShowError).not.toHaveBeenCalledWith(
        expect.stringContaining("official agents cannot be deleted")
      );
    });
    it("should verify userOwnedAgents filter logic with !user check", async () => {
      const agents = [
        { ...mockAgents[0] }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: null,
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalled();
    });
    it("should verify userOwnedAgents filter logic with !a.author_id check", async () => {
      const agents = [
        { ...mockAgents[0], author_id: null }
      ];
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalled();
    });
    it("should verify userOwnedAgents.length < deletableAgents.length path", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-1" },
        { ...mockAgents[0], id: "agent-2", author_id: "user-2" }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining("You can only delete 1 of 2 selected agent(s)"),
        expect.any(Object)
      );
    });
    it("should verify userOwnedAgents.length === deletableAgents.length path", async () => {
      const agents = [
        { ...mockAgents[0], author_id: "user-1" }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining("Are you sure you want to delete 1 selected agent(s)"),
        expect.any(Object)
      );
    });
    it("should verify setAgents filter predicate is called correctly", async () => {
      const agents = [
        { ...mockAgents[0], id: "agent-1", author_id: "user-1" },
        { ...mockAgents[0], id: "agent-2", author_id: "user-1" },
        { ...mockAgents[0], id: "agent-3", author_id: "user-2" }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2", "agent-3"]));
      });
      expect(mockSetAgents).toHaveBeenCalled();
      const setAgentsCall = mockSetAgents.mock.calls[0][0];
      const filteredAgents = typeof setAgentsCall === "function" ? setAgentsCall(agents) : setAgentsCall;
      expect(filteredAgents.length).toBe(1);
      expect(filteredAgents[0].id).toBe("agent-3");
    });
    it("should return early when extractAgentIds returns empty Set (agents without valid IDs)", async () => {
      const agentsWithoutIds = [
        {
          ...mockAgents[0],
          id: null,
          // Invalid ID
          author_id: "user-1"
        },
        {
          ...mockAgents[0],
          id: void 0,
          // Invalid ID
          author_id: "user-1"
        },
        {
          ...mockAgents[0],
          id: "",
          // Empty string ID
          author_id: "user-1"
        }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agentsWithoutIds));
      const { result } = renderHook(
        () => useAgentDeletion({
          user: { id: "user-1", username: "testuser" },
          storage: mockStorage,
          agents: agentsWithoutIds,
          setAgents: mockSetAgents,
          setSelectedAgentIds: mockSetSelectedAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set([null, void 0, ""]));
      });
      expect(mockStorage.setItem).not.toHaveBeenCalled();
      expect(mockSetAgents).not.toHaveBeenCalled();
      expect(mockSetSelectedAgentIds).not.toHaveBeenCalled();
    });
  });
  describe("deleteSelectedRepositoryAgents", () => {
    it("should return early when no agents selected", async () => {
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set());
      });
      expect(mockShowConfirm).not.toHaveBeenCalled();
    });
    it("should handle missing storage", async () => {
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: null,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith("Storage not available");
    });
    it("should delete repository agents successfully", async () => {
      mockStorage.getItem.mockReturnValue(JSON.stringify(mockAgents));
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowConfirm).toHaveBeenCalled();
      expect(mockStorage.setItem).toHaveBeenCalled();
      expect(mockSetRepositoryAgents).toHaveBeenCalled();
      expect(mockShowSuccess).toHaveBeenCalled();
    });
    it("should handle storage errors", async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw new Error("Storage error");
      });
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete repository agents")
      );
    });
  });
  describe("deleteSelectedRepositoryAgents edge cases", () => {
    it("should handle onRefresh as undefined", async () => {
      const agents = [
        { ...mockAgents[0] }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]), void 0);
      });
      expect(mockSetRepositoryAgents).toHaveBeenCalled();
    });
    it("should handle repositoryAgents as empty string", async () => {
      mockStorage.getItem.mockReturnValue("");
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockSetRepositoryAgents).not.toHaveBeenCalled();
    });
    it("should handle JSON.parse throwing error", async () => {
      mockStorage.getItem.mockReturnValue("invalid json");
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete repository agents")
      );
    });
    it("should handle error without message property", async () => {
      mockStorage.getItem.mockImplementation(() => {
        throw { toString: () => "Error without message" };
      });
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Unknown error")
      );
    });
  });
  describe("mutation killers for deleteSelectedRepositoryAgents", () => {
    it("should verify selectedRepositoryAgentIds.size === 0 early return", async () => {
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set());
      });
      expect(mockShowError).not.toHaveBeenCalled();
      expect(mockShowConfirm).not.toHaveBeenCalled();
      expect(mockSetRepositoryAgents).not.toHaveBeenCalled();
    });
    it("should verify exact showSuccess message content", async () => {
      const agents = [
        { ...mockAgents[0] }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
      });
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Successfully deleted 1 agent(s)"
      );
    });
    it("should verify onRefresh callback is called when provided", async () => {
      const agents = [
        { ...mockAgents[0] }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      mockShowConfirm.mockResolvedValue(true);
      const mockOnRefresh = jest.fn();
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]), mockOnRefresh);
      });
      expect(mockOnRefresh).toHaveBeenCalled();
    });
    it("should verify setRepositoryAgents filter predicate is called correctly", async () => {
      const agents = [
        { ...mockAgents[0], id: "agent-1" },
        { ...mockAgents[0], id: "agent-2" },
        { ...mockAgents[0], id: "agent-3" }
      ];
      mockStorage.getItem.mockReturnValue(JSON.stringify(agents));
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(
        () => useRepositoryAgentDeletion({
          storage: mockStorage,
          setRepositoryAgents: mockSetRepositoryAgents,
          setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
        })
      );
      await act(async () => {
        await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
      });
      expect(mockSetRepositoryAgents).toHaveBeenCalled();
      const setRepositoryAgentsCall = mockSetRepositoryAgents.mock.calls[0][0];
      const filteredAgents = typeof setRepositoryAgentsCall === "function" ? setRepositoryAgentsCall(agents) : setRepositoryAgentsCall;
      expect(filteredAgents.length).toBe(1);
      expect(filteredAgents[0].id).toBe("agent-3");
    });
  });
  describe("mutation killers for deleteSelectedAgents", () => {
    describe("String conversion edge cases", () => {
      describe("String(author_id) conversion", () => {
        it("should verify exact String conversion - author_id is number", () => {
          const user = { id: "123", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "123" }
            // number
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact String conversion - author_id is string", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
            // string
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact String conversion - author_id is null", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: null }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      describe("String(user.id) conversion", () => {
        it("should verify exact String conversion - user.id is number", () => {
          const user = { id: 123, username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "123" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact String conversion - user.id is empty string", () => {
          const user = { id: "", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
      });
    });
    describe("Storage edge cases", () => {
      describe("storage.getItem() return values", () => {
        it("should verify exact null check - storage.getItem returns null", () => {
          const user = { id: "user-1", username: "test" };
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents: mockAgents,
              setAgents: jest.fn(),
              setSelectedAgentIds: jest.fn()
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockStorage.setItem).not.toHaveBeenCalled();
        });
        it("should verify exact empty string check - storage.getItem returns empty string", () => {
          const user = { id: "user-1", username: "test" };
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents: mockAgents,
              setAgents: jest.fn(),
              setSelectedAgentIds: jest.fn()
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockStorage.setItem).not.toHaveBeenCalled();
        });
      });
    });
    describe("Boundary conditions", () => {
      describe("officialAgents.length === 0 vs > 0", () => {
        it("should verify exact length check - officialAgents.length === 0", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact length check - officialAgents.length > 0", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: true, author_id: null },
            { ...mockAgents[0], id: "agent-2", name: "Agent 2", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
          });
          expect(mockShowError).toHaveBeenCalledWith(
            expect.stringContaining("Cannot delete")
          );
        });
      });
      describe("userOwnedAgents.length === deletableAgents.length", () => {
        it("should verify exact length comparison - equal", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" },
            { ...mockAgents[0], id: "agent-2", name: "Agent 2", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
          });
          expect(mockShowConfirm).toHaveBeenCalledWith(
            expect.stringContaining("Are you sure"),
            expect.any(Object)
          );
        });
        it("should verify exact length comparison - less than", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" },
            { ...mockAgents[0], id: "agent-2", name: "Agent 2", is_official: false, author_id: "user-2" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
          });
          expect(mockShowConfirm).toHaveBeenCalledWith(
            expect.stringContaining("only delete 1 of 2"),
            expect.any(Object)
          );
        });
      });
    });
    describe("Logical operators", () => {
      describe("user && a.author_id && user.id", () => {
        it("should verify exact AND - all true", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact AND - user is null", () => {
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user: null,
              storage: mockStorage,
              agents,
              setAgents: jest.fn(),
              setSelectedAgentIds: jest.fn()
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
        it("should verify exact AND - author_id is null", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: null }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
        it("should verify exact AND - user.id is empty string", () => {
          const user = { id: "", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
      });
    });
  });
  describe("no-coverage paths for deleteSelectedAgents", () => {
    describe("deleteSelectedAgents - catch blocks", () => {
      it("should handle storage.getItem throwing error", async () => {
        mockStorage.getItem.mockImplementation(() => {
          throw new Error("Storage error");
        });
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "user-123",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to delete agents")
        );
      });
      it("should handle JSON.parse throwing error in deleteSelectedAgents", async () => {
        mockStorage.getItem.mockReturnValue("invalid json");
        const originalParse = JSON.parse;
        JSON.parse = jest.fn().mockImplementation(() => {
          throw new Error("Invalid JSON");
        });
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "user-123",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to delete agents")
        );
        JSON.parse = originalParse;
      });
    });
  });
  describe("branch coverage for deleteSelectedAgents", () => {
    describe("deleteSelectedAgents - official agents branches", () => {
      it("should show error and return early when all selected agents are official", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: true,
                author_id: null
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith("Cannot delete 1 official agent(s). Official agents cannot be deleted.");
        expect(mockStorage.getItem).not.toHaveBeenCalled();
      });
      it("should show error but continue when some agents are official", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-2", name: "User Agent", author_id: "user-123", is_official: false }
        ]));
        mockShowConfirm.mockResolvedValue(true);
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: true,
                author_id: null
              },
              {
                ...mockAgents[0],
                id: "agent-2",
                name: "User Agent",
                author_id: "user-123",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
        });
        expect(showError).toHaveBeenCalledWith("Cannot delete 1 official agent(s). Official agents cannot be deleted.");
        expect(mockStorage.getItem).toHaveBeenCalled();
      });
    });
    describe("deleteSelectedAgents - no user owned agents branches", () => {
      it("should show error when no agents have author_id and no official agents", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: null,
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith("Selected agents were published before author tracking was added. Please republish them to enable deletion.");
      });
      it("should show error when no agents have author_id and official agents exist", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: null,
                is_official: false
              },
              {
                ...mockAgents[0],
                id: "agent-2",
                name: "Official Agent",
                is_official: true,
                author_id: null
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
        });
        expect(showError).toHaveBeenCalledWith("Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.");
      });
      it("should show error when agents have author_id but none match user", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "other-user",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith("You can only delete agents that you published. 1 selected, 1 have author info, but none match your user ID.");
      });
      it("should show error when agents have author_id but none match user and official agents exist", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "other-user",
                is_official: false
              },
              {
                ...mockAgents[0],
                id: "agent-2",
                name: "Official Agent",
                is_official: true,
                author_id: null
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
        });
        expect(showError).toHaveBeenCalledWith("You can only delete agents that you published (official agents cannot be deleted). 1 selected, 1 have author info, but none match your user ID.");
      });
    });
    describe("deleteSelectedAgents - confirmation cancellation branches", () => {
      it("should return early when partial delete confirmation is cancelled", async () => {
        showConfirm.mockResolvedValue(false);
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "user-123",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
        });
        expect(mockStorage.getItem).not.toHaveBeenCalled();
      });
      it("should return early when full delete confirmation is cancelled", async () => {
        showConfirm.mockResolvedValue(false);
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "User Agent", author_id: "user-123", is_official: false }
        ]));
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "user-123",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockStorage.getItem).not.toHaveBeenCalled();
      });
    });
    describe("deleteSelectedAgents - storage branches", () => {
      it("should show error when storage is not available", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "User Agent", author_id: "user-123", is_official: false }
        ]));
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: null,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "user-123",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith("Storage not available");
      });
      it("should successfully delete agents when storage has publishedAgents", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "User Agent", author_id: "user-123", is_official: false },
          { id: "agent-2", name: "Other Agent", author_id: "other-user", is_official: false }
        ]));
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "user-123",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockStorage.setItem).toHaveBeenCalledWith("publishedAgents", expect.stringContaining("agent-2"));
        expect(mockSetAgents).toHaveBeenCalled();
        expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(/* @__PURE__ */ new Set());
        expect(showSuccess).toHaveBeenCalledWith("Successfully deleted 1 agent(s)");
      });
      it("should handle when storage.getItem returns null", async () => {
        mockStorage.getItem.mockReturnValue(null);
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "user-123",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockStorage.setItem).not.toHaveBeenCalled();
      });
      it("should handle agent with falsy id in userOwnedAgents array", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "User Agent", author_id: "user-123", is_official: false }
        ]));
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                author_id: "user-123",
                is_official: false
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", ""]));
        });
        expect(mockStorage.setItem).toHaveBeenCalled();
        expect(showSuccess).toHaveBeenCalled();
      });
    });
  });
  describe("mutation killers for deleteSelectedRepositoryAgents", () => {
  });
  describe("no-coverage paths for deleteSelectedRepositoryAgents", () => {
    describe("deleteSelectedRepositoryAgents - catch blocks", () => {
      it("should handle storage operations throwing error", async () => {
        mockStorage.getItem.mockImplementation(() => {
          throw new Error("Storage error");
        });
        const { result } = renderHook(
          () => useRepositoryAgentDeletion({
            storage: mockStorage,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to delete repository agents")
        );
      });
    });
  });
  describe("branch coverage for deleteSelectedRepositoryAgents", () => {
    describe("deleteSelectedRepositoryAgents - storage branches", () => {
      it("should show error when storage is not available", async () => {
        const { result } = renderHook(
          () => useRepositoryAgentDeletion({
            storage: null,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith("Storage not available");
      });
      it("should successfully delete repository agents and call onRefresh", async () => {
        const mockOnRefresh = jest.fn();
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "Repository Agent", author_id: "user-123", is_official: false },
          { id: "agent-2", name: "Other Agent", author_id: "other-user", is_official: false }
        ]));
        const { result } = renderHook(
          () => useRepositoryAgentDeletion({
            storage: mockStorage,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]), mockOnRefresh);
        });
        expect(mockStorage.setItem).toHaveBeenCalledWith(
          STORAGE_KEYS.REPOSITORY_AGENTS,
          expect.stringContaining("agent-2")
        );
        expect(mockSetRepositoryAgents).toHaveBeenCalled();
        expect(mockSetSelectedRepositoryAgentIds).toHaveBeenCalledWith(/* @__PURE__ */ new Set());
        expect(showSuccess).toHaveBeenCalledWith("Successfully deleted 1 agent(s)");
        expect(mockOnRefresh).toHaveBeenCalled();
      });
      it("should successfully delete repository agents without onRefresh", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "Repository Agent", author_id: "user-123", is_official: false }
        ]));
        const { result } = renderHook(
          () => useRepositoryAgentDeletion({
            storage: mockStorage,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockStorage.setItem).toHaveBeenCalled();
        expect(mockSetRepositoryAgents).toHaveBeenCalled();
        expect(showSuccess).toHaveBeenCalledWith("Successfully deleted 1 agent(s)");
      });
      it("should handle when storage.getItem returns null for repository agents", async () => {
        mockStorage.getItem.mockReturnValue(null);
        const { result } = renderHook(
          () => useRepositoryAgentDeletion({
            storage: mockStorage,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockStorage.setItem).not.toHaveBeenCalled();
      });
      it("should return early when confirmation is cancelled for repository agents", async () => {
        showConfirm.mockResolvedValue(false);
        const { result } = renderHook(
          () => useRepositoryAgentDeletion({
            storage: mockStorage,
            setRepositoryAgents: mockSetRepositoryAgents,
            setSelectedRepositoryAgentIds: mockSetSelectedRepositoryAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedRepositoryAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockStorage.getItem).not.toHaveBeenCalled();
      });
    });
    describe("String conversion edge cases", () => {
      describe("String(author_id) conversion", () => {
        it("should verify exact String conversion - author_id is number", () => {
          const user = { id: "123", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "123" }
            // number
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact String conversion - author_id is string", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
            // string
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact String conversion - author_id is null", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: null }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
      });
      describe("String(user.id) conversion", () => {
        it("should verify exact String conversion - user.id is number", () => {
          const user = { id: 123, username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "123" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact String conversion - user.id is empty string", () => {
          const user = { id: "", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
      });
    });
    describe("Storage edge cases", () => {
      describe("storage.getItem() return values", () => {
        it("should verify exact null check - storage.getItem returns null", () => {
          const user = { id: "user-1", username: "test" };
          mockStorage.getItem.mockReturnValue(null);
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents: mockAgents,
              setAgents: jest.fn(),
              setSelectedAgentIds: jest.fn()
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockStorage.setItem).not.toHaveBeenCalled();
        });
        it("should verify exact empty string check - storage.getItem returns empty string", () => {
          const user = { id: "user-1", username: "test" };
          mockStorage.getItem.mockReturnValue("");
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents: mockAgents,
              setAgents: jest.fn(),
              setSelectedAgentIds: jest.fn()
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockStorage.setItem).not.toHaveBeenCalled();
        });
      });
    });
    describe("Boundary conditions", () => {
      describe("officialAgents.length === 0 vs > 0", () => {
        it("should verify exact length check - officialAgents.length === 0", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact length check - officialAgents.length > 0", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: true, author_id: null },
            { ...mockAgents[0], id: "agent-2", name: "Agent 2", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
          });
          expect(mockShowError).toHaveBeenCalledWith(
            expect.stringContaining("Cannot delete")
          );
        });
      });
      describe("userOwnedAgents.length === deletableAgents.length", () => {
        it("should verify exact length comparison - equal", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" },
            { ...mockAgents[0], id: "agent-2", name: "Agent 2", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
          });
          expect(mockShowConfirm).toHaveBeenCalledWith(
            expect.stringContaining("Are you sure"),
            expect.any(Object)
          );
        });
        it("should verify exact length comparison - less than", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" },
            { ...mockAgents[0], id: "agent-2", name: "Agent 2", is_official: false, author_id: "user-2" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
          });
          expect(mockShowConfirm).toHaveBeenCalledWith(
            expect.stringContaining("only delete 1 of 2"),
            expect.any(Object)
          );
        });
      });
    });
    describe("Logical operators", () => {
      describe("user && a.author_id && user.id", () => {
        it("should verify exact AND - all true", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowConfirm).toHaveBeenCalled();
        });
        it("should verify exact AND - user is null", () => {
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user: null,
              storage: mockStorage,
              agents,
              setAgents: jest.fn(),
              setSelectedAgentIds: jest.fn()
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
        it("should verify exact AND - author_id is null", () => {
          const user = { id: "user-1", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: null }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
        it("should verify exact AND - user.id is empty string", () => {
          const user = { id: "", username: "test" };
          const agents = [
            { ...mockAgents[0], id: "agent-1", name: "Agent 1", is_official: false, author_id: "user-1" }
          ];
          const { result } = renderHook(
            () => useAgentDeletion({
              user,
              storage: mockStorage,
              agents,
              setAgents: mockSetAgents,
              setSelectedAgentIds: mockSetSelectedAgentIds
            })
          );
          act(() => {
            result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
          });
          expect(mockShowError).toHaveBeenCalled();
        });
      });
    });
    describe("deleteSelectedAgents - catch blocks", () => {
      it("should handle storage.getItem throwing error", async () => {
        mockStorage.getItem.mockImplementation(() => {
          throw new Error("Storage error");
        });
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "user-123"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to delete agents")
        );
      });
      it("should handle JSON.parse throwing error in deleteSelectedAgents", async () => {
        mockStorage.getItem.mockReturnValue("invalid json");
        const originalParse = JSON.parse;
        JSON.parse = jest.fn().mockImplementation(() => {
          throw new Error("Invalid JSON");
        });
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "user-123"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockShowError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to delete agents")
        );
        JSON.parse = originalParse;
      });
    });
    describe("deleteSelectedAgents - official agents branches", () => {
      it("should show error and return early when all selected agents are official", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: true,
                author_id: null
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith("Cannot delete 1 official agent(s). Official agents cannot be deleted.");
        expect(mockStorage.getItem).not.toHaveBeenCalled();
      });
      it("should show error but continue when some agents are official", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-2", name: "User Agent", author_id: "user-123", is_official: false }
        ]));
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: true,
                author_id: null
              },
              {
                ...mockAgents[0],
                id: "agent-2",
                name: "User Agent",
                is_official: false,
                author_id: "user-123"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
        });
        expect(showError).toHaveBeenCalledWith("Cannot delete 1 official agent(s). Official agents cannot be deleted.");
        expect(mockStorage.getItem).toHaveBeenCalled();
      });
    });
    describe("deleteSelectedAgents - no user owned agents branches", () => {
      it("should show error when no agents have author_id and no official agents", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: null
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith("Selected agents were published before author tracking was added. Please republish them to enable deletion.");
      });
      it("should show error when no agents have author_id and official agents exist", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: null
              },
              {
                ...mockAgents[0],
                id: "agent-2",
                name: "Official Agent",
                is_official: true,
                author_id: null
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
        });
        expect(showError).toHaveBeenCalledWith("Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.");
      });
      it("should show error when agents have author_id but none match user", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "other-user"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith("You can only delete agents that you published. 1 selected, 1 have author info, but none match your user ID.");
      });
      it("should show error when agents have author_id but none match user and official agents exist", async () => {
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "other-user"
              },
              {
                ...mockAgents[0],
                id: "agent-2",
                name: "Official Agent",
                is_official: true,
                author_id: null
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
        });
        expect(showError).toHaveBeenCalledWith("You can only delete agents that you published (official agents cannot be deleted). 1 selected, 1 have author info, but none match your user ID.");
      });
    });
    describe("deleteSelectedAgents - confirmation cancellation branches", () => {
      it("should return early when partial delete confirmation is cancelled", async () => {
        showConfirm.mockResolvedValue(false);
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "user-123"
              },
              {
                ...mockAgents[0],
                id: "agent-2",
                name: "Other Agent",
                is_official: false,
                author_id: "other-user"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", "agent-2"]));
        });
        expect(mockStorage.getItem).not.toHaveBeenCalled();
      });
      it("should return early when full delete confirmation is cancelled", async () => {
        showConfirm.mockResolvedValue(false);
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "User Agent", author_id: "user-123", is_official: false }
        ]));
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "user-123"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockStorage.getItem).not.toHaveBeenCalled();
      });
    });
    describe("deleteSelectedAgents - storage branches", () => {
      it("should show error when storage is not available", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "User Agent", author_id: "user-123", is_official: false }
        ]));
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: null,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "user-123"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(showError).toHaveBeenCalledWith("Storage not available");
      });
      it("should successfully delete agents when storage has publishedAgents", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "User Agent", author_id: "user-123", is_official: false },
          { id: "agent-2", name: "Other Agent", author_id: "other-user", is_official: false }
        ]));
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "user-123"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockStorage.setItem).toHaveBeenCalledWith("publishedAgents", expect.stringContaining("agent-2"));
        expect(mockSetAgents).toHaveBeenCalled();
        expect(mockSetSelectedAgentIds).toHaveBeenCalledWith(/* @__PURE__ */ new Set());
        expect(showSuccess).toHaveBeenCalledWith("Successfully deleted 1 agent(s)");
      });
      it("should handle when storage.getItem returns null", async () => {
        mockStorage.getItem.mockReturnValue(null);
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "user-123"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1"]));
        });
        expect(mockStorage.setItem).not.toHaveBeenCalled();
      });
      it("should handle agent with falsy id in userOwnedAgents array", async () => {
        mockStorage.getItem.mockReturnValue(JSON.stringify([
          { id: "agent-1", name: "User Agent", author_id: "user-123", is_official: false }
        ]));
        const { result } = renderHook(
          () => useAgentDeletion({
            user: { id: "user-123", username: "test" },
            storage: mockStorage,
            agents: [
              {
                ...mockAgents[0],
                id: "agent-1",
                name: "Test Agent",
                is_official: false,
                author_id: "user-123"
              }
            ],
            setAgents: mockSetAgents,
            setSelectedAgentIds: mockSetSelectedAgentIds
          })
        );
        await act(async () => {
          await result.current.deleteSelectedAgents(/* @__PURE__ */ new Set(["agent-1", ""]));
        });
        expect(mockStorage.setItem).toHaveBeenCalled();
        expect(showSuccess).toHaveBeenCalled();
      });
    });
  });
});

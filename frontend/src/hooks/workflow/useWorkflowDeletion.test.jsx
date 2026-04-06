import { renderHook, act } from "@testing-library/react";
import { useWorkflowDeletion } from "./useWorkflowDeletion";
import { showError, showSuccess } from "../../utils/notifications";
import { showConfirm } from "../../utils/confirm";
import { api } from "../../api/client";
jest.mock("../../utils/notifications", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
}));
jest.mock("../../utils/confirm", () => ({
  showConfirm: jest.fn(),
}));
jest.mock("../../api/client", () => ({
  api: {
    deleteTemplate: jest.fn(),
  },
}));
const mockShowError = showError;
const mockShowSuccess = showSuccess;
const mockShowConfirm = showConfirm;
const mockDeleteTemplate = api.deleteTemplate;
describe("useWorkflowDeletion", () => {
  const mockSetTemplates = jest.fn();
  const mockSetWorkflowsOfWorkflows = jest.fn();
  const mockSetSelectedTemplateIds = jest.fn();
  const mockTemplates = [
    {
      id: "template-1",
      name: "Test Template",
      description: "Test",
      category: "automation",
      tags: [],
      difficulty: "beginner",
      estimated_time: "5 min",
      is_official: false,
      uses_count: 0,
      likes_count: 0,
      rating: 0,
      author_id: "user-1",
      author_name: "Test User",
    },
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    mockShowConfirm.mockResolvedValue(true);
    mockDeleteTemplate.mockResolvedValue(void 0);
  });
  describe("deleteSelectedWorkflows", () => {
    it("should return early when no templates selected", async () => {
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: mockTemplates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set());
      });
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
    it("should filter out official workflows", async () => {
      const officialTemplates = [
        { ...mockTemplates[0], id: "template-1", is_official: true },
        {
          ...mockTemplates[0],
          id: "template-2",
          is_official: false,
          author_id: "user-1",
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: officialTemplates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1", "template-2"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Cannot delete 1 official workflow(s)"),
      );
      expect(mockDeleteTemplate).toHaveBeenCalledWith("template-2");
    });
    it("should show error when user owns no templates", async () => {
      const testTemplates = [
        { ...mockTemplates[0], author_id: "user-2" },
        // Different user
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: testTemplates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        "You can only delete workflows that you published",
      );
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
    it("should show error when user owns no templates and official templates exist", async () => {
      const testTemplates = [
        { ...mockTemplates[0], id: "template-1", is_official: true },
        { ...mockTemplates[0], id: "template-2", author_id: "user-2" },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: testTemplates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1", "template-2"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        "You can only delete workflows that you published (official workflows cannot be deleted)",
      );
    });
    it("should show partial delete confirmation when user owns some templates", async () => {
      const testTemplates = [
        { ...mockTemplates[0], id: "template-1", author_id: "user-1" },
        { ...mockTemplates[0], id: "template-2", author_id: "user-2" },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: testTemplates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1", "template-2"]),
        );
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining(
          "You can only delete 1 of 2 selected workflow(s)",
        ),
        expect.objectContaining({
          title: "Partial Delete",
          confirmText: "Delete",
          cancelText: "Cancel",
          type: "warning",
        }),
      );
    });
    it("should show full delete confirmation when user owns all templates", async () => {
      const testTemplates = [
        { ...mockTemplates[0], id: "template-1", author_id: "user-1" },
        { ...mockTemplates[0], id: "template-2", author_id: "user-1" },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: testTemplates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1", "template-2"]),
        );
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining(
          "Are you sure you want to delete 2 selected workflow(s)",
        ),
        expect.objectContaining({
          title: "Delete Workflows",
          confirmText: "Delete",
          cancelText: "Cancel",
          type: "danger",
        }),
      );
    });
    it("should not delete when user cancels confirmation", async () => {
      mockShowConfirm.mockResolvedValue(false);
      const templates = [
        { ...mockTemplates[0], id: "template-1", author_id: "user-1" },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
    it("should delete workflows successfully", async () => {
      const templates = [
        { ...mockTemplates[0], id: "template-1", author_id: "user-1" },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockDeleteTemplate).toHaveBeenCalledWith("template-1");
      expect(mockSetTemplates).toHaveBeenCalled();
      expect(mockSetSelectedTemplateIds).toHaveBeenCalledWith(
        new Set(),
      );
      expect(mockShowSuccess).toHaveBeenCalledWith(
        "Successfully deleted 1 workflow(s)",
      );
    });
    it("should handle delete error", async () => {
      mockDeleteTemplate.mockRejectedValue(new Error("Delete failed"));
      const templates = [
        { ...mockTemplates[0], id: "template-1", author_id: "user-1" },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete workflows"),
      );
    });
    it("should use workflowsOfWorkflows when activeTab is workflows-of-workflows", async () => {
      const workflowsOfWorkflows = [
        { ...mockTemplates[0], id: "template-1", author_id: "user-1" },
      ];
      mockDeleteTemplate.mockResolvedValue(void 0);
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: [],
          workflowsOfWorkflows,
          activeTab: "workflows-of-workflows",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockDeleteTemplate).toHaveBeenCalledWith("template-1");
    });
    it("should handle String conversion for author_id comparison", async () => {
      const templates = [
        { ...mockTemplates[0], id: "template-1", author_id: 123 },
        // Number author_id
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "123", username: "testuser" },
          templates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockDeleteTemplate).toHaveBeenCalledWith("template-1");
    });
    it("should return early when all selected are official", async () => {
      const templates = [
        { ...mockTemplates[0], id: "template-1", is_official: true },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        "Cannot delete 1 official workflow(s). Official workflows cannot be deleted.",
      );
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
  });
  describe("deleteSelectedWorkflows edge cases", () => {
    it("should handle activeTab as workflows-of-workflows", async () => {
      const workflows = [{ ...mockTemplates[0], author_id: "user-1" }];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: [],
          workflowsOfWorkflows: workflows,
          activeTab: "workflows-of-workflows",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockDeleteTemplate).toHaveBeenCalled();
    });
    it("should handle String conversion for numeric author_id in workflows", async () => {
      const workflows = [{ ...mockTemplates[0], author_id: 123 }];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "123", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockDeleteTemplate).toHaveBeenCalled();
    });
    it("should handle Promise.all with partial errors", async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: "user-1" },
        { ...mockTemplates[0], id: "template-2", author_id: "user-1" },
      ];
      mockDeleteTemplate
        .mockResolvedValueOnce(void 0)
        .mockRejectedValueOnce(new Error("Delete failed"));
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1", "template-2"]),
        );
      });
      expect(mockShowError).toHaveBeenCalled();
    });
    it("should handle error.response.data.detail as null", async () => {
      const workflows = [{ ...mockTemplates[0], author_id: "user-1" }];
      const error = new Error("Delete failed");
      error.response = { data: { detail: null } };
      mockDeleteTemplate.mockRejectedValue(error);
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Failed to delete workflows"),
      );
    });
    it("should handle error without message property", async () => {
      const workflows = [{ ...mockTemplates[0], author_id: "user-1" }];
      const error = {};
      mockDeleteTemplate.mockRejectedValue(error);
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Unknown error"),
      );
    });
  });
  describe("mutation killers for deleteSelectedWorkflows", () => {
    it("should verify selectedTemplateIds.size === 0 early return", async () => {
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: mockTemplates,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(new Set());
      });
      expect(mockShowError).not.toHaveBeenCalled();
      expect(mockShowConfirm).not.toHaveBeenCalled();
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
    it("should verify activeTab === workflows-of-workflows branch", async () => {
      const workflows = [{ ...mockTemplates[0], author_id: "user-1" }];
      mockDeleteTemplate.mockResolvedValue(void 0);
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: [],
          workflowsOfWorkflows: workflows,
          activeTab: "workflows-of-workflows",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockDeleteTemplate).toHaveBeenCalled();
    });
    it("should verify officialTemplates.length > 0 boundary (exactly 0)", async () => {
      const workflows = [{ ...mockTemplates[0], is_official: false }];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowError).not.toHaveBeenCalledWith(
        expect.stringContaining("official workflow"),
      );
    });
    it("should verify officialTemplates.length > 0 boundary (exactly 1)", async () => {
      const workflows = [{ ...mockTemplates[0], is_official: true }];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("official workflow"),
      );
    });
    it("should verify deletableTemplates.length === 0 check", async () => {
      const workflows = [{ ...mockTemplates[0], is_official: true }];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowConfirm).not.toHaveBeenCalled();
      expect(mockDeleteTemplate).not.toHaveBeenCalled();
    });
    it("should verify userOwnedTemplates.length === 0 path with officialTemplates.length > 0", async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: "user-2", is_official: false },
        {
          ...mockTemplates[0],
          id: "template-2",
          author_id: "user-2",
          is_official: true,
        },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1", "template-2"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        "You can only delete workflows that you published (official workflows cannot be deleted)",
      );
    });
    it("should verify userOwnedTemplates.length === 0 path with officialTemplates.length === 0", async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: "user-2", is_official: false },
      ];
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        "You can only delete workflows that you published",
      );
    });
    it("should verify userOwnedTemplates.length < deletableTemplates.length path", async () => {
      const workflows = [
        { ...mockTemplates[0], author_id: "user-1" },
        { ...mockTemplates[0], id: "template-2", author_id: "user-2" },
      ];
      mockDeleteTemplate.mockResolvedValue(void 0);
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1", "template-2"]),
        );
      });
      expect(mockShowConfirm).toHaveBeenCalledWith(
        expect.stringContaining(
          "You can only delete 1 of 2 selected workflow(s)",
        ),
        expect.any(Object),
      );
    });
    it("should verify setTemplates and setWorkflowsOfWorkflows filters are called correctly", async () => {
      const workflows = [
        { ...mockTemplates[0], id: "template-1", author_id: "user-1" },
        { ...mockTemplates[0], id: "template-2", author_id: "user-1" },
      ];
      mockDeleteTemplate.mockResolvedValue(void 0);
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1", "template-2"]),
        );
      });
      expect(mockSetTemplates).toHaveBeenCalled();
      expect(mockSetWorkflowsOfWorkflows).toHaveBeenCalled();
      const setTemplatesCall = mockSetTemplates.mock.calls[0][0];
      const filteredTemplates =
        typeof setTemplatesCall === "function"
          ? setTemplatesCall(workflows)
          : setTemplatesCall;
      expect(filteredTemplates.length).toBe(0);
    });
    it("should verify error handling with error.response.data.detail", async () => {
      const workflows = [{ ...mockTemplates[0], author_id: "user-1" }];
      const error = new Error("Delete failed");
      error.response = { data: { detail: "Custom error detail" } };
      mockDeleteTemplate.mockRejectedValue(error);
      mockShowConfirm.mockResolvedValue(true);
      const { result } = renderHook(() =>
        useWorkflowDeletion({
          user: { id: "user-1", username: "testuser" },
          templates: workflows,
          workflowsOfWorkflows: [],
          activeTab: "repository",
          setTemplates: mockSetTemplates,
          setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
          setSelectedTemplateIds: mockSetSelectedTemplateIds,
        }),
      );
      await act(async () => {
        await result.current.deleteSelectedWorkflows(
          new Set(["template-1"]),
        );
      });
      expect(mockShowError).toHaveBeenCalledWith(
        expect.stringContaining("Custom error detail"),
      );
    });
  });
  describe("mutation killers for deleteSelectedWorkflows", () => {
    describe("Error object structure variations", () => {
      describe("deleteSelectedWorkflows error handling", () => {
        it("should verify error.response - error without response property", async () => {
          const user = { id: "user-1", username: "test" };
          const error = new Error("Network error");
          mockDeleteTemplate.mockRejectedValue(error);
          const { result } = renderHook(() =>
            useWorkflowDeletion({
              user,
              templates: mockTemplates,
              workflowsOfWorkflows: [],
              activeTab: "repository",
              setTemplates: jest.fn(),
              setWorkflowsOfWorkflows: jest.fn(),
              setSelectedTemplateIds: jest.fn(),
            }),
          );
          await act(async () => {
            await result.current.deleteSelectedWorkflows(
              new Set(["template-1"]),
              "repository",
            );
          });
          expect(mockShowError).toHaveBeenCalledWith(
            expect.stringContaining("Network error"),
          );
        });
        it("should verify error.response.data - response without data property", async () => {
          const user = { id: "user-1", username: "test" };
          const error = new Error("API error");
          error.response = { status: 500 };
          mockDeleteTemplate.mockRejectedValue(error);
          const { result } = renderHook(() =>
            useWorkflowDeletion({
              user,
              templates: mockTemplates,
              workflowsOfWorkflows: [],
              activeTab: "repository",
              setTemplates: jest.fn(),
              setWorkflowsOfWorkflows: jest.fn(),
              setSelectedTemplateIds: jest.fn(),
            }),
          );
          await act(async () => {
            await result.current.deleteSelectedWorkflows(
              new Set(["template-1"]),
              "repository",
            );
          });
          expect(mockShowError).toHaveBeenCalledWith(
            expect.stringContaining("API error"),
          );
        });
        it("should verify error.response.data.detail - data without detail property", async () => {
          const user = { id: "user-1", username: "test" };
          const error = new Error("API error");
          error.response = { data: { message: "Error occurred" } };
          mockDeleteTemplate.mockRejectedValue(error);
          const { result } = renderHook(() =>
            useWorkflowDeletion({
              user,
              templates: mockTemplates,
              workflowsOfWorkflows: [],
              activeTab: "repository",
              setTemplates: jest.fn(),
              setWorkflowsOfWorkflows: jest.fn(),
              setSelectedTemplateIds: jest.fn(),
            }),
          );
          await act(async () => {
            await result.current.deleteSelectedWorkflows(
              new Set(["template-1"]),
              "repository",
            );
          });
          expect(mockShowError).toHaveBeenCalledWith(
            expect.stringContaining("Error occurred"),
          );
        });
        it("should verify error.response.data.detail - detail is null", async () => {
          const user = { id: "user-1", username: "test" };
          const error = new Error("API error");
          error.response = { data: { detail: null } };
          mockDeleteTemplate.mockRejectedValue(error);
          const { result } = renderHook(() =>
            useWorkflowDeletion({
              user,
              templates: mockTemplates,
              workflowsOfWorkflows: [],
              activeTab: "repository",
              setTemplates: jest.fn(),
              setWorkflowsOfWorkflows: jest.fn(),
              setSelectedTemplateIds: jest.fn(),
            }),
          );
          await act(async () => {
            await result.current.deleteSelectedWorkflows(
              new Set(["template-1"]),
              "repository",
            );
          });
          expect(mockShowError).toHaveBeenCalledWith(
            expect.stringContaining("API error"),
          );
        });
        it("should verify error.response.data.detail - detail exists", async () => {
          const user = { id: "user-1", username: "test" };
          const error = new Error("API error");
          error.response = { data: { detail: "Template not found" } };
          mockDeleteTemplate.mockRejectedValue(error);
          mockShowConfirm.mockResolvedValue(true);
          const { result } = renderHook(() =>
            useWorkflowDeletion({
              user,
              templates: mockTemplates,
              workflowsOfWorkflows: [],
              activeTab: "repository",
              setTemplates: jest.fn(),
              setWorkflowsOfWorkflows: jest.fn(),
              setSelectedTemplateIds: jest.fn(),
            }),
          );
          await act(async () => {
            await result.current.deleteSelectedWorkflows(
              new Set(["template-1"]),
              "repository",
            );
          });
          expect(mockShowError).toHaveBeenCalledWith(
            expect.stringContaining("Template not found"),
          );
        });
      });
    });
  });
  describe("no-coverage paths for deleteSelectedWorkflows", () => {
    describe("deleteSelectedWorkflows - catch blocks", () => {
      it("should handle api.deleteTemplate throwing error", async () => {
        const mockDeleteTemplate2 = api.deleteTemplate;
        mockDeleteTemplate2.mockRejectedValue(new Error("Network error"));
        mockShowConfirm.mockResolvedValue(true);
        const { result } = renderHook(() =>
          useWorkflowDeletion({
            user: { id: "user-123", username: "test" },
            templates: [
              {
                id: "template-1",
                author_id: "user-123",
              },
            ],
            workflowsOfWorkflows: [],
            activeTab: "agents",
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
          }),
        );
        await act(async () => {
          await result.current.deleteSelectedWorkflows(
            new Set(["template-1"]),
          );
        });
        expect(showError).toHaveBeenCalledWith(
          expect.stringContaining("Failed to delete workflows"),
        );
      });
    });
  });
  describe("branch coverage for deleteSelectedWorkflows", () => {
    describe("deleteSelectedWorkflows - official templates branches", () => {
      it("should show error and return early when all selected workflows are official", async () => {
        const { result } = renderHook(() =>
          useWorkflowDeletion({
            user: { id: "user-123", username: "test" },
            templates: [
              {
                id: "template-1",
                is_official: true,
              },
            ],
            workflowsOfWorkflows: [],
            activeTab: "repository",
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
          }),
        );
        await act(async () => {
          await result.current.deleteSelectedWorkflows(
            new Set(["template-1"]),
          );
        });
        expect(showError).toHaveBeenCalledWith(
          "Cannot delete 1 official workflow(s). Official workflows cannot be deleted.",
        );
        expect(api.deleteTemplate).not.toHaveBeenCalled();
      });
    });
    describe("deleteSelectedWorkflows - no user owned templates branches", () => {
      it("should show error when no templates match user and official templates exist", async () => {
        const { result } = renderHook(() =>
          useWorkflowDeletion({
            user: { id: "user-123", username: "test" },
            templates: [
              {
                id: "template-1",
                author_id: "other-user",
                // Not owned by user-123
                is_official: false,
              },
              {
                id: "template-2",
                author_id: "other-user",
                is_official: true,
                // Official template
              },
            ],
            workflowsOfWorkflows: [],
            activeTab: "repository",
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
          }),
        );
        await act(async () => {
          await result.current.deleteSelectedWorkflows(
            new Set(["template-1", "template-2"]),
          );
        });
        expect(showError).toHaveBeenCalledWith(
          "You can only delete workflows that you published (official workflows cannot be deleted)",
        );
      });
      it("should show error when no templates match user and no official templates", async () => {
        const { result } = renderHook(() =>
          useWorkflowDeletion({
            user: { id: "user-123", username: "test" },
            templates: [
              {
                id: "template-1",
              },
            ],
            workflowsOfWorkflows: [],
            activeTab: "repository",
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
          }),
        );
        await act(async () => {
          await result.current.deleteSelectedWorkflows(
            new Set(["template-1"]),
          );
        });
        expect(showError).toHaveBeenCalledWith(
          "You can only delete workflows that you published",
        );
      });
    });
    describe("deleteSelectedWorkflows - confirmation cancellation branches", () => {
      it("should return early when partial delete confirmation is cancelled", async () => {
        showConfirm.mockResolvedValue(false);
        const { result } = renderHook(() =>
          useWorkflowDeletion({
            user: { id: "user-123", username: "test" },
            templates: [
              {
                id: "template-1",
              },
            ],
            workflowsOfWorkflows: [],
            activeTab: "repository",
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
          }),
        );
        await act(async () => {
          await result.current.deleteSelectedWorkflows(
            new Set(["template-1", "template-2"]),
          );
        });
        expect(api.deleteTemplate).not.toHaveBeenCalled();
      });
      it("should return early when full delete confirmation is cancelled", async () => {
        showConfirm.mockResolvedValue(false);
        const { result } = renderHook(() =>
          useWorkflowDeletion({
            user: { id: "user-123", username: "test" },
            templates: [
              {
                id: "template-1",
              },
            ],
            workflowsOfWorkflows: [],
            activeTab: "repository",
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
          }),
        );
        await act(async () => {
          await result.current.deleteSelectedWorkflows(
            new Set(["template-1"]),
          );
        });
        expect(api.deleteTemplate).not.toHaveBeenCalled();
      });
    });
    describe("deleteSelectedWorkflows - successful deletion branches", () => {
      it("should successfully delete workflows and update state", async () => {
        const mockDeleteTemplate2 = api.deleteTemplate;
        mockDeleteTemplate2.mockResolvedValue(void 0);
        const { result } = renderHook(() =>
          useWorkflowDeletion({
            user: { id: "user-123", username: "test" },
            templates: [
              {
                id: "template-1",
                author_id: "user-123",
                // Must match user id for filterUserOwnedDeletableItems
                is_official: false,
              },
            ],
            workflowsOfWorkflows: [],
            activeTab: "repository",
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
          }),
        );
        await act(async () => {
          await result.current.deleteSelectedWorkflows(
            new Set(["template-1"]),
          );
        });
        expect(mockDeleteTemplate2).toHaveBeenCalledWith("template-1");
        expect(mockSetTemplates).toHaveBeenCalled();
        expect(mockSetWorkflowsOfWorkflows).toHaveBeenCalled();
        expect(mockSetSelectedTemplateIds).toHaveBeenCalledWith(
          new Set(),
        );
        expect(showSuccess).toHaveBeenCalledWith(
          "Successfully deleted 1 workflow(s)",
        );
      });
      it("should use workflowsOfWorkflows when activeTab is workflows-of-workflows", async () => {
        const mockDeleteTemplate2 = api.deleteTemplate;
        mockDeleteTemplate2.mockResolvedValue(void 0);
        const { result } = renderHook(() =>
          useWorkflowDeletion({
            user: { id: "user-123", username: "test" },
            templates: [],
            workflowsOfWorkflows: [
              {
                id: "template-1",
                author_id: "user-123",
                // Must match user id for filterUserOwnedDeletableItems
                is_official: false,
              },
            ],
            activeTab: "workflows-of-workflows",
            setTemplates: mockSetTemplates,
            setWorkflowsOfWorkflows: mockSetWorkflowsOfWorkflows,
            setSelectedTemplateIds: mockSetSelectedTemplateIds,
          }),
        );
        await act(async () => {
          await result.current.deleteSelectedWorkflows(
            new Set(["template-1"]),
          );
        });
        expect(mockDeleteTemplate2).toHaveBeenCalledWith("template-1");
        expect(mockSetWorkflowsOfWorkflows).toHaveBeenCalled();
      });
    });
  });
});

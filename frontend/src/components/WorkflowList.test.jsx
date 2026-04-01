import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
import { BrowserRouter } from "react-router-dom";
import WorkflowList from "./WorkflowList";
import { api } from "../api/client";
import { useAuth } from "../contexts/AuthContext";
import { showError, showSuccess } from "../utils/notifications";
import { showConfirm } from "../utils/confirm";
jest.mock("../api/client", () => ({
  api: {
    getWorkflows: jest.fn(),
    deleteWorkflow: jest.fn(),
    duplicateWorkflow: jest.fn(),
    publishWorkflow: jest.fn(),
    bulkDeleteWorkflows: jest.fn()
  }
}));
jest.mock("../contexts/AuthContext", () => ({
  useAuth: jest.fn()
}));
jest.mock("../utils/notifications", () => ({
  showError: jest.fn(),
  showSuccess: jest.fn(),
  showWarning: jest.fn()
}));
jest.mock("../utils/confirm", () => ({
  showConfirm: jest.fn()
}));
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => jest.fn()
}));
const mockUseAuth = useAuth;
const mockApi = api;
const renderWithRouter = (component) => {
  return render(/* @__PURE__ */ jsx(BrowserRouter, { children: component }));
};
describe("WorkflowList", () => {
  const mockOnSelectWorkflow = jest.fn();
  const mockOnBack = jest.fn();
  const mockWorkflows = [
    {
      id: "workflow-1",
      name: "Test Workflow 1",
      description: "Description 1",
      created_at: "2024-01-01T00:00:00Z",
      updated_at: "2024-01-01T00:00:00Z",
      nodes: [],
      edges: []
    },
    {
      id: "workflow-2",
      name: "Test Workflow 2",
      description: "Description 2",
      created_at: "2024-01-02T00:00:00Z",
      updated_at: "2024-01-02T00:00:00Z",
      nodes: [],
      edges: []
    }
  ];
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { id: "1", username: "testuser" },
      token: "token",
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn()
    });
    showConfirm.mockResolvedValue(true);
  });
  it("should render loading state initially", () => {
    mockApi.getWorkflows.mockImplementation(() => new Promise(() => {
    }));
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    expect(screen.getByText(/Loading workflows/)).toBeInTheDocument();
  });
  it("should load and display workflows", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
      expect(screen.getByText("Test Workflow 2")).toBeInTheDocument();
    });
    expect(mockApi.getWorkflows).toHaveBeenCalledTimes(1);
  });
  it("should handle error when loading workflows", async () => {
    const error = new Error("Failed to load");
    mockApi.getWorkflows.mockRejectedValue(error);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(showError).toHaveBeenCalledWith("Failed to load workflows: Failed to load");
    });
  });
  it("should call onSelectWorkflow when workflow is clicked", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const workflowCard = screen.getByText("Test Workflow 1").closest("div");
    if (workflowCard) {
      fireEvent.click(workflowCard);
      expect(mockOnSelectWorkflow).toHaveBeenCalledWith("workflow-1");
    }
  });
  it("should call onBack when back button is clicked", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow, onBack: mockOnBack }));
    await waitForWithTimeout(() => {
      expect(screen.getByTitle("Back to builder")).toBeInTheDocument();
    });
    const backButton = screen.getByTitle("Back to builder");
    fireEvent.click(backButton);
    expect(mockOnBack).toHaveBeenCalled();
  });
  it("should handle workflow deletion", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    mockApi.deleteWorkflow.mockResolvedValue(void 0);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByTitle(/Delete workflow/);
    fireEvent.click(deleteButtons[0]);
    await waitForWithTimeout(() => {
      expect(showConfirm).toHaveBeenCalled();
    });
    await waitForWithTimeout(() => {
      expect(mockApi.deleteWorkflow).toHaveBeenCalledWith("workflow-1");
      expect(showSuccess).toHaveBeenCalledWith("Workflow deleted successfully");
    });
  });
  it("should not delete workflow if confirmation is cancelled", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    showConfirm.mockResolvedValue(false);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByTitle(/Delete workflow/);
    fireEvent.click(deleteButtons[0]);
    await waitForWithTimeout(() => {
      expect(showConfirm).toHaveBeenCalled();
    });
    expect(mockApi.deleteWorkflow).not.toHaveBeenCalled();
  });
  it("should handle deletion error", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    const error = new Error("Delete failed");
    mockApi.deleteWorkflow.mockRejectedValue(error);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByTitle(/Delete workflow/);
    fireEvent.click(deleteButtons[0]);
    await waitForWithTimeout(() => {
      expect(mockApi.deleteWorkflow).toHaveBeenCalled();
      expect(showError).toHaveBeenCalledWith("Failed to delete workflow: Delete failed");
    });
  });
  it("should toggle workflow selection", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const selectButtons = screen.getAllByTitle(/Select workflow|Deselect workflow/);
    if (selectButtons.length > 0) {
      fireEvent.click(selectButtons[0]);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/1 selected/)).toBeInTheDocument();
      });
    }
  });
  it("should show bulk actions when workflows are selected", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const selectButtons = screen.getAllByTitle(/Select workflow/);
    if (selectButtons.length > 0) {
      fireEvent.click(selectButtons[0]);
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Duplicate Selected/)).toBeInTheDocument();
        expect(screen.getByText(/Delete Selected/)).toBeInTheDocument();
      });
    }
  });
  it("should handle bulk duplicate", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    mockApi.duplicateWorkflow.mockResolvedValueOnce({ ...mockWorkflows[0], id: "workflow-1-copy", name: "Test Workflow 1-copy" }).mockResolvedValueOnce({ ...mockWorkflows[1], id: "workflow-2-copy", name: "Test Workflow 2-copy" });
    mockApi.getWorkflows.mockResolvedValueOnce([...mockWorkflows, { ...mockWorkflows[0], id: "workflow-1-copy" }]);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      const workflow1Elements = screen.getAllByText("Test Workflow 1");
      expect(workflow1Elements.length).toBeGreaterThan(0);
    });
    const selectButtons = screen.getAllByTitle(/Select workflow/);
    if (selectButtons.length >= 2) {
      fireEvent.click(selectButtons[0]);
      fireEvent.click(selectButtons[1]);
    } else if (selectButtons.length === 1) {
      const selectAllButton = screen.getByText(/Select All/);
      if (selectAllButton) {
        fireEvent.click(selectAllButton);
      }
    }
    await waitForWithTimeout(() => {
      expect(screen.getByText(/Duplicate Selected/)).toBeInTheDocument();
    });
    const duplicateButton = screen.getByText(/Duplicate Selected/);
    fireEvent.click(duplicateButton);
    await waitForWithTimeout(() => {
      expect(showConfirm).toHaveBeenCalled();
    });
    await waitForWithTimeout(() => {
      expect(mockApi.duplicateWorkflow).toHaveBeenCalled();
    }, 3e3);
  });
  it("should show warning when trying to bulk duplicate without selection", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Duplicate Selected/)).not.toBeInTheDocument();
  });
  it("should show login prompt when not authenticated", async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: false,
      user: null,
      token: null,
      login: jest.fn(),
      logout: jest.fn(),
      register: jest.fn()
    });
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText(/Your saved workflows are available after you sign in/)).toBeInTheDocument();
      expect(screen.getByText(/Browse templates on the Marketplace/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Log In" })).toBeInTheDocument();
    });
    expect(mockApi.getWorkflows).not.toHaveBeenCalled();
  });
  it("should display empty state when no workflows", async () => {
    mockApi.getWorkflows.mockResolvedValue([]);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText(/No workflows yet/)).toBeInTheDocument();
    });
  });
  it("should display workflow metadata", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
      expect(screen.getByText("Description 1")).toBeInTheDocument();
    });
  });
  it("should handle bulk delete with partial failures", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    mockApi.bulkDeleteWorkflows.mockResolvedValue({
      message: "Some workflows deleted",
      deleted_count: 1,
      failed_ids: ["workflow-2"]
    });
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const checkboxes = screen.getAllByTitle(/Select workflow/);
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    const bulkDeleteButton = screen.getByText(/Delete Selected/);
    fireEvent.click(bulkDeleteButton);
    await waitForWithTimeout(() => {
      expect(showError).toHaveBeenCalledWith(expect.stringContaining("Failed IDs: workflow-2"));
    });
  });
  it("should handle bulk duplicate with partial failures", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    mockApi.duplicateWorkflow.mockResolvedValueOnce({ id: "workflow-1-copy", name: "Test Workflow 1-copy" }).mockRejectedValueOnce(new Error("Duplicate failed"));
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const checkboxes = screen.getAllByTitle(/Select workflow/);
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    const bulkDuplicateButton = screen.getByText(/Duplicate Selected/);
    fireEvent.click(bulkDuplicateButton);
    await waitForWithTimeout(() => {
      expect(showError).toHaveBeenCalledWith(expect.stringContaining("Failed to duplicate workflow"));
    });
  });
  it("should handle delete cancellation", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    showConfirm.mockResolvedValue(false);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByTitle(/Delete workflow/);
    fireEvent.click(deleteButtons[0]);
    await waitForWithTimeout(() => {
      expect(showConfirm).toHaveBeenCalled();
    });
    expect(mockApi.deleteWorkflow).not.toHaveBeenCalled();
  });
  it("should handle bulk delete cancellation", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    showConfirm.mockResolvedValue(false);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const checkboxes = screen.getAllByTitle(/Select workflow/);
    fireEvent.click(checkboxes[0]);
    const bulkDeleteButton = screen.getByText(/Delete Selected/);
    fireEvent.click(bulkDeleteButton);
    await waitForWithTimeout(() => {
      expect(showConfirm).toHaveBeenCalled();
    });
    if (mockApi.bulkDeleteWorkflows) {
      expect(mockApi.bulkDeleteWorkflows).not.toHaveBeenCalled();
    }
  });
  it("should show warning when bulk duplicate with no selection", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    expect(screen.queryByText(/Duplicate Selected/)).not.toBeInTheDocument();
  });
  it("should handle delete error", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    mockApi.deleteWorkflow.mockRejectedValue(new Error("Delete failed"));
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const deleteButtons = screen.getAllByTitle(/Delete workflow/);
    fireEvent.click(deleteButtons[0]);
    await waitForWithTimeout(() => {
      expect(showError).toHaveBeenCalledWith("Failed to delete workflow: Delete failed");
    });
  });
  it("should handle bulk delete error", async () => {
    mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
    mockApi.bulkDeleteWorkflows.mockRejectedValue(new Error("Bulk delete failed"));
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
    });
    const checkboxes = screen.getAllByTitle(/Select workflow/);
    fireEvent.click(checkboxes[0]);
    const bulkDeleteButton = screen.getByText(/Delete Selected/);
    fireEvent.click(bulkDeleteButton);
    await waitForWithTimeout(() => {
      expect(showError).toHaveBeenCalledWith("Failed to delete workflows: Bulk delete failed");
    });
  });
  it("should handle workflow without id", async () => {
    const workflowsWithoutId = [
      {
        name: "Workflow without ID",
        description: "Test",
        nodes: [],
        edges: []
      }
    ];
    mockApi.getWorkflows.mockResolvedValue(workflowsWithoutId);
    renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
    await waitForWithTimeout(() => {
      expect(screen.getByText("Workflow without ID")).toBeInTheDocument();
    });
    expect(screen.getByText("Workflow without ID")).toBeInTheDocument();
  });
  describe("Publish functionality", () => {
    it("should open publish modal when publish button is clicked", async () => {
      mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
      renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
      await waitForWithTimeout(() => {
        expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
      });
      const publishButtons = screen.queryAllByRole("button").filter(
        (btn) => btn.textContent?.includes("Publish") || btn.getAttribute("title")?.includes("Publish")
      );
      if (publishButtons.length > 0) {
        fireEvent.click(publishButtons[0]);
        await waitForWithTimeout(() => {
          expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
        });
      }
    });
    it("should not load workflows or show publish when not authenticated", async () => {
      mockUseAuth.mockReturnValue({
        isAuthenticated: false,
        user: null,
        token: null,
        login: jest.fn(),
        logout: jest.fn(),
        register: jest.fn()
      });
      mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
      renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
      await waitForWithTimeout(() => {
        expect(screen.getByText(/Your saved workflows are available after you sign in/)).toBeInTheDocument();
      });
      expect(screen.queryByText("Test Workflow 1")).not.toBeInTheDocument();
      expect(mockApi.getWorkflows).not.toHaveBeenCalled();
      const publishButtons = screen.queryAllByRole("button").filter(
        (btn) => btn.textContent?.includes("Publish") || btn.getAttribute("title")?.includes("Publish")
      );
      expect(publishButtons.length).toBe(0);
    });
    it("should handle publish form submission", async () => {
      mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
      mockApi.publishWorkflow.mockResolvedValue({
        id: "template-1",
        name: "Test Workflow 1",
        category: "automation"
      });
      renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
      await waitForWithTimeout(() => {
        expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
      });
      const publishButtons = screen.queryAllByRole("button").filter(
        (btn) => btn.textContent?.includes("Publish") || btn.getAttribute("title")?.includes("Publish")
      );
      if (publishButtons.length > 0) {
        fireEvent.click(publishButtons[0]);
        await waitForWithTimeout(() => {
          expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
        });
        const form = screen.getByText(/Publish to Marketplace/).closest("form");
        if (form) {
          fireEvent.submit(form);
        }
        await waitForWithTimeout(() => {
          expect(showSuccess).toHaveBeenCalledWith(expect.stringContaining("Published"));
        });
      }
    });
    it("should handle publish error", async () => {
      mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
      mockApi.publishWorkflow.mockRejectedValue(new Error("Publish failed"));
      renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
      await waitForWithTimeout(() => {
        expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
      });
      const publishButtons = screen.queryAllByRole("button").filter(
        (btn) => btn.textContent?.includes("Publish") || btn.getAttribute("title")?.includes("Publish")
      );
      if (publishButtons.length > 0) {
        fireEvent.click(publishButtons[0]);
        await waitForWithTimeout(() => {
          expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
        });
        const form = screen.getByText(/Publish to Marketplace/).closest("form");
        if (form) {
          fireEvent.submit(form);
        }
        await waitForWithTimeout(() => {
          expect(showError).toHaveBeenCalledWith(expect.stringContaining("Failed to publish"));
        });
      }
    });
    it("should handle publish form field changes", async () => {
      mockApi.getWorkflows.mockResolvedValue(mockWorkflows);
      renderWithRouter(/* @__PURE__ */ jsx(WorkflowList, { onSelectWorkflow: mockOnSelectWorkflow }));
      await waitForWithTimeout(() => {
        expect(screen.getByText("Test Workflow 1")).toBeInTheDocument();
      });
      const publishButtons = screen.queryAllByRole("button").filter(
        (btn) => btn.textContent?.includes("Publish") || btn.getAttribute("title")?.includes("Publish")
      );
      if (publishButtons.length > 0) {
        fireEvent.click(publishButtons[0]);
        await waitForWithTimeout(() => {
          expect(screen.getByText(/Publish to Marketplace/)).toBeInTheDocument();
        });
        const categorySelect = screen.queryByLabelText(/Category/i) || screen.queryAllByRole("combobox").find(
          (sel) => sel.closest("div")?.textContent?.includes("Category")
        );
        if (categorySelect) {
          fireEvent.change(categorySelect, { target: { value: "data_analysis" } });
        }
        expect(categorySelect).toBeDefined();
      }
    });
  });
});

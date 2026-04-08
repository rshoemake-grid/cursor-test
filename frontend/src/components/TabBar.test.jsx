import { createRef } from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { TabBar } from "./TabBar";
describe("TabBar", () => {
  const mockTabs = [
    {
      id: "tab-1",
      name: "Workflow 1",
      isUnsaved: false,
    },
    {
      id: "tab-2",
      name: "Workflow 2",
      isUnsaved: true,
    },
    {
      id: "tab-3",
      name: "Workflow 3",
      isUnsaved: false,
    },
  ];
  const mockProps = {
    tabs: mockTabs,
    tabState: {
      activeTabId: "tab-1",
      editingTabId: null,
      editingName: "",
    },
    tabActions: {
      setActiveTabId: jest.fn(),
      setEditingName: jest.fn(),
      startEditingTabName: jest.fn(),
      handleCloseTab: jest.fn(),
    },
    inputProps: {
      editingInputRef: createRef(),
      onBlur: jest.fn(),
      onKeyDown: jest.fn(),
    },
    workflowActions: {
      onNew: jest.fn(),
      onSave: jest.fn(),
      onClear: jest.fn(),
      onExecute: jest.fn(),
      onPublish: jest.fn(),
      onExport: jest.fn(),
    },
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render all tabs", () => {
    render(<TabBar {...mockProps} />);
    expect(screen.getByText("Workflow 1")).toBeInTheDocument();
    expect(screen.getByText("Workflow 2")).toBeInTheDocument();
    expect(screen.getByText("Workflow 3")).toBeInTheDocument();
  });
  it("should highlight active tab", () => {
    render(
      <TabBar
        {...mockProps}
        tabState={{ ...mockProps.tabState, activeTabId: "tab-2" }}
      />,
    );
    const tab2 = screen.getByText("Workflow 2").closest("button");
    expect(tab2).toHaveAttribute("data-active", "true");
  });
  it("should show unsaved indicator for unsaved tabs", () => {
    render(<TabBar {...mockProps} />);
    const tab2 = screen.getByText("Workflow 2").closest("button");
    const indicator = tab2?.querySelector(
      '[data-testid="tab-unsaved-indicator"]',
    );
    expect(indicator).toBeInTheDocument();
  });
  it("should call setActiveTabId when tab is clicked", () => {
    render(<TabBar {...mockProps} />);
    const tab2 = screen.getByText("Workflow 2");
    fireEvent.click(tab2);
    expect(mockProps.tabActions.setActiveTabId).toHaveBeenCalledWith("tab-2");
  });
  it("should call startEditingTabName when tab is double-clicked", () => {
    render(<TabBar {...mockProps} />);
    const tab2 = screen.getByText("Workflow 2");
    fireEvent.doubleClick(tab2);
    expect(mockProps.tabActions.startEditingTabName).toHaveBeenCalledWith(
      mockTabs[1],
      expect.any(Object),
    );
  });
  it("should show editing input when editingTabId matches", () => {
    render(
      <TabBar
        {...mockProps}
        tabState={{
          ...mockProps.tabState,
          editingTabId: "tab-2",
          editingName: "New Name",
        }}
      />,
    );
    const input = screen.getByDisplayValue("New Name");
    expect(input).toBeInTheDocument();
  });
  it("should call setEditingName when editing input changes", () => {
    render(
      <TabBar
        {...mockProps}
        tabState={{
          ...mockProps.tabState,
          editingTabId: "tab-2",
          editingName: "New Name",
        }}
      />,
    );
    const input = screen.getByDisplayValue("New Name");
    fireEvent.change(input, {
      target: {
        value: "Updated Name",
      },
    });
    expect(mockProps.tabActions.setEditingName).toHaveBeenCalledWith(
      "Updated Name",
    );
  });
  it("should call onBlur when editing input loses focus", () => {
    render(
      <TabBar
        {...mockProps}
        tabState={{
          ...mockProps.tabState,
          editingTabId: "tab-2",
          editingName: "New Name",
        }}
      />,
    );
    const input = screen.getByDisplayValue("New Name");
    fireEvent.blur(input);
    expect(mockProps.inputProps.onBlur).toHaveBeenCalledWith("tab-2");
  });
  it("should call onKeyDown when key is pressed in editing input", () => {
    render(
      <TabBar
        {...mockProps}
        tabState={{
          ...mockProps.tabState,
          editingTabId: "tab-2",
          editingName: "New Name",
        }}
      />,
    );
    const input = screen.getByDisplayValue("New Name");
    fireEvent.keyDown(input, {
      key: "Enter",
    });
    expect(mockProps.inputProps.onKeyDown).toHaveBeenCalledWith(
      "tab-2",
      expect.any(Object),
    );
  });
  it("should stop propagation when editing input is clicked", () => {
    render(
      <TabBar
        {...mockProps}
        tabState={{
          ...mockProps.tabState,
          editingTabId: "tab-2",
          editingName: "New Name",
        }}
      />,
    );
    const input = screen.getByDisplayValue("New Name");
    const onClick = jest.fn();
    input.addEventListener("click", onClick);
    fireEvent.click(input);
    expect(input).toBeInTheDocument();
  });
  it("should show close button on hover when tabs.length > 1", () => {
    render(<TabBar {...mockProps} />);
    const tab1 = screen.getByText("Workflow 1").closest("button");
    const closeButton = tab1?.querySelector('[data-tab-close="true"]');
    expect(closeButton).toBeInTheDocument();
  });
  it("should not show close button when tabs.length === 1", () => {
    render(<TabBar {...mockProps} tabs={[mockTabs[0]]} />);
    const tab1 = screen.getByText("Workflow 1").closest("button");
    const closeButton = tab1?.querySelector('[data-tab-close="true"]');
    expect(closeButton).not.toBeInTheDocument();
  });
  it("should call handleCloseTab when close button is clicked", () => {
    render(<TabBar {...mockProps} />);
    const tab1 = screen.getByText("Workflow 1").closest("button");
    const closeButton = tab1?.querySelector('[data-tab-close="true"]');
    if (closeButton) {
      fireEvent.click(closeButton);
      expect(mockProps.tabActions.handleCloseTab).toHaveBeenCalledWith(
        "tab-1",
        expect.any(Object),
      );
    }
  });
  it("should call handleCloseTab when Enter key is pressed on close button", () => {
    render(<TabBar {...mockProps} />);
    const tab1 = screen.getByText("Workflow 1").closest("button");
    const closeButton = tab1?.querySelector('[role="button"]');
    if (closeButton) {
      fireEvent.keyDown(closeButton, {
        key: "Enter",
      });
      expect(mockProps.tabActions.handleCloseTab).toHaveBeenCalled();
    }
  });
  it("should call handleCloseTab when Space key is pressed on close button", () => {
    render(<TabBar {...mockProps} />);
    const tab1 = screen.getByText("Workflow 1").closest("button");
    const closeButton = tab1?.querySelector('[role="button"]');
    if (closeButton) {
      fireEvent.keyDown(closeButton, {
        key: " ",
      });
      expect(mockProps.tabActions.handleCloseTab).toHaveBeenCalled();
    }
  });
  it("should call onSave when Save button is clicked", () => {
    render(<TabBar {...mockProps} />);
    const saveButton = screen.getByRole("button", {
      name: /save/i,
    });
    fireEvent.click(saveButton);
    expect(mockProps.workflowActions.onSave).toHaveBeenCalled();
  });
  it("should call onClear when Clear workflow button is clicked", () => {
    render(<TabBar {...mockProps} />);
    const clearButton = screen.getByRole("button", {
      name: /clear workflow/i,
    });
    fireEvent.click(clearButton);
    expect(mockProps.workflowActions.onClear).toHaveBeenCalled();
  });
  it("should call onExecute when Execute button is clicked", () => {
    render(<TabBar {...mockProps} />);
    const executeButton = screen.getByRole("button", {
      name: /execute/i,
    });
    fireEvent.click(executeButton);
    expect(mockProps.workflowActions.onExecute).toHaveBeenCalled();
  });
  it("should call onPublish when Publish button is clicked", () => {
    render(<TabBar {...mockProps} />);
    const publishButton = screen.getByRole("button", {
      name: /publish/i,
    });
    fireEvent.click(publishButton);
    expect(mockProps.workflowActions.onPublish).toHaveBeenCalled();
  });
  it("should call onExport when Export button is clicked", () => {
    render(<TabBar {...mockProps} />);
    const exportButton = screen.getByRole("button", {
      name: /export/i,
    });
    fireEvent.click(exportButton);
    expect(mockProps.workflowActions.onExport).toHaveBeenCalled();
  });
  it("should call onNew when New button is clicked", () => {
    render(<TabBar {...mockProps} />);
    const newButton = screen.getByRole("button", {
      name: /new/i,
    });
    fireEvent.click(newButton);
    expect(mockProps.workflowActions.onNew).toHaveBeenCalled();
  });
  it("should render tab names correctly", () => {
    render(<TabBar {...mockProps} />);
    mockTabs.forEach((tab) => {
      expect(screen.getByText(tab.name)).toBeInTheDocument();
    });
  });
  it("should handle empty tabs array", () => {
    render(<TabBar {...mockProps} tabs={[]} />);
    expect(screen.queryByText("Workflow 1")).not.toBeInTheDocument();
  });
});

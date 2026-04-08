import { render, screen } from "@testing-library/react";
import { MarketplaceTabContent } from "./MarketplaceTabContent";
import { TemplateGrid } from "../TemplateGrid";
jest.mock("../TemplateGrid", () => {
  const { jsx, jsxs } = require("react/jsx-runtime");
  return {
    TemplateGrid: jest.fn(({ items, emptyMessage, footerText }) => (
      <div data-testid="template-grid">
        {items.length === 0 && <div>{emptyMessage}</div>}
        {footerText && <div>{footerText}</div>}
        {items.map((item) => (
          <div key={item.id} data-testid={`item-${item.id}`}>
            {item.name || item.label}
          </div>
        ))}
      </div>
    )),
  };
});
describe("MarketplaceTabContent", () => {
  const mockAgents = [
    {
      id: "agent-1",
      name: "Agent 1",
      label: "Agent 1",
    },
    {
      id: "agent-2",
      name: "Agent 2",
      label: "Agent 2",
    },
  ];
  const mockTemplates = [
    {
      id: "template-1",
      name: "Template 1",
      description: "Description 1",
      category: "automation",
      difficulty: "beginner",
      estimated_time: "30 minutes",
      tags: [],
      is_official: false,
      uses_count: 0,
      likes_count: 0,
    },
  ];
  const mockRepositoryAgents = [
    {
      id: "repo-agent-1",
      name: "Repo Agent 1",
      label: "Repo Agent 1",
    },
  ];
  const mockWorkflowsOfWorkflows = [
    {
      id: "wof-1",
      name: "Workflow of Workflows 1",
      description: "Description",
      category: "automation",
      difficulty: "beginner",
      estimated_time: "30 minutes",
      tags: [],
      is_official: false,
      uses_count: 0,
      likes_count: 0,
    },
  ];
  const defaultProps = {
    viewState: {
      loading: false,
      activeTab: "agents",
      isAgentsTab: false,
      isRepositoryWorkflowsSubTab: false,
      isRepositoryAgentsSubTab: false,
    },
    catalog: {
      agents: mockAgents,
      templates: mockTemplates,
      repositoryAgents: mockRepositoryAgents,
      workflowsOfWorkflows: mockWorkflowsOfWorkflows,
    },
    selections: {
      agentSelection: {
        selectedIds: new Set(),
        toggle: jest.fn(),
      },
      templateSelection: {
        selectedIds: new Set(),
        toggle: jest.fn(),
      },
      repositoryAgentSelection: {
        selectedIds: new Set(),
        toggle: jest.fn(),
      },
    },
    cardHandlers: {
      handleAgentCardClick: jest.fn(),
      handleCardClick: jest.fn(),
      handleRepositoryAgentCardClick: jest.fn(),
    },
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should show loading state", () => {
    render(
      <MarketplaceTabContent
        {...defaultProps}
        viewState={{ ...defaultProps.viewState, loading: true }}
      />,
    );
    expect(screen.getByText(/Loading/)).toBeInTheDocument();
    expect(screen.queryByTestId("template-grid")).not.toBeInTheDocument();
  });
  it("should render agents tab content", () => {
    render(
      <MarketplaceTabContent
        {...defaultProps}
        viewState={{
          ...defaultProps.viewState,
          isAgentsTab: true,
          activeTab: "agents",
        }}
      />,
    );
    expect(TemplateGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        items: mockAgents,
        type: "agent",
        emptyMessage: "No agents found. Try adjusting your filters.",
        footerText: 'Selected - Click "Use Agent(s)" above to use',
      }),
      expect.anything(),
    );
  });
  it("should render repository workflows sub-tab content", () => {
    render(
      <MarketplaceTabContent
        {...defaultProps}
        viewState={{
          ...defaultProps.viewState,
          isRepositoryWorkflowsSubTab: true,
          activeTab: "repository",
        }}
      />,
    );
    expect(TemplateGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        items: mockTemplates,
        type: "template",
        emptyMessage: "No workflows found. Try adjusting your filters.",
        footerText: 'Selected - Click "Load Workflow(s)" above to use',
      }),
      expect.anything(),
    );
  });
  it("should render repository agents sub-tab content", () => {
    render(
      <MarketplaceTabContent
        {...defaultProps}
        viewState={{
          ...defaultProps.viewState,
          isRepositoryAgentsSubTab: true,
          activeTab: "repository",
        }}
      />,
    );
    expect(TemplateGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        items: mockRepositoryAgents,
        type: "agent",
        emptyMessage: "No repository agents found. Try adjusting your filters.",
        footerText: 'Selected - Click "Use Agent(s)" above to use',
      }),
      expect.anything(),
    );
  });
  it("should render workflows-of-workflows tab content by default", () => {
    render(
      <MarketplaceTabContent
        {...defaultProps}
        viewState={{
          ...defaultProps.viewState,
          activeTab: "workflows-of-workflows",
        }}
      />,
    );
    expect(TemplateGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        items: mockWorkflowsOfWorkflows,
        type: "template",
        emptyMessage: "No workflows found. Try adjusting your filters.",
        footerText: 'Selected - Click "Load Workflow(s)" above to use',
      }),
      expect.anything(),
    );
  });
  it("should handle null templates", () => {
    render(
      <MarketplaceTabContent
        {...defaultProps}
        viewState={{
          ...defaultProps.viewState,
          isRepositoryWorkflowsSubTab: true,
        }}
        catalog={{ ...defaultProps.catalog, templates: null }}
      />,
    );
    expect(TemplateGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        items: [],
      }),
      expect.anything(),
    );
  });
  it("should pass selection handlers correctly", () => {
    const mockToggle = jest.fn();
    render(
      <MarketplaceTabContent
        {...defaultProps}
        viewState={{ ...defaultProps.viewState, isAgentsTab: true }}
        selections={{
          ...defaultProps.selections,
          agentSelection: {
            selectedIds: new Set(["agent-1"]),
            toggle: mockToggle,
          },
        }}
      />,
    );
    expect(TemplateGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedIds: new Set(["agent-1"]),
        onToggleSelect: mockToggle,
      }),
      expect.anything(),
    );
  });
  it("should pass card click handlers correctly", () => {
    const mockHandleClick = jest.fn();
    render(
      <MarketplaceTabContent
        {...defaultProps}
        viewState={{ ...defaultProps.viewState, isAgentsTab: true }}
        cardHandlers={{
          ...defaultProps.cardHandlers,
          handleAgentCardClick: mockHandleClick,
        }}
      />,
    );
    expect(TemplateGrid).toHaveBeenCalledWith(
      expect.objectContaining({
        onCardClick: mockHandleClick,
      }),
      expect.anything(),
    );
  });
  it("should show correct loading message with active tab name", () => {
    render(
      <MarketplaceTabContent
        {...defaultProps}
        viewState={{
          ...defaultProps.viewState,
          loading: true,
          activeTab: "repository",
        }}
      />,
    );
    expect(screen.getByText("Loading repository...")).toBeInTheDocument();
  });
});

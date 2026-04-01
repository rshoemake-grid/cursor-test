import { jsx, jsxs } from "react/jsx-runtime";
import { memo } from "react";
import { TemplateGrid } from "../TemplateGrid";
const MarketplaceTabContent = memo(function MarketplaceTabContent2({
  loading,
  activeTab,
  isAgentsTab,
  isToolsTab = false,
  isRepositoryWorkflowsSubTab,
  isRepositoryAgentsSubTab,
  agents,
  tools = [],
  templates,
  repositoryAgents,
  workflowsOfWorkflows,
  agentSelection,
  toolSelection = { selectedIds: /* @__PURE__ */ new Set(), toggle: () => {
  } },
  templateSelection,
  repositoryAgentSelection,
  handleAgentCardClick,
  handleToolCardClick = () => {
  },
  handleCardClick,
  handleRepositoryAgentCardClick,
  getDifficultyColor
}) {
  if (loading) {
    return /* @__PURE__ */ jsxs("div", { className: "text-center py-12", children: [
      /* @__PURE__ */ jsx("div", { className: "inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" }),
      /* @__PURE__ */ jsxs("p", { className: "mt-4 text-gray-600", children: [
        "Loading ",
        activeTab,
        "..."
      ] })
    ] });
  }
  if (isAgentsTab) {
    return /* @__PURE__ */ jsx(
      TemplateGrid,
      {
        items: agents,
        selectedIds: agentSelection.selectedIds,
        type: "agent",
        onToggleSelect: agentSelection.toggle,
        onCardClick: handleAgentCardClick,
        getDifficultyColor,
        emptyMessage: "No agents found. Try adjusting your filters.",
        footerText: 'Selected - Click "Use Agent(s)" above to use'
      }
    );
  }
  if (isToolsTab) {
    return /* @__PURE__ */ jsx(
      TemplateGrid,
      {
        items: tools,
        selectedIds: toolSelection.selectedIds,
        type: "tool",
        onToggleSelect: toolSelection.toggle,
        onCardClick: handleToolCardClick,
        getDifficultyColor,
        emptyMessage: "No tools found. Publish tools from the workflow builder to share them here.",
        footerText: 'Selected - Click "Use Tool(s)" above to use'
      }
    );
  }
  if (isRepositoryWorkflowsSubTab) {
    return /* @__PURE__ */ jsx(
      TemplateGrid,
      {
        items: templates ?? [],
        selectedIds: templateSelection.selectedIds,
        type: "template",
        onToggleSelect: templateSelection.toggle,
        onCardClick: handleCardClick,
        getDifficultyColor,
        emptyMessage: "No workflows found. Try adjusting your filters.",
        footerText: 'Selected - Click "Load Workflow(s)" above to use'
      }
    );
  }
  if (isRepositoryAgentsSubTab) {
    return /* @__PURE__ */ jsx(
      TemplateGrid,
      {
        items: repositoryAgents,
        selectedIds: repositoryAgentSelection.selectedIds,
        type: "agent",
        onToggleSelect: repositoryAgentSelection.toggle,
        onCardClick: handleRepositoryAgentCardClick,
        getDifficultyColor,
        emptyMessage: "No repository agents found. Try adjusting your filters.",
        footerText: 'Selected - Click "Use Agent(s)" above to use'
      }
    );
  }
  return /* @__PURE__ */ jsx(
    TemplateGrid,
    {
      items: workflowsOfWorkflows,
      selectedIds: templateSelection.selectedIds,
      type: "template",
      onToggleSelect: templateSelection.toggle,
      onCardClick: handleCardClick,
      getDifficultyColor,
      emptyMessage: "No workflows found. Try adjusting your filters.",
      footerText: 'Selected - Click "Load Workflow(s)" above to use'
    }
  );
});
export {
  MarketplaceTabContent
};

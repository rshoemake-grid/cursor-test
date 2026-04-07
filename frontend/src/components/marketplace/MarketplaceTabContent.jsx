import { memo } from "react";
import { TemplateGrid } from "../TemplateGrid";
import {
  EmptyStateCentered,
  MarketplaceLoadingSpinner,
  EmptyStateBelowSpinner,
} from "../../styles/contentBlocks.styled";
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
  toolSelection = {
    selectedIds: new Set(),
    toggle: () => {},
  },
  templateSelection,
  repositoryAgentSelection,
  handleAgentCardClick,
  handleToolCardClick = () => {},
  handleCardClick,
  handleRepositoryAgentCardClick,
}) {
  if (loading) {
    return (
      <EmptyStateCentered>
        <MarketplaceLoadingSpinner aria-hidden />
        <EmptyStateBelowSpinner>Loading {activeTab}...</EmptyStateBelowSpinner>
      </EmptyStateCentered>
    );
  }
  if (isAgentsTab) {
    return (
      <TemplateGrid
        items={agents}
        selectedIds={agentSelection.selectedIds}
        type="agent"
        onToggleSelect={agentSelection.toggle}
        onCardClick={handleAgentCardClick}
        emptyMessage="No agents found. Try adjusting your filters."
        footerText={'Selected - Click "Use Agent(s)" above to use'}
      />
    );
  }
  if (isToolsTab) {
    return (
      <TemplateGrid
        items={tools}
        selectedIds={toolSelection.selectedIds}
        type="tool"
        onToggleSelect={toolSelection.toggle}
        onCardClick={handleToolCardClick}
        emptyMessage="No tools found. Publish tools from the workflow builder to share them here."
        footerText={'Selected - Click "Use Tool(s)" above to use'}
      />
    );
  }
  if (isRepositoryWorkflowsSubTab) {
    return (
      <TemplateGrid
        items={templates ?? []}
        selectedIds={templateSelection.selectedIds}
        type="template"
        onToggleSelect={templateSelection.toggle}
        onCardClick={handleCardClick}
        emptyMessage="No workflows found. Try adjusting your filters."
        footerText={'Selected - Click "Load Workflow(s)" above to use'}
      />
    );
  }
  if (isRepositoryAgentsSubTab) {
    return (
      <TemplateGrid
        items={repositoryAgents}
        selectedIds={repositoryAgentSelection.selectedIds}
        type="agent"
        onToggleSelect={repositoryAgentSelection.toggle}
        onCardClick={handleRepositoryAgentCardClick}
        emptyMessage="No repository agents found. Try adjusting your filters."
        footerText={'Selected - Click "Use Agent(s)" above to use'}
      />
    );
  }
  return (
    <TemplateGrid
      items={workflowsOfWorkflows}
      selectedIds={templateSelection.selectedIds}
      type="template"
      onToggleSelect={templateSelection.toggle}
      onCardClick={handleCardClick}
      emptyMessage="No workflows found. Try adjusting your filters."
      footerText={'Selected - Click "Load Workflow(s)" above to use'}
    />
  );
});
export { MarketplaceTabContent };

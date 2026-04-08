import { memo } from "react";
import PropTypes from "prop-types";
import { TemplateGrid } from "../TemplateGrid";
import {
  EmptyStateCentered,
  MarketplaceLoadingSpinner,
  EmptyStateBelowSpinner,
} from "../../styles/contentBlocks.styled";

const defaultToolSelection = {
  selectedIds: new Set(),
  toggle: () => {},
};

const MarketplaceTabContent = memo(function MarketplaceTabContent2({
  viewState,
  catalog,
  selections,
  cardHandlers,
}) {
  const {
    loading,
    activeTab,
    isAgentsTab,
    isToolsTab = false,
    isRepositoryWorkflowsSubTab,
    isRepositoryAgentsSubTab,
  } = viewState;
  const {
    agents,
    tools = [],
    templates,
    repositoryAgents,
    workflowsOfWorkflows,
  } = catalog;
  const {
    agentSelection,
    toolSelection = defaultToolSelection,
    templateSelection,
    repositoryAgentSelection,
  } = selections;
  const {
    handleAgentCardClick,
    handleToolCardClick = () => {},
    handleCardClick,
    handleRepositoryAgentCardClick,
  } = cardHandlers;
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

const selectionShape = PropTypes.shape({
  selectedIds: PropTypes.object,
  toggle: PropTypes.func.isRequired,
});

MarketplaceTabContent.propTypes = {
  viewState: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    activeTab: PropTypes.string.isRequired,
    isAgentsTab: PropTypes.bool.isRequired,
    isToolsTab: PropTypes.bool,
    isRepositoryWorkflowsSubTab: PropTypes.bool.isRequired,
    isRepositoryAgentsSubTab: PropTypes.bool.isRequired,
  }).isRequired,
  catalog: PropTypes.shape({
    agents: PropTypes.arrayOf(PropTypes.object).isRequired,
    tools: PropTypes.arrayOf(PropTypes.object),
    templates: PropTypes.arrayOf(PropTypes.object),
    repositoryAgents: PropTypes.arrayOf(PropTypes.object).isRequired,
    workflowsOfWorkflows: PropTypes.arrayOf(PropTypes.object).isRequired,
  }).isRequired,
  selections: PropTypes.shape({
    agentSelection: selectionShape.isRequired,
    toolSelection: selectionShape,
    templateSelection: selectionShape.isRequired,
    repositoryAgentSelection: selectionShape.isRequired,
  }).isRequired,
  cardHandlers: PropTypes.shape({
    handleAgentCardClick: PropTypes.func.isRequired,
    handleToolCardClick: PropTypes.func,
    handleCardClick: PropTypes.func.isRequired,
    handleRepositoryAgentCardClick: PropTypes.func.isRequired,
  }).isRequired,
};

export { MarketplaceTabContent };

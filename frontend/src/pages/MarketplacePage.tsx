import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Workflow } from 'lucide-react';
// Domain-based imports - Phase 7
import { 
  useOfficialAgentSeeding, 
  useMarketplaceData, 
  useTemplateOperations,
  useMarketplaceTabs,
  useMarketplaceSelections,
  useMarketplaceActions,
  MARKETPLACE_TABS,
  REPOSITORY_SUB_TABS,
  type Template 
} from '../hooks/marketplace';
import { createCardClickHandler, shouldIgnoreClick } from '../utils/cardClickUtils';
import { MarketplaceActionButtons } from '../components/MarketplaceActionButtons';
import { TemplateFilters } from '../components/TemplateFilters';
import { MarketplaceTabButton } from '../components/marketplace/MarketplaceTabButton';
import { MarketplaceTabContent } from '../components/marketplace/MarketplaceTabContent';
import { getDifficultyColor } from '../utils/difficultyColors';
import { useOfficialItems } from '../hooks/marketplace/useOfficialItems';
import { DEFAULT_SORT } from '../constants/settingsConstants';
import type { StorageAdapter, HttpClient } from '../types/adapters';
import { defaultAdapters } from '../types/adapters';

interface MarketplacePageProps {
  // Dependency injection
  storage?: StorageAdapter | null
  httpClient?: HttpClient
  apiBaseUrl?: string
}

export default function MarketplacePage({
  storage = defaultAdapters.createLocalStorageAdapter(),
  httpClient = defaultAdapters.createHttpClient(),
  apiBaseUrl = 'http://localhost:8000/api'
}: MarketplacePageProps = {}) {
  // Tab management (extracted hook)
  const tabs = useMarketplaceTabs();
  const {
    activeTab,
    repositorySubTab,
    setActiveTab,
    setRepositorySubTab,
    isAgentsTab,
    isRepositoryTab,
    isWorkflowsOfWorkflowsTab,
    isRepositoryWorkflowsSubTab,
    isRepositoryAgentsSubTab,
  } = tabs;

  const [category, setCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState(DEFAULT_SORT);
  
  // Selection management (extracted hook)
  const selections = useMarketplaceSelections();
  const {
    templateSelection,
    agentSelection,
    repositoryAgentSelection,
    clearSelectionsForTab,
  } = selections;
  
  const { token, user } = useAuth();
  const navigate = useNavigate();

  // Marketplace data hook
  const marketplaceData = useMarketplaceData({
    storage,
    httpClient,
    apiBaseUrl,
    category,
    searchQuery,
    sortBy,
    user,
    activeTab,
    repositorySubTab,
  })
  const {
    templates,
    workflowsOfWorkflows,
    agents,
    repositoryAgents,
    loading,
    setTemplates,
    setWorkflowsOfWorkflows,
    setAgents,
    setRepositoryAgents,
    fetchTemplates,
    fetchWorkflowsOfWorkflows,
    fetchAgents,
    fetchRepositoryAgents,
  } = marketplaceData

  // Seed official agents from official workflows (one-time)
  useOfficialAgentSeeding({
    storage,
    httpClient,
    apiBaseUrl,
    onAgentsSeeded: () => {
      // Refresh the agents list if we're on the agents tab
      if (isAgentsTab) {
        fetchAgents();
      }
    },
  })

  // Template operations hook
  const templateOperations = useTemplateOperations({
    token,
    user,
    httpClient,
    apiBaseUrl,
    storage,
    agents,
    templates: templates ?? [],
    workflowsOfWorkflows,
    activeTab,
    setAgents,
    setTemplates: setTemplates as React.Dispatch<React.SetStateAction<Template[]>>,
    setWorkflowsOfWorkflows,
    setRepositoryAgents,
    setSelectedAgentIds: agentSelection.setSelectedIds,
    setSelectedTemplateIds: templateSelection.setSelectedIds,
    setSelectedRepositoryAgentIds: repositoryAgentSelection.setSelectedIds,
  })
  const {
    useTemplate,
    deleteSelectedAgents: deleteSelectedAgentsHandler,
    deleteSelectedWorkflows,
    deleteSelectedRepositoryAgents,
  } = templateOperations

  // Actions management (extracted hook)
  const actions = useMarketplaceActions({
    activeTab,
    repositorySubTab,
    templateSelection,
    agentSelection,
    repositoryAgentSelection,
    agents,
    repositoryAgents,
    storage,
    useTemplate,
    deleteSelectedAgents: deleteSelectedAgentsHandler,
    deleteSelectedWorkflows,
    deleteSelectedRepositoryAgents,
    fetchRepositoryAgents,
  });
  const {
    handleLoadWorkflows,
    handleUseAgents,
    handleDeleteAgents,
    handleDeleteWorkflows,
    handleDeleteRepositoryAgents,
  } = actions;

  // Card click handlers using utility (DRY)
  const handleCardClick = createCardClickHandler(templateSelection.toggle);
  const handleAgentCardClick = createCardClickHandler(agentSelection.toggle);
  const handleRepositoryAgentCardClick = createCardClickHandler(repositoryAgentSelection.toggle);

  // Official items checking (extracted hook)
  const { hasOfficialWorkflows, hasOfficialAgents } = useOfficialItems({
    templates,
    agents,
    templateSelection,
    agentSelection,
  });

  // Handle deselecting on empty space click
  const handleContentClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const isCard = target.closest('[class*="bg-white"][class*="rounded-lg"][class*="shadow"]');
    const isInteractive = shouldIgnoreClick(target) || 
                          target.closest('select') !== null ||
                          target.closest('a') !== null ||
                          target.tagName === 'SELECT' ||
                          target.tagName === 'A';
    
    if (!isCard && !isInteractive) {
      clearSelectionsForTab(activeTab, repositorySubTab);
    }
  }, [activeTab, repositorySubTab, clearSelectionsForTab]);

  // Determine which action buttons to show
  const showWorkflowActions = (isRepositoryTab || isWorkflowsOfWorkflowsTab) && 
                              templateSelection.size > 0 && 
                              (isWorkflowsOfWorkflowsTab || isRepositoryWorkflowsSubTab);

  const showAgentActions = (isAgentsTab && agentSelection.size > 0) || 
                           (isRepositoryAgentsSubTab && repositoryAgentSelection.size > 0);

  return (
    <div className="h-screen bg-gray-50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/')}
            className="mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Main</span>
          </button>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Marketplace</h1>
              <p className="text-gray-600 mt-1">Discover and use pre-built agents and workflows</p>
            </div>
            <div className="flex items-center gap-3">
              {showWorkflowActions && (
                <MarketplaceActionButtons
                  selectedCount={templateSelection.size}
                  hasOfficial={hasOfficialWorkflows}
                  onLoad={handleLoadWorkflows}
                  onDelete={isRepositoryWorkflowsSubTab ? handleDeleteWorkflows : undefined}
                  type="workflow"
                  showDelete={isRepositoryWorkflowsSubTab}
                />
              )}
              {showAgentActions && (
                <MarketplaceActionButtons
                  selectedCount={isRepositoryAgentsSubTab 
                    ? repositoryAgentSelection.size 
                    : agentSelection.size}
                  hasOfficial={hasOfficialAgents}
                  onUse={handleUseAgents}
                  onDelete={isAgentsTab 
                    ? handleDeleteAgents 
                    : handleDeleteRepositoryAgents}
                  type="agent"
                  showDelete={isRepositoryAgentsSubTab || !hasOfficialAgents}
                />
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <MarketplaceTabButton
              label="Agents"
              icon={Bot}
              isActive={isAgentsTab}
              onClick={() => setActiveTab(MARKETPLACE_TABS.AGENTS)}
            />
            <MarketplaceTabButton
              label="Repository"
              icon={Workflow}
              isActive={isRepositoryTab}
              onClick={() => setActiveTab(MARKETPLACE_TABS.REPOSITORY)}
            />
            <MarketplaceTabButton
              label="Workflows of Workflows"
              icon={Workflow}
              isActive={isWorkflowsOfWorkflowsTab}
              onClick={() => setActiveTab(MARKETPLACE_TABS.WORKFLOWS_OF_WORKFLOWS)}
            />
          </div>

          {/* Repository Sub-tabs */}
          {isRepositoryTab && (
            <div className="flex border-b border-gray-200 mb-4">
              <MarketplaceTabButton
                label="Workflows"
                icon={Workflow}
                isActive={isRepositoryWorkflowsSubTab}
                onClick={() => setRepositorySubTab(REPOSITORY_SUB_TABS.WORKFLOWS)}
                iconSize="w-4 h-4"
              />
              <MarketplaceTabButton
                label="Agents"
                icon={Bot}
                isActive={isRepositoryAgentsSubTab}
                onClick={() => setRepositorySubTab(REPOSITORY_SUB_TABS.AGENTS)}
                iconSize="w-4 h-4"
              />
            </div>
          )}

          {/* Search and Filters */}
          <TemplateFilters
            category={category}
            searchQuery={searchQuery}
            sortBy={sortBy}
            activeTab={activeTab}
            onCategoryChange={setCategory}
            onSearchChange={setSearchQuery}
            onSortChange={setSortBy}
            onSearch={() => {
              if (isRepositoryTab) {
                if (isRepositoryWorkflowsSubTab) {
                  fetchTemplates();
                } else {
                  fetchRepositoryAgents();
                }
              } else if (isWorkflowsOfWorkflowsTab) {
                fetchWorkflowsOfWorkflows();
              } else {
                fetchAgents();
              }
            }}
          />
        </div>
      </div>

      {/* Content Grid */}
      <div 
        className="max-w-7xl mx-auto px-4 py-8 flex-1 overflow-y-auto"
        onClick={handleContentClick}
      >
        <MarketplaceTabContent
          loading={loading}
          activeTab={activeTab}
          isAgentsTab={isAgentsTab}
          isRepositoryWorkflowsSubTab={isRepositoryWorkflowsSubTab}
          isRepositoryAgentsSubTab={isRepositoryAgentsSubTab}
          agents={agents}
          templates={templates}
          repositoryAgents={repositoryAgents}
          workflowsOfWorkflows={workflowsOfWorkflows}
          agentSelection={agentSelection}
          templateSelection={templateSelection}
          repositoryAgentSelection={repositoryAgentSelection}
          handleAgentCardClick={handleAgentCardClick}
          handleCardClick={handleCardClick}
          handleRepositoryAgentCardClick={handleRepositoryAgentCardClick}
          getDifficultyColor={getDifficultyColor}
        />
      </div>
    </div>
  );
}

import React, { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Workflow } from 'lucide-react';
import { showError, showSuccess } from '../utils/notifications';
import { useOfficialAgentSeeding } from '../hooks/useOfficialAgentSeeding';
import { useMarketplaceData } from '../hooks/useMarketplaceData';
import { useTemplateOperations } from '../hooks/useTemplateOperations';
import { useSelectionManager } from '../hooks/useSelectionManager';
import { createCardClickHandler, shouldIgnoreClick } from '../utils/cardClickUtils';
import { MarketplaceActionButtons } from '../components/MarketplaceActionButtons';
import { TemplateFilters } from '../components/TemplateFilters';
import { TemplateGrid } from '../components/TemplateGrid';
import type { StorageAdapter, HttpClient } from '../types/adapters';
import { defaultAdapters } from '../types/adapters';

type TabType = 'agents' | 'repository' | 'workflows-of-workflows'
type RepositorySubTabType = 'workflows' | 'agents'

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
  const [activeTab, setActiveTab] = useState<TabType>('agents');
  const [repositorySubTab, setRepositorySubTab] = useState<RepositorySubTabType>('workflows');
  const [category, setCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  
  // Use selection manager hooks (DRY)
  const templateSelection = useSelectionManager<string>();
  const agentSelection = useSelectionManager<string>();
  const repositoryAgentSelection = useSelectionManager<string>();
  
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
      if (activeTab === 'agents') {
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
    templates,
    workflowsOfWorkflows,
    activeTab,
    setAgents,
    setTemplates,
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

  // Card click handlers using utility (DRY)
  const handleCardClick = createCardClickHandler(templateSelection.toggle);
  const handleAgentCardClick = createCardClickHandler(agentSelection.toggle);
  const handleRepositoryAgentCardClick = createCardClickHandler(repositoryAgentSelection.toggle);

  // Handle loading multiple workflows
  const handleLoadWorkflows = useCallback(async () => {
    for (const templateId of templateSelection.selectedIds) {
      await useTemplate(templateId);
      // Small delay between loads to avoid race conditions
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    templateSelection.clear();
  }, [templateSelection, useTemplate]);

  // Handle adding agents to workflow
  const handleUseAgents = useCallback(() => {
    // Get selected agents based on active tab
    const selectedAgents = activeTab === 'repository' && repositorySubTab === 'agents'
      ? repositoryAgents.filter(a => repositoryAgentSelection.selectedIds.has(a.id))
      : agents.filter(a => agentSelection.selectedIds.has(a.id));
    
    // Get the active workflow tab ID
    if (!storage) {
      showError('Storage not available');
      return;
    }
    const activeTabId = storage.getItem('activeWorkflowTabId');
    
    if (!activeTabId) {
      showError('No active workflow found. Please open a workflow first.');
      return;
    }
    
    // Store agents to add in storage (more reliable than events)
    const pendingAgents = {
      tabId: activeTabId,
      agents: selectedAgents,
      timestamp: Date.now()
    };
    storage.setItem('pendingAgentsToAdd', JSON.stringify(pendingAgents));
    
    // Dispatch event as backup
    const event = new CustomEvent('addAgentsToWorkflow', {
      detail: {
        agents: selectedAgents,
        tabId: activeTabId
      }
    });
    window.dispatchEvent(event);
    
    const count = activeTab === 'repository' && repositorySubTab === 'agents' 
      ? repositoryAgentSelection.size 
      : agentSelection.size;
    showSuccess(`${count} agent(s) added to workflow`);
    
    if (activeTab === 'repository' && repositorySubTab === 'agents') {
      repositoryAgentSelection.clear();
    } else {
      agentSelection.clear();
    }
    
    // Small delay to ensure localStorage is written before navigation
    setTimeout(() => {
      navigate('/');
    }, 100);
  }, [
    activeTab,
    repositorySubTab,
    repositoryAgents,
    agents,
    repositoryAgentSelection,
    agentSelection,
    storage,
    navigate
  ]);

  // Delete handlers
  const handleDeleteAgents = useCallback(async () => {
    await deleteSelectedAgentsHandler(agentSelection.selectedIds);
  }, [deleteSelectedAgentsHandler, agentSelection.selectedIds]);

  const handleDeleteWorkflows = useCallback(async () => {
    await deleteSelectedWorkflows(templateSelection.selectedIds);
  }, [deleteSelectedWorkflows, templateSelection.selectedIds]);

  const handleDeleteRepositoryAgents = useCallback(async () => {
    await deleteSelectedRepositoryAgents(repositoryAgentSelection.selectedIds, fetchRepositoryAgents);
  }, [deleteSelectedRepositoryAgents, repositoryAgentSelection.selectedIds, fetchRepositoryAgents]);

  // Check if selected items have official items
  const hasOfficialWorkflows = templates
    .filter(t => templateSelection.selectedIds.has(t.id))
    .some(t => t.is_official);

  const hasOfficialAgents = agents
    .filter(a => agentSelection.selectedIds.has(a.id))
    .some(a => a.is_official);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
      if (activeTab === 'agents') {
        agentSelection.clear();
      } else if (activeTab === 'repository' || activeTab === 'workflows-of-workflows') {
        if (activeTab === 'repository' && repositorySubTab === 'agents') {
          repositoryAgentSelection.clear();
        } else {
          templateSelection.clear();
        }
      }
    }
  }, [activeTab, repositorySubTab, agentSelection, repositoryAgentSelection, templateSelection]);

  // Determine which action buttons to show
  const showWorkflowActions = (activeTab === 'repository' || activeTab === 'workflows-of-workflows') && 
                              templateSelection.size > 0 && 
                              (activeTab === 'workflows-of-workflows' || repositorySubTab === 'workflows');

  const showAgentActions = (activeTab === 'agents' && agentSelection.size > 0) || 
                           (activeTab === 'repository' && repositorySubTab === 'agents' && repositoryAgentSelection.size > 0);

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
                  onDelete={activeTab === 'repository' && repositorySubTab === 'workflows' ? handleDeleteWorkflows : undefined}
                  type="workflow"
                  showDelete={activeTab === 'repository' && repositorySubTab === 'workflows'}
                />
              )}
              {showAgentActions && (
                <MarketplaceActionButtons
                  selectedCount={activeTab === 'repository' && repositorySubTab === 'agents' 
                    ? repositoryAgentSelection.size 
                    : agentSelection.size}
                  hasOfficial={hasOfficialAgents}
                  onUse={handleUseAgents}
                  onDelete={activeTab === 'agents' 
                    ? handleDeleteAgents 
                    : handleDeleteRepositoryAgents}
                  type="agent"
                  showDelete={activeTab === 'repository' && repositorySubTab === 'agents' || !hasOfficialAgents}
                />
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200 mb-4">
            <button
              onClick={() => setActiveTab('agents')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === 'agents'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Bot className="w-5 h-5" />
              Agents
            </button>
            <button
              onClick={() => setActiveTab('repository')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === 'repository'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Workflow className="w-5 h-5" />
              Repository
            </button>
            <button
              onClick={() => setActiveTab('workflows-of-workflows')}
              className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                activeTab === 'workflows-of-workflows'
                  ? 'text-primary-600 border-b-2 border-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Workflow className="w-5 h-5" />
              Workflows of Workflows
            </button>
          </div>

          {/* Repository Sub-tabs */}
          {activeTab === 'repository' && (
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setRepositorySubTab('workflows')}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                  repositorySubTab === 'workflows'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Workflow className="w-4 h-4" />
                Workflows
              </button>
              <button
                onClick={() => setRepositorySubTab('agents')}
                className={`px-6 py-3 text-sm font-medium flex items-center gap-2 transition-colors ${
                  repositorySubTab === 'agents'
                    ? 'text-primary-600 border-b-2 border-primary-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Bot className="w-4 h-4" />
                Agents
              </button>
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
              if (activeTab === 'repository') {
                if (repositorySubTab === 'workflows') {
                  fetchTemplates();
                } else {
                  fetchRepositoryAgents();
                }
              } else if (activeTab === 'workflows-of-workflows') {
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
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading {activeTab}...</p>
          </div>
        ) : activeTab === 'agents' ? (
          <TemplateGrid
            items={agents}
            selectedIds={agentSelection.selectedIds}
            type="agent"
            onToggleSelect={agentSelection.toggle}
            onCardClick={handleAgentCardClick}
            getDifficultyColor={getDifficultyColor}
            emptyMessage="No agents found. Try adjusting your filters."
            footerText={'Selected - Click "Use Agent(s)" above to use'}
          />
        ) : activeTab === 'repository' && repositorySubTab === 'workflows' ? (
          <TemplateGrid
            items={templates}
            selectedIds={templateSelection.selectedIds}
            type="template"
            onToggleSelect={templateSelection.toggle}
            onCardClick={handleCardClick}
            getDifficultyColor={getDifficultyColor}
            emptyMessage="No workflows found. Try adjusting your filters."
            footerText={'Selected - Click "Load Workflow(s)" above to use'}
          />
        ) : activeTab === 'repository' && repositorySubTab === 'agents' ? (
          <TemplateGrid
            items={repositoryAgents}
            selectedIds={repositoryAgentSelection.selectedIds}
            type="agent"
            onToggleSelect={repositoryAgentSelection.toggle}
            onCardClick={handleRepositoryAgentCardClick}
            getDifficultyColor={getDifficultyColor}
            emptyMessage="No repository agents found. Try adjusting your filters."
            footerText={'Selected - Click "Use Agent(s)" above to use'}
          />
        ) : (
          <TemplateGrid
            items={workflowsOfWorkflows}
            selectedIds={templateSelection.selectedIds}
            type="template"
            onToggleSelect={templateSelection.toggle}
            onCardClick={handleCardClick}
            getDifficultyColor={getDifficultyColor}
            emptyMessage="No workflows found. Try adjusting your filters."
            footerText={'Selected - Click "Load Workflow(s)" above to use'}
          />
        )}
      </div>
    </div>
  );
}

import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Download, Heart, TrendingUp, Clock, ArrowLeft, Trash2, Bot, Workflow } from 'lucide-react';
import { showError, showSuccess } from '../utils/notifications';
import { useOfficialAgentSeeding } from '../hooks/useOfficialAgentSeeding';
import { useMarketplaceData } from '../hooks/useMarketplaceData';
import { useTemplateOperations } from '../hooks/useTemplateOperations';
import { TemplateFilters } from '../components/TemplateFilters';
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
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [selectedRepositoryAgentIds, setSelectedRepositoryAgentIds] = useState<Set<string>>(new Set());
  
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
    setSelectedAgentIds,
    setSelectedTemplateIds,
    setSelectedRepositoryAgentIds,
  })
  const {
    useTemplate,
    deleteSelectedAgents: deleteSelectedAgentsHandler,
    deleteSelectedWorkflows,
    deleteSelectedRepositoryAgents,
  } = templateOperations




  // Wrapper functions that pass selected IDs to the hook handlers
  const deleteSelectedAgentsWrapper = async () => {
    await deleteSelectedAgentsHandler(selectedAgentIds)
  }

  const deleteSelectedWorkflowsWrapper = async () => {
    await deleteSelectedWorkflows(selectedTemplateIds)
  }

  const deleteSelectedRepositoryAgentsWrapper = async () => {
    await deleteSelectedRepositoryAgents(selectedRepositoryAgentIds, fetchRepositoryAgents)
  }

  const handleCardClick = (e: React.MouseEvent, templateId: string) => {
    // Prevent any default behavior
    e.preventDefault();
    e.stopPropagation();
    
    // Don't toggle selection if clicking on interactive elements
    const target = e.target as HTMLElement;
    if (target.closest('input[type="checkbox"]') || 
        target.closest('button') || 
        target.tagName === 'BUTTON' ||
        target.tagName === 'INPUT') {
      return;
    }
    
    // Toggle selection
    setSelectedTemplateIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(templateId)) {
        newSet.delete(templateId);
      } else {
        newSet.add(templateId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

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
              {(activeTab === 'repository' || activeTab === 'workflows-of-workflows') && selectedTemplateIds.size > 0 && (activeTab === 'workflows-of-workflows' || repositorySubTab === 'workflows') && (
                <>
                  <button
                    onClick={async () => {
                      // Load all selected workflows
                      for (const templateId of selectedTemplateIds) {
                        await useTemplate(templateId);
                        // Small delay between loads to avoid race conditions
                        await new Promise(resolve => setTimeout(resolve, 100));
                      }
                      // Clear selection after loading
                      setSelectedTemplateIds(new Set());
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Load {selectedTemplateIds.size} Workflow{selectedTemplateIds.size > 1 ? 's' : ''}
                  </button>
                  {(() => {
                    // Only show delete button for repository workflows, not workflows-of-workflows
                    if (activeTab === 'repository' && repositorySubTab === 'workflows') {
                      // Check if any selected workflows are official
                      const selectedTemplates = templates.filter(t => selectedTemplateIds.has(t.id));
                      const hasOfficialWorkflow = selectedTemplates.some(t => t.is_official);
                      
                      // Only show delete button if no official workflows are selected
                      if (!hasOfficialWorkflow) {
                        return (
                          <button
                            onClick={deleteSelectedWorkflowsWrapper}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete {selectedTemplateIds.size} Workflow{selectedTemplateIds.size > 1 ? 's' : ''}
                          </button>
                        );
                      }
                    }
                    return null;
                  })()}
                </>
              )}
              {(activeTab === 'agents' && selectedAgentIds.size > 0) || (activeTab === 'repository' && repositorySubTab === 'agents' && selectedRepositoryAgentIds.size > 0) ? (
                <>
                  <button
                    onClick={() => {
                      // Get selected agents based on active tab
                      const selectedAgents = activeTab === 'repository' && repositorySubTab === 'agents'
                        ? repositoryAgents.filter(a => selectedRepositoryAgentIds.has(a.id))
                        : agents.filter(a => selectedAgentIds.has(a.id));
                      
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
                        ? selectedRepositoryAgentIds.size 
                        : selectedAgentIds.size;
                      showSuccess(`${count} agent(s) added to workflow`);
                      
                      if (activeTab === 'repository' && repositorySubTab === 'agents') {
                        setSelectedRepositoryAgentIds(new Set());
                      } else {
                        setSelectedAgentIds(new Set());
                      }
                      
                      // Small delay to ensure localStorage is written before navigation
                      setTimeout(() => {
                        // Navigate back to workflow builder
                        navigate('/');
                      }, 100);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Use {(activeTab === 'repository' && repositorySubTab === 'agents' ? selectedRepositoryAgentIds.size : selectedAgentIds.size)} Agent{(activeTab === 'repository' && repositorySubTab === 'agents' ? selectedRepositoryAgentIds.size : selectedAgentIds.size) > 1 ? 's' : ''}
                  </button>
                  {(() => {
                    // Check if any selected agents are official (only for public marketplace)
                    if (activeTab === 'agents') {
                      const selectedAgents = agents.filter(a => selectedAgentIds.has(a.id));
                      const hasOfficialAgent = selectedAgents.some(a => a.is_official);
                      
                      // Only show delete button if no official agents are selected
                      if (!hasOfficialAgent) {
                        return (
                          <button
                            onClick={deleteSelectedAgentsWrapper}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete {selectedAgentIds.size} Agent{selectedAgentIds.size > 1 ? 's' : ''}
                          </button>
                        );
                      }
                    } else if (activeTab === 'repository' && repositorySubTab === 'agents') {
                      // Repository agents can always be deleted
                      return (
                        <button
                          onClick={deleteSelectedRepositoryAgentsWrapper}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete {selectedRepositoryAgentIds.size} Agent{selectedRepositoryAgentIds.size > 1 ? 's' : ''}
                        </button>
                      );
                    }
                    return null;
                  })()}
                </>
              ) : null}
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
        onClick={(e) => {
          // Deselect if clicking on empty space (not on a card or interactive element)
          const target = e.target as HTMLElement;
          // Check if click is on a card (has the card classes) or interactive element
          const isCard = target.closest('[class*="bg-white"][class*="rounded-lg"][class*="shadow"]');
          const isInteractive = target.closest('button') || 
                                target.closest('input') || 
                                target.closest('select') ||
                                target.closest('a') ||
                                target.tagName === 'BUTTON' ||
                                target.tagName === 'INPUT' ||
                                target.tagName === 'SELECT' ||
                                target.tagName === 'A';
          
          if (!isCard && !isInteractive) {
            if (activeTab === 'agents') {
              setSelectedAgentIds(new Set());
            } else if (activeTab === 'repository' || activeTab === 'workflows-of-workflows') {
              if (activeTab === 'repository' && repositorySubTab === 'agents') {
                setSelectedRepositoryAgentIds(new Set());
              } else {
                setSelectedTemplateIds(new Set());
              }
            }
          }
        }}
      >
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading {activeTab}...</p>
          </div>
        ) : activeTab === 'agents' ? (
          agents.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No agents found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {agents.map((agent) => {
                const isSelected = selectedAgentIds.has(agent.id);
                return (
                  <div 
                    key={agent.id} 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      const target = e.target as HTMLElement;
                      if (target.closest('input[type="checkbox"]') || 
                          target.closest('button') || 
                          target.tagName === 'BUTTON' ||
                          target.tagName === 'INPUT') {
                        return;
                      }
                      setSelectedAgentIds(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(agent.id)) {
                          newSet.delete(agent.id);
                        } else {
                          newSet.add(agent.id);
                        }
                        return newSet;
                      });
                    }}
                    className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer border-2 ${
                      isSelected 
                        ? 'border-primary-500 ring-2 ring-primary-200' 
                        : 'border-transparent'
                    }`}
                  >
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              e.stopPropagation();
                              setSelectedAgentIds(prev => {
                                const newSet = new Set(prev);
                                if (e.target.checked) {
                                  newSet.add(agent.id);
                                } else {
                                  newSet.delete(agent.id);
                                }
                                return newSet;
                              });
                            }}
                            className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <h3 className="text-xl font-semibold text-gray-900 flex-1">
                            {agent.name || agent.label}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {agent.is_official && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                              Official
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {agent.description}
                      </p>

                      {/* Tags */}
                      {agent.tags && agent.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {agent.tags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Metadata */}
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{agent.estimated_time || 'N/A'}</span>
                        </div>
                        {agent.category && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                            {agent.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </span>
                        )}
                        {agent.author_name && (
                          <div className="flex items-center gap-1 text-gray-600">
                            <span className="font-medium">By:</span>
                            <span>{agent.author_name}</span>
                          </div>
                        )}
                      </div>

                      {/* Difficulty */}
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(agent.difficulty)}`}>
                        {agent.difficulty}
                      </span>
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className={`text-sm text-center py-2 px-4 rounded-lg ${
                        isSelected 
                          ? 'bg-primary-100 text-primary-700 font-medium' 
                          : 'text-gray-500'
                      }`}>
                        {isSelected 
                          ? 'Selected - Click "Use Agent(s)" above to use' 
                          : 'Click card or checkbox to select'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )
        ) : activeTab === 'repository' && repositorySubTab === 'workflows' ? (
          templates.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600">No workflows found. Try adjusting your filters.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {templates.map((template) => {
                const isSelected = selectedTemplateIds.has(template.id);
                return (
                <div 
                  key={template.id} 
                  onClick={(e) => handleCardClick(e, template.id)}
                  className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer border-2 ${
                    isSelected 
                      ? 'border-primary-500 ring-2 ring-primary-200' 
                      : 'border-transparent'
                  }`}
                >
                  {/* Header */}
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            setSelectedTemplateIds(prev => {
                              const newSet = new Set(prev);
                              if (e.target.checked) {
                                newSet.add(template.id);
                              } else {
                                newSet.delete(template.id);
                              }
                              return newSet;
                            });
                          }}
                          className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                          onClick={(e) => e.stopPropagation()}
                        />
                        <h3 className="text-xl font-semibold text-gray-900 flex-1">
                          {template.name}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {template.is_official && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                            Official
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                      {template.description}
                    </p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {template.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>{template.uses_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="w-4 h-4" />
                        <span>{template.likes_count}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{template.estimated_time}</span>
                      </div>
                      {template.author_name && (
                        <div className="flex items-center gap-1 text-gray-600">
                          <span className="font-medium">By:</span>
                          <span>{template.author_name}</span>
                        </div>
                      )}
                    </div>

                    {/* Difficulty */}
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                      {template.difficulty}
                    </span>
                  </div>

                  {/* Footer */}
                  <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                    <div className={`text-sm text-center py-2 px-4 rounded-lg ${
                      isSelected 
                        ? 'bg-primary-100 text-primary-700 font-medium' 
                        : 'text-gray-500'
                    }`}>
                      {isSelected 
                        ? 'Selected - Click "Load Workflow(s)" above to use' 
                        : 'Click card or checkbox to select'}
                    </div>
                  </div>
                </div>
              );
              })}
            </div>
          )
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No workflows found. Try adjusting your filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((template) => {
              const isSelected = selectedTemplateIds.has(template.id);
              return (
              <div 
                key={template.id} 
                onClick={(e) => handleCardClick(e, template.id)}
                className={`bg-white rounded-lg shadow-md hover:shadow-lg transition-all overflow-hidden cursor-pointer border-2 ${
                  isSelected 
                    ? 'border-primary-500 ring-2 ring-primary-200' 
                    : 'border-transparent'
                }`}
              >
                {/* Header */}
                <div className="p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          e.stopPropagation();
                          setSelectedTemplateIds(prev => {
                            const newSet = new Set(prev);
                            if (e.target.checked) {
                              newSet.add(template.id);
                            } else {
                              newSet.delete(template.id);
                            }
                            return newSet;
                          });
                        }}
                        className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      />
                      <h3 className="text-xl font-semibold text-gray-900 flex-1">
                        {template.name}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      {template.is_official && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                          Official
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {template.description}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {template.tags.map((tag) => (
                      <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Metadata */}
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{template.uses_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{template.likes_count}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{template.estimated_time}</span>
                    </div>
                    {template.author_name && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <span className="font-medium">By:</span>
                        <span>{template.author_name}</span>
                      </div>
                    )}
                  </div>

                  {/* Difficulty */}
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.difficulty)}`}>
                    {template.difficulty}
                  </span>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                  <div className={`text-sm text-center py-2 px-4 rounded-lg ${
                    isSelected 
                      ? 'bg-primary-100 text-primary-700 font-medium' 
                      : 'text-gray-500'
                  }`}>
                    {isSelected 
                      ? 'Selected - Click "Load Workflow(s)" above to use' 
                      : 'Click card or checkbox to select'}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}


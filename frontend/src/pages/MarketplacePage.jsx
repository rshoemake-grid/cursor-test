import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bot, Workflow, Wrench } from 'lucide-react';
// Domain-based imports - Phase 7
import { useOfficialAgentSeeding, useMarketplaceData, useTemplateOperations, useMarketplaceTabs, useMarketplaceSelections, useMarketplaceActions, MARKETPLACE_TABS, REPOSITORY_SUB_TABS } from '../hooks/marketplace';
import { createCardClickHandler, shouldIgnoreClick } from '../utils/cardClickUtils';
import { MarketplaceActionButtons } from '../components/MarketplaceActionButtons';
import { TemplateFilters } from '../components/TemplateFilters';
import { MarketplaceTabButton } from '../components/marketplace/MarketplaceTabButton';
import { MarketplaceTabContent } from '../components/marketplace/MarketplaceTabContent';
import { getDifficultyColor } from '../utils/difficultyColors';
import { useOfficialItems } from '../hooks/marketplace/useOfficialItems';
import { DEFAULT_SORT } from '../constants/settingsConstants';
import { API_CONFIG } from '../config/constants';
import { defaultAdapters } from '../types/adapters';
export default function MarketplacePage({ storage = defaultAdapters.createLocalStorageAdapter(), httpClient = defaultAdapters.createHttpClient(), apiBaseUrl = API_CONFIG.BASE_URL } = {}) {
    // Tab management (extracted hook)
    const tabs = useMarketplaceTabs();
    const { activeTab, repositorySubTab, setActiveTab, setRepositorySubTab, isAgentsTab, isRepositoryTab, isWorkflowsOfWorkflowsTab, isToolsTab, isRepositoryWorkflowsSubTab, isRepositoryAgentsSubTab } = tabs;
    const [category, setCategory] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState(DEFAULT_SORT);
    // Selection management (extracted hook)
    const selections = useMarketplaceSelections();
    const { templateSelection, agentSelection, repositoryAgentSelection, toolSelection, clearSelectionsForTab } = selections;
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
        repositorySubTab
    });
    const { templates, workflowsOfWorkflows, agents, repositoryAgents, tools, loading, setTemplates, setWorkflowsOfWorkflows, setAgents, setRepositoryAgents, fetchTemplates, fetchWorkflowsOfWorkflows, fetchAgents, fetchRepositoryAgents, fetchTools } = marketplaceData;
    // Seed official agents from official workflows (one-time)
    useOfficialAgentSeeding({
        storage,
        httpClient,
        apiBaseUrl,
        onAgentsSeeded: ()=>{
            // Refresh the agents list if we're on the agents tab
            if (isAgentsTab) {
                fetchAgents();
            }
        }
    });
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
        setTemplates: setTemplates,
        setWorkflowsOfWorkflows,
        setRepositoryAgents,
        setSelectedAgentIds: agentSelection.setSelectedIds,
        setSelectedTemplateIds: templateSelection.setSelectedIds,
        setSelectedRepositoryAgentIds: repositoryAgentSelection.setSelectedIds
    });
    const { useTemplate, deleteSelectedAgents: deleteSelectedAgentsHandler, deleteSelectedWorkflows, deleteSelectedRepositoryAgents } = templateOperations;
    // Actions management (extracted hook)
    const actions = useMarketplaceActions({
        activeTab,
        repositorySubTab,
        templateSelection,
        agentSelection,
        repositoryAgentSelection,
        toolSelection,
        agents,
        repositoryAgents,
        tools,
        storage,
        useTemplate,
        deleteSelectedAgents: deleteSelectedAgentsHandler,
        deleteSelectedWorkflows,
        deleteSelectedRepositoryAgents,
        fetchRepositoryAgents
    });
    const { handleLoadWorkflows, handleUseAgents, handleUseTools, handleDeleteAgents, handleDeleteWorkflows, handleDeleteRepositoryAgents } = actions;
    // Card click handlers using utility (DRY)
    const handleCardClick = createCardClickHandler(templateSelection.toggle);
    const handleAgentCardClick = createCardClickHandler(agentSelection.toggle);
    const handleRepositoryAgentCardClick = createCardClickHandler(repositoryAgentSelection.toggle);
    const handleToolCardClick = createCardClickHandler(toolSelection.toggle);
    // Official items checking (extracted hook)
    const { hasOfficialWorkflows, hasOfficialAgents } = useOfficialItems({
        templates,
        agents,
        templateSelection,
        agentSelection
    });
    // Handle deselecting on empty space click
    const handleContentClick = useCallback((e)=>{
        const target = e.target;
        const isCard = target.closest('[class*="bg-white"][class*="rounded-lg"][class*="shadow"]');
        const isInteractive = shouldIgnoreClick(target) || target.closest('select') !== null || target.closest('a') !== null || target.tagName === 'SELECT' || target.tagName === 'A';
        if (!isCard && !isInteractive) {
            clearSelectionsForTab(activeTab, repositorySubTab);
        }
    }, [
        activeTab,
        repositorySubTab,
        clearSelectionsForTab
    ]);
    // Determine which action buttons to show
    const showWorkflowActions = (isRepositoryTab || isWorkflowsOfWorkflowsTab) && templateSelection.size > 0 && (isWorkflowsOfWorkflowsTab || isRepositoryWorkflowsSubTab);
    const showAgentActions = isAgentsTab && agentSelection.size > 0 || isRepositoryAgentsSubTab && repositoryAgentSelection.size > 0;
    const showToolActions = isToolsTab && toolSelection.size > 0;
    return /*#__PURE__*/ _jsxs("div", {
        className: "h-screen bg-gray-50 flex flex-col overflow-hidden",
        children: [
            /*#__PURE__*/ _jsx("div", {
                className: "bg-white border-b border-gray-200 flex-shrink-0",
                children: /*#__PURE__*/ _jsxs("div", {
                    className: "max-w-7xl mx-auto px-4 py-6",
                    children: [
                        /*#__PURE__*/ _jsxs("button", {
                            onClick: ()=>navigate('/'),
                            className: "mb-4 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors",
                            children: [
                                /*#__PURE__*/ _jsx(ArrowLeft, {
                                    className: "w-5 h-5"
                                }),
                                /*#__PURE__*/ _jsx("span", {
                                    children: "Back to Main"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center justify-between mb-4",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    children: [
                                        /*#__PURE__*/ _jsx("h1", {
                                            className: "text-3xl font-bold text-gray-900",
                                            children: "Marketplace"
                                        }),
                                        /*#__PURE__*/ _jsx("p", {
                                            className: "text-gray-600 mt-1",
                                            children: "Discover and use pre-built agents and workflows"
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex items-center gap-3",
                                    children: [
                                        showWorkflowActions && /*#__PURE__*/ _jsx(MarketplaceActionButtons, {
                                            selectedCount: templateSelection.size,
                                            hasOfficial: hasOfficialWorkflows,
                                            onLoad: handleLoadWorkflows,
                                            onDelete: isRepositoryWorkflowsSubTab ? handleDeleteWorkflows : undefined,
                                            type: "workflow",
                                            showDelete: isRepositoryWorkflowsSubTab
                                        }),
                                        showAgentActions && /*#__PURE__*/ _jsx(MarketplaceActionButtons, {
                                            selectedCount: isRepositoryAgentsSubTab ? repositoryAgentSelection.size : agentSelection.size,
                                            hasOfficial: hasOfficialAgents,
                                            onUse: handleUseAgents,
                                            onDelete: isAgentsTab ? handleDeleteAgents : handleDeleteRepositoryAgents,
                                            type: "agent",
                                            showDelete: isRepositoryAgentsSubTab || !hasOfficialAgents
                                        }),
                                        showToolActions && /*#__PURE__*/ _jsx(MarketplaceActionButtons, {
                                            selectedCount: toolSelection.size,
                                            hasOfficial: false,
                                            onUse: handleUseTools,
                                            type: "tool",
                                            showDelete: false
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex border-b border-gray-200 mb-4",
                            children: [
                                /*#__PURE__*/ _jsx(MarketplaceTabButton, {
                                    label: "Agents",
                                    icon: Bot,
                                    isActive: isAgentsTab,
                                    onClick: ()=>setActiveTab(MARKETPLACE_TABS.AGENTS)
                                }),
                                /*#__PURE__*/ _jsx(MarketplaceTabButton, {
                                    label: "Repository",
                                    icon: Workflow,
                                    isActive: isRepositoryTab,
                                    onClick: ()=>setActiveTab(MARKETPLACE_TABS.REPOSITORY)
                                }),
                                /*#__PURE__*/ _jsx(MarketplaceTabButton, {
                                    label: "Workflows of Workflows",
                                    icon: Workflow,
                                    isActive: isWorkflowsOfWorkflowsTab,
                                    onClick: ()=>setActiveTab(MARKETPLACE_TABS.WORKFLOWS_OF_WORKFLOWS)
                                }),
                                /*#__PURE__*/ _jsx(MarketplaceTabButton, {
                                    label: "Tools",
                                    icon: Wrench,
                                    isActive: isToolsTab,
                                    onClick: ()=>setActiveTab(MARKETPLACE_TABS.TOOLS)
                                })
                            ]
                        }),
                        isRepositoryTab && /*#__PURE__*/ _jsxs("div", {
                            className: "flex border-b border-gray-200 mb-4",
                            children: [
                                /*#__PURE__*/ _jsx(MarketplaceTabButton, {
                                    label: "Workflows",
                                    icon: Workflow,
                                    isActive: isRepositoryWorkflowsSubTab,
                                    onClick: ()=>setRepositorySubTab(REPOSITORY_SUB_TABS.WORKFLOWS),
                                    iconSize: "w-4 h-4"
                                }),
                                /*#__PURE__*/ _jsx(MarketplaceTabButton, {
                                    label: "Agents",
                                    icon: Bot,
                                    isActive: isRepositoryAgentsSubTab,
                                    onClick: ()=>setRepositorySubTab(REPOSITORY_SUB_TABS.AGENTS),
                                    iconSize: "w-4 h-4"
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsx(TemplateFilters, {
                            category: category,
                            searchQuery: searchQuery,
                            sortBy: sortBy,
                            activeTab: activeTab,
                            onCategoryChange: setCategory,
                            onSearchChange: setSearchQuery,
                            onSortChange: (sortBy)=>setSortBy(sortBy),
                            onSearch: ()=>{
                                if (isRepositoryTab) {
                                    if (isRepositoryWorkflowsSubTab) {
                                        fetchTemplates();
                                    } else {
                                        fetchRepositoryAgents();
                                    }
                                } else if (isWorkflowsOfWorkflowsTab) {
                                    fetchWorkflowsOfWorkflows();
                                } else if (isToolsTab) {
                                    fetchTools();
                                } else {
                                    fetchAgents();
                                }
                            }
                        })
                    ]
                })
            }),
            /*#__PURE__*/ _jsx("div", {
                className: "max-w-7xl mx-auto px-4 py-8 flex-1 overflow-y-auto",
                onClick: handleContentClick,
                children: /*#__PURE__*/ _jsx(MarketplaceTabContent, {
                    loading: loading,
                    activeTab: activeTab,
                    isAgentsTab: isAgentsTab,
                    isToolsTab: isToolsTab,
                    isRepositoryWorkflowsSubTab: isRepositoryWorkflowsSubTab,
                    isRepositoryAgentsSubTab: isRepositoryAgentsSubTab,
                    agents: agents,
                    tools: tools,
                    templates: templates,
                    repositoryAgents: repositoryAgents,
                    workflowsOfWorkflows: workflowsOfWorkflows,
                    agentSelection: agentSelection,
                    toolSelection: toolSelection,
                    templateSelection: templateSelection,
                    repositoryAgentSelection: repositoryAgentSelection,
                    handleAgentCardClick: handleAgentCardClick,
                    handleToolCardClick: handleToolCardClick,
                    handleCardClick: handleCardClick,
                    handleRepositoryAgentCardClick: handleRepositoryAgentCardClick,
                    getDifficultyColor: getDifficultyColor
                })
            })
        ]
    });
}

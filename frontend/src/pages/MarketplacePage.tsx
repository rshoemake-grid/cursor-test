import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Download, Heart, TrendingUp, Clock, Star, ArrowLeft, Trash2, Bot, Workflow } from 'lucide-react';
import { showError, showSuccess } from '../utils/notifications';
import { showConfirm } from '../utils/confirm';
import { api } from '../api/client';
import { useLocalStorage, getLocalStorageItem, setLocalStorageItem, removeLocalStorageItem } from '../hooks/useLocalStorage';
import { logger } from '../utils/logger';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: string;
  estimated_time: string;
  is_official: boolean;
  uses_count: number;
  likes_count: number;
  rating: number;
  author_id?: string | null;
  author_name?: string | null;
}

interface AgentTemplate {
  id: string;
  name: string;
  label: string;
  description: string;
  category: string;
  tags: string[];
  difficulty: string;
  estimated_time: string;
  agent_config: any;
  published_at?: string;
  author_id?: string | null;
  author_name?: string | null;
  is_official?: boolean;
}

type TabType = 'agents' | 'repository' | 'workflows-of-workflows'
type RepositorySubTabType = 'workflows' | 'agents'

export default function MarketplacePage() {
  const [activeTab, setActiveTab] = useState<TabType>('agents');
  const [repositorySubTab, setRepositorySubTab] = useState<RepositorySubTabType>('workflows');
  const [templates, setTemplates] = useState<Template[]>([]);
  const [workflowsOfWorkflows, setWorkflowsOfWorkflows] = useState<Template[]>([]);
  const [agents, setAgents] = useState<AgentTemplate[]>([]);
  const [repositoryAgents, setRepositoryAgents] = useState<AgentTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  const [selectedAgentIds, setSelectedAgentIds] = useState<Set<string>>(new Set());
  const [selectedRepositoryAgentIds, setSelectedRepositoryAgentIds] = useState<Set<string>>(new Set());
  
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
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
  }, [category, sortBy, activeTab, repositorySubTab]);

  // Seed official agents from official workflows (one-time)
  useEffect(() => {
    const seedOfficialAgents = async () => {
      const seededKey = 'officialAgentsSeeded';
      // Clear the flag to force re-seeding (remove this line after first successful seed)
      localStorage.removeItem(seededKey);
      
      if (localStorage.getItem(seededKey)) {
        console.log('[Marketplace] Official agents already seeded, skipping');
        return; // Already seeded
      }

      console.log('[Marketplace] Starting to seed official agents...');
      try {
        // Fetch all official workflows
        const response = await fetch('http://localhost:8000/api/templates/?sort_by=popular');
        if (!response.ok) {
          console.error('[Marketplace] Failed to fetch templates:', response.statusText);
          return;
        }
        const workflows = await response.json();
        console.log('[Marketplace] Fetched workflows:', workflows.length);
        const officialWorkflows = workflows.filter((w: Template) => w.is_official);
        console.log('[Marketplace] Official workflows found:', officialWorkflows.length);

        if (officialWorkflows.length === 0) {
          console.log('[Marketplace] No official workflows found, marking as seeded');
          setLocalStorageItem(seededKey, 'true');
          return;
        }

        // Fetch workflow details using the /use endpoint to get nodes
        // Note: This creates a temporary workflow but we only use it to extract agent nodes
        const agentsToAdd: AgentTemplate[] = [];
        for (const workflow of officialWorkflows) {
          try {
            console.log(`[Marketplace] Processing workflow: ${workflow.name} (${workflow.id})`);
            // Use the /use endpoint to get the full workflow with nodes
            const workflowResponse = await fetch(`http://localhost:8000/api/templates/${workflow.id}/use`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' }
            });
            
            if (!workflowResponse.ok) {
              console.error(`[Marketplace] Failed to fetch workflow ${workflow.id}: ${workflowResponse.statusText}`);
              continue;
            }
            
            const workflowDetail = await workflowResponse.json();
            console.log(`[Marketplace] Workflow ${workflow.name} has ${workflowDetail.nodes?.length || 0} nodes`);
            
            // Extract agent nodes from workflow nodes
            if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes)) {
              const agentNodes = workflowDetail.nodes.filter((node: any) => {
                const nodeType = node.type || node.data?.type;
                const hasAgentConfig = node.agent_config || node.data?.agent_config;
                const isAgent = nodeType === 'agent' && hasAgentConfig;
                if (isAgent) {
                  console.log(`[Marketplace] Found agent node: ${node.id || node.data?.id}`, {
                    type: nodeType,
                    hasConfig: !!hasAgentConfig,
                    name: node.name || node.data?.name
                  });
                }
                return isAgent;
              });

              console.log(`[Marketplace] Found ${agentNodes.length} agent nodes in workflow ${workflow.name}`);

              for (const agentNode of agentNodes) {
                // Create unique agent ID based on workflow and node
                const nodeId = agentNode.id || agentNode.data?.id || `node_${Date.now()}`;
                const agentId = `official_${workflow.id}_${nodeId}`;
                
                // Check if agent already exists
                const existingAgents = localStorage.getItem('publishedAgents');
                const agents: AgentTemplate[] = existingAgents ? JSON.parse(existingAgents) : [];
                if (agents.some(a => a.id === agentId)) {
                  console.log(`[Marketplace] Agent ${agentId} already exists, skipping`);
                  continue; // Skip if already exists
                }

                const agentConfig = agentNode.agent_config || agentNode.data?.agent_config || {};
                const nodeName = agentNode.name || agentNode.data?.name || agentNode.data?.label || 'Agent';
                const nodeDescription = agentNode.description || agentNode.data?.description || `Agent from ${workflow.name}`;

                logger.debug(`[Marketplace] Creating official agent: ${nodeName} (${agentId})`);

                agentsToAdd.push({
                  id: agentId,
                  name: nodeName,
                  label: nodeName,
                  description: nodeDescription,
                  category: workflow.category || 'automation',
                  tags: [...(workflow.tags || []), 'official', workflow.name.toLowerCase().replace(/\s+/g, '-')],
                  difficulty: workflow.difficulty || 'intermediate',
                  estimated_time: workflow.estimated_time || '5 min',
                  agent_config: agentConfig,
                  published_at: workflow.created_at || new Date().toISOString(),
                  author_id: workflow.author_id || null,
                  author_name: workflow.author_name || 'System',
                  is_official: true
                });
              }
            } else {
              console.log(`[Marketplace] Workflow ${workflow.name} has no nodes array`);
            }
          } catch (error) {
            console.error(`[Marketplace] Failed to fetch workflow ${workflow.id}:`, error);
          }
        }

        // Add official agents to localStorage
        if (agentsToAdd.length > 0) {
          const existingAgents = localStorage.getItem('publishedAgents');
          const agents: AgentTemplate[] = existingAgents ? JSON.parse(existingAgents) : [];
          agents.push(...agentsToAdd);
                setLocalStorageItem('publishedAgents', agents);
          console.log(`[Marketplace] Seeded ${agentsToAdd.length} official agents from workflows`);
          console.log(`[Marketplace] Total agents in storage: ${agents.length}`);
          
          // Refresh the agents list if we're on the agents tab
          if (activeTab === 'agents') {
            fetchAgents();
          }
        } else {
          console.log('[Marketplace] No agents to add');
        }

        setLocalStorageItem(seededKey, 'true');
        console.log('[Marketplace] Seeding complete');
      } catch (error) {
        console.error('[Marketplace] Failed to seed official agents:', error);
      }
    };

    seedOfficialAgents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort_by', sortBy);
      
      const response = await fetch(`http://localhost:8000/api/templates/?${params}`);
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkflowsOfWorkflows = async () => {
    setLoading(true);
    try {
      // Fetch all workflows
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (searchQuery) params.append('search', searchQuery);
      params.append('sort_by', sortBy);
      
      const response = await fetch(`http://localhost:8000/api/templates/?${params}`);
      const allWorkflows = await response.json();
      
      // Filter workflows that contain references to other workflows
      // A "workflow of workflows" is one that references other workflows in its definition
      const workflowsOfWorkflows: Template[] = [];
      
      for (const workflow of allWorkflows) {
        try {
          // Use the /use endpoint to get workflow details
          const workflowResponse = await fetch(`http://localhost:8000/api/templates/${workflow.id}/use`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (workflowResponse.ok) {
            const workflowDetail = await workflowResponse.json();
            
            // Check if workflow has nodes that reference other workflows
            // This could be through tags, descriptions, or a workflow_id field in nodes
            if (workflowDetail.nodes && Array.isArray(workflowDetail.nodes)) {
              const hasWorkflowReference = workflowDetail.nodes.some((node: any) => {
                // Check for workflow references in various ways
                const nodeData = node.data || {};
                const hasWorkflowId = node.workflow_id || nodeData.workflow_id;
                const description = (node.description || nodeData.description || '').toLowerCase();
                const name = (node.name || nodeData.name || '').toLowerCase();
                
                // Check if node references another workflow
                return hasWorkflowId || 
                       description.includes('workflow') || 
                       name.includes('workflow') ||
                       (workflow.tags && workflow.tags.some(tag => tag.toLowerCase().includes('workflow')));
              });
              
              // Also check if workflow description or tags indicate it's a workflow of workflows
              const workflowDescription = (workflow.description || '').toLowerCase();
              const isWorkflowOfWorkflows = workflowDescription.includes('workflow of workflows') ||
                                           workflowDescription.includes('composite workflow') ||
                                           workflowDescription.includes('nested workflow') ||
                                           (workflow.tags && workflow.tags.some(tag => 
                                             tag.toLowerCase().includes('workflow-of-workflows') ||
                                             tag.toLowerCase().includes('composite') ||
                                             tag.toLowerCase().includes('nested')
                                           ));
              
              if (hasWorkflowReference || isWorkflowOfWorkflows) {
                workflowsOfWorkflows.push(workflow);
              }
            }
          }
        } catch (error) {
          console.error(`Failed to check workflow ${workflow.id}:`, error);
        }
      }
      
      setWorkflowsOfWorkflows(workflowsOfWorkflows);
    } catch (error) {
      console.error('Failed to fetch workflows of workflows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAgents = async () => {
    setLoading(true);
    try {
      // For now, load from localStorage (until backend API is ready)
      let agentsData = getLocalStorageItem<AgentTemplate[]>('publishedAgents', []);
      
      // One-time migration: Set current user as author for all agents without author_id
      if (user && user.id && agentsData.length > 0) {
        let updated = false;
        agentsData = agentsData.map(agent => {
          if (!agent.author_id) {
            updated = true;
            return {
              ...agent,
              author_id: user.id,
              author_name: user.username || user.email || null
            };
          }
          return agent;
        });
        
        if (updated) {
          logger.debug('[Marketplace] Updated agents with author info:', user.id);
          setLocalStorageItem('publishedAgents', agentsData);
        }
      }
      
      // Debug: Log loaded agents with author info
      logger.debug('[Marketplace] Loaded agents:', agentsData.map(a => ({
        id: a.id,
        name: a.name,
        author_id: a.author_id,
        has_author_id: !!a.author_id
      })));
      
      // Apply filters
      if (category) {
        agentsData = agentsData.filter(a => a.category === category);
      }
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        agentsData = agentsData.filter(a => 
          a.name.toLowerCase().includes(query) || 
          a.description.toLowerCase().includes(query) ||
          a.tags.some(tag => tag.toLowerCase().includes(query))
        );
      }
      
      // Sort: Official agents first, then by selected sort order
      agentsData.sort((a, b) => {
        // First, prioritize official agents
        const aIsOfficial = a.is_official ? 1 : 0;
        const bIsOfficial = b.is_official ? 1 : 0;
        if (aIsOfficial !== bIsOfficial) {
          return bIsOfficial - aIsOfficial; // Official first (1 - 0 = 1, so b comes first)
        }
        
        // If both are official or both are not, apply the selected sort
        if (sortBy === 'popular') {
          // For now, sort by published_at (most recent first)
          const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
          const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
          return dateB - dateA;
        } else if (sortBy === 'recent') {
          const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
          const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
          return dateB - dateA;
        }
        
        // Default: alphabetical by name
        return (a.name || '').localeCompare(b.name || '');
      });
      
      setAgents(agentsData);
    } catch (error) {
      console.error('Failed to fetch agents:', error);
    } finally {
      setLoading(false);
    }
  };

  const useTemplate = async (templateId: string) => {
    try {
      const headers: HeadersInit = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`http://localhost:8000/api/templates/${templateId}/use`, {
        method: 'POST',
        headers
      });

      if (response.ok) {
        const workflow = await response.json();
        console.log('Created workflow from template:', workflow);
        // Navigate to builder with workflow ID and timestamp to ensure new tab is always created
        // The timestamp makes each navigation unique, even for the same workflow
        navigate(`/?workflow=${workflow.id}&_new=${Date.now()}`);
      } else {
        console.error('Failed to use template:', await response.text());
      }
    } catch (error) {
      console.error('Failed to use template:', error);
    }
  };


  const deleteSelectedAgents = async () => {
    if (selectedAgentIds.size === 0) return;
    
    const selectedAgents = agents.filter(a => selectedAgentIds.has(a.id));
    
    // Filter out official agents - they cannot be deleted
    const officialAgents = selectedAgents.filter(a => a.is_official);
    const deletableAgents = selectedAgents.filter(a => !a.is_official);
    
    if (officialAgents.length > 0) {
      showError(`Cannot delete ${officialAgents.length} official agent(s). Official agents cannot be deleted.`);
      if (deletableAgents.length === 0) {
        return; // All selected are official, nothing to delete
      }
    }
    
    // Debug logging
    console.log('[Marketplace] Delete agents check:', {
      selectedCount: deletableAgents.length,
      user: user ? { id: user.id, username: user.username } : null,
      selectedAgents: deletableAgents.map(a => ({
        id: a.id,
        name: a.name,
        author_id: a.author_id,
        author_id_type: typeof a.author_id,
        user_id: user?.id,
        user_id_type: typeof user?.id
      }))
    });
    
    const userOwnedAgents = deletableAgents.filter(a => {
      if (!user || !a.author_id || !user.id) return false;
      const authorIdStr = String(a.author_id);
      const userIdStr = String(user.id);
      const isMatch = authorIdStr === userIdStr;
      console.log(`[Marketplace] Agent ${a.id} ownership:`, {
        authorId: a.author_id,
        authorIdStr,
        userId: user.id,
        userIdStr,
        isMatch
      });
      return isMatch;
    });
    
    console.log('[Marketplace] User owned agents:', userOwnedAgents.length);
    
    if (userOwnedAgents.length === 0) {
      // Check if any agents have author_id set
      const agentsWithAuthorId = deletableAgents.filter(a => a.author_id);
      if (agentsWithAuthorId.length === 0) {
        if (officialAgents.length > 0) {
          showError('Selected agents were published before author tracking was added or are official. Please republish them to enable deletion.');
        } else {
          showError('Selected agents were published before author tracking was added. Please republish them to enable deletion.');
        }
      } else {
        if (officialAgents.length > 0) {
          showError(`You can only delete agents that you published (official agents cannot be deleted). ${deletableAgents.length} selected, ${agentsWithAuthorId.length} have author info, but none match your user ID.`);
        } else {
          showError(`You can only delete agents that you published. ${deletableAgents.length} selected, ${agentsWithAuthorId.length} have author info, but none match your user ID.`);
        }
      }
      return;
    }
    
    if (userOwnedAgents.length < deletableAgents.length) {
      const confirmed = await showConfirm(
        `You can only delete ${userOwnedAgents.length} of ${deletableAgents.length} selected agent(s). Delete only the ones you own?`,
        { title: 'Partial Delete', confirmText: 'Delete', cancelText: 'Cancel', type: 'warning' }
      );
      if (!confirmed) return;
    } else {
      const confirmed = await showConfirm(
        `Are you sure you want to delete ${userOwnedAgents.length} selected agent(s) from the marketplace?`,
        { title: 'Delete Agents', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
      );
      if (!confirmed) return;
    }

    try {
      // Remove from localStorage
      const publishedAgents = localStorage.getItem('publishedAgents');
      if (publishedAgents) {
        const allAgents: AgentTemplate[] = JSON.parse(publishedAgents);
        const agentIdsToDelete = new Set(userOwnedAgents.map(a => a.id));
        const filteredAgents = allAgents.filter(a => !agentIdsToDelete.has(a.id));
        localStorage.setItem('publishedAgents', JSON.stringify(filteredAgents));
        
        // Update state
        setAgents(prevAgents => prevAgents.filter(a => !agentIdsToDelete.has(a.id)));
        setSelectedAgentIds(new Set());
        showSuccess(`Successfully deleted ${userOwnedAgents.length} agent(s)`);
      }
    } catch (error: any) {
      showError(`Failed to delete agents: ${error?.message ?? 'Unknown error'}`);
    }
  };

  const deleteSelectedWorkflows = async () => {
    if (selectedTemplateIds.size === 0) return;
    
    const currentTemplates = activeTab === 'workflows-of-workflows' ? workflowsOfWorkflows : templates;
    const selectedTemplates = currentTemplates.filter(t => selectedTemplateIds.has(t.id));
    
    // Filter out official workflows - they cannot be deleted
    const officialTemplates = selectedTemplates.filter(t => t.is_official);
    const deletableTemplates = selectedTemplates.filter(t => !t.is_official);
    
    if (officialTemplates.length > 0) {
      showError(`Cannot delete ${officialTemplates.length} official workflow(s). Official workflows cannot be deleted.`);
      if (deletableTemplates.length === 0) {
        return; // All selected are official, nothing to delete
      }
    }
    
    const userOwnedTemplates = deletableTemplates.filter(t => user && t.author_id && String(t.author_id) === String(user.id));
    
    if (userOwnedTemplates.length === 0) {
      if (officialTemplates.length > 0) {
        showError('You can only delete workflows that you published (official workflows cannot be deleted)');
      } else {
        showError('You can only delete workflows that you published');
      }
      return;
    }
    
    if (userOwnedTemplates.length < deletableTemplates.length) {
      const confirmed = await showConfirm(
        `You can only delete ${userOwnedTemplates.length} of ${deletableTemplates.length} selected workflow(s). Delete only the ones you own?`,
        { title: 'Partial Delete', confirmText: 'Delete', cancelText: 'Cancel', type: 'warning' }
      );
      if (!confirmed) return;
    } else {
      const confirmed = await showConfirm(
        `Are you sure you want to delete ${userOwnedTemplates.length} selected workflow(s) from the marketplace?`,
        { title: 'Delete Workflows', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
      );
      if (!confirmed) return;
    }

    try {
      // Delete each template via API
      const deletePromises = userOwnedTemplates.map(template => api.deleteTemplate(template.id));
      await Promise.all(deletePromises);
      
      // Update state
      const templateIdsToDelete = new Set(userOwnedTemplates.map(t => t.id));
      setTemplates(prevTemplates => prevTemplates.filter(t => !templateIdsToDelete.has(t.id)));
      setWorkflowsOfWorkflows(prevWorkflows => prevWorkflows.filter(t => !templateIdsToDelete.has(t.id)));
      setSelectedTemplateIds(new Set());
      showSuccess(`Successfully deleted ${userOwnedTemplates.length} workflow(s)`);
    } catch (error: any) {
      const detail = error?.response?.data?.detail ?? error?.message ?? 'Unknown error';
      showError(`Failed to delete workflows: ${detail}`);
    }
  };

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
                            onClick={deleteSelectedWorkflows}
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
                      const activeTabId = localStorage.getItem('activeWorkflowTabId');
                      
                      if (!activeTabId) {
                        showError('No active workflow found. Please open a workflow first.');
                        return;
                      }
                      
                      // Store agents to add in localStorage (more reliable than events)
                      const pendingAgents = {
                        tabId: activeTabId,
                        agents: selectedAgents,
                        timestamp: Date.now()
                      };
                      localStorage.setItem('pendingAgentsToAdd', JSON.stringify(pendingAgents));
                      
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
                            onClick={deleteSelectedAgents}
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
                          onClick={async () => {
                            const selectedAgents = repositoryAgents.filter(a => selectedRepositoryAgentIds.has(a.id));
                            const confirmed = await showConfirm(
                              `Are you sure you want to delete ${selectedAgents.length} selected agent(s) from your repository?`,
                              { title: 'Delete Agents', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
                            );
                            if (!confirmed) return;

                            // Remove from repositoryAgents localStorage
                            const remainingAgents = repositoryAgents.filter(a => !selectedRepositoryAgentIds.has(a.id));
                            localStorage.setItem('repositoryAgents', JSON.stringify(remainingAgents));
                            setRepositoryAgents(remainingAgents);
                            setSelectedRepositoryAgentIds(new Set());
                            showSuccess(`Successfully deleted ${selectedAgents.length} agent(s)`);
                          }}
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
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder={
                activeTab === 'agents' 
                  ? "Search agents..." 
                  : activeTab === 'workflows-of-workflows'
                  ? "Search workflows of workflows..."
                  : "Search workflows..."
              }
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
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
                }
              }}
              className="flex-1 min-w-[300px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            />

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
            >
              <option value="">All Categories</option>
              <option value="content_creation">Content Creation</option>
              <option value="data_analysis">Data Analysis</option>
              <option value="customer_service">Customer Service</option>
              <option value="research">Research</option>
              <option value="automation">Automation</option>
              <option value="education">Education</option>
              <option value="marketing">Marketing</option>
            </select>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Sort:
              </label>
              <select
                id="sort-select"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              >
                <option value="popular">Most Popular</option>
                <option value="recent">Most Recent</option>
                <option value="rating">Highest Rated</option>
              </select>
            </div>

            <button
              onClick={() => {
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
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Search
            </button>
          </div>
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


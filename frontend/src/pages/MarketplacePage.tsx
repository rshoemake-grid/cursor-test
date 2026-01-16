import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Download, Heart, TrendingUp, Clock, Star, ArrowLeft, Trash2 } from 'lucide-react';
import { showError, showSuccess } from '../utils/notifications';
import { showConfirm } from '../utils/confirm';
import { api } from '../api/client';

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
}

export default function MarketplacePage() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular');
  const [selectedTemplateIds, setSelectedTemplateIds] = useState<Set<string>>(new Set());
  
  const { token, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchTemplates();
  }, [category, sortBy]);

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

  const deleteTemplate = async (templateId: string, templateName: string) => {
    const confirmed = await showConfirm(
      `Are you sure you want to delete "${templateName}" from the marketplace?`,
      { title: 'Delete Template', confirmText: 'Delete', cancelText: 'Cancel', type: 'danger' }
    );
    if (!confirmed) return;

    try {
      await api.deleteTemplate(templateId);
      showSuccess('Template deleted successfully');
      // Remove from list
      setTemplates(templates.filter(t => t.id !== templateId));
    } catch (error: any) {
      const detail = error?.response?.data?.detail ?? error?.message ?? 'Unknown error';
      showError(`Failed to delete template: ${detail}`);
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
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
              <h1 className="text-3xl font-bold text-gray-900">Workflow Marketplace</h1>
              <p className="text-gray-600 mt-1">Discover and use pre-built workflow templates</p>
            </div>
            <div className="flex items-center gap-3">
              {selectedTemplateIds.size > 0 && (
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
              )}
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                My Workflows
              </button>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex gap-4 flex-wrap">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchTemplates()}
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
              onClick={fetchTemplates}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Search
            </button>
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No templates found. Try adjusting your filters.</p>
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
                      {user && template.author_id === user.id && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteTemplate(template.id, template.name);
                          }}
                          className="text-red-600 hover:bg-red-50 p-1 rounded"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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


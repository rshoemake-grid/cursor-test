import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { extractApiErrorMessage } from '../hooks/utils/apiUtils';
import { Play, Trash2, Calendar, CheckSquare, Square, ArrowLeft, Copy, Upload, X } from 'lucide-react';
import { showError, showSuccess, showWarning } from '../utils/notifications';
import { showConfirm } from '../utils/confirm';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { TEMPLATE_CATEGORIES, TEMPLATE_DIFFICULTIES, formatCategory, formatDifficulty } from '../config/templateConstants';
import { getDefaultPublishForm, parseTags } from '../utils/publishFormUtils';
export default function WorkflowList({ onSelectWorkflow, onBack }) {
    const [workflows, setWorkflows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const { isAuthenticated, token } = useAuth();
    const navigate = useNavigate();
    const [showPublishModal, setShowPublishModal] = useState(false);
    const [publishingWorkflowId, setPublishingWorkflowId] = useState(null);
    const [publishForm, setPublishForm] = useState(getDefaultPublishForm());
    const [isPublishing, setIsPublishing] = useState(false);
    // Wait for authentication to be ready before loading workflows
    // This prevents race condition where API call happens before token is loaded from storage
    useEffect(()=>{
        // Only load workflows if we have a token (authenticated) or if we've determined auth state
        // If token is null but we're checking auth, wait a bit for AuthContext to finish loading
        if (token !== null || isAuthenticated) {
            loadWorkflows();
        } else {
            // If no token and not authenticated, check again after a short delay
            // This handles the case where AuthContext is still loading from storage
            const timeoutId = setTimeout(()=>{
                // Only try to load if we still don't have a token after delay
                // This prevents unnecessary API calls when user is not logged in
                if (token === null && !isAuthenticated) {
                    setLoading(false);
                } else if (token !== null || isAuthenticated) {
                    loadWorkflows();
                }
            }, 100);
            return ()=>clearTimeout(timeoutId);
        }
    }, [
        token,
        isAuthenticated
    ]);
    const loadWorkflows = async ()=>{
        setLoading(true);
        try {
            const data = await api.getWorkflows();
            setWorkflows(data);
        } catch (error) {
            // Handle 401 errors specifically
            if (error.response?.status === 401) {
                showError('Authentication required. Please log in again.');
            // Don't show generic error message for 401
            } else {
                showError('Failed to load workflows: ' + extractApiErrorMessage(error, 'Unknown error'));
            }
        } finally{
            setLoading(false);
        }
    };
    const handleDelete = async (id)=>{
        const confirmed = await showConfirm('Are you sure you want to delete this workflow?', {
            title: 'Delete Workflow',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });
        if (!confirmed) return;
        try {
            await api.deleteWorkflow(id);
            setWorkflows(workflows.filter((w)=>w.id !== id));
            setSelectedIds((prev)=>{
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
            showSuccess('Workflow deleted successfully');
        } catch (error) {
            showError('Failed to delete workflow: ' + extractApiErrorMessage(error, 'Unknown error'));
        }
    };
    const handleBulkDuplicate = async ()=>{
        if (selectedIds.size === 0) {
            showWarning('Please select at least one workflow to duplicate');
            return;
        }
        const count = selectedIds.size;
        const confirmed = await showConfirm(`Duplicate ${count} workflow(s)? Each will be created with "-copy" appended to the name.`, {
            title: 'Duplicate Workflows',
            confirmText: 'Duplicate',
            cancelText: 'Cancel'
        });
        if (!confirmed) return;
        try {
            const ids = Array.from(selectedIds);
            const duplicatedNames = [];
            // Duplicate each selected workflow
            for (const id of ids){
                try {
                    const duplicated = await api.duplicateWorkflow(id);
                    duplicatedNames.push(duplicated.name);
                } catch (error) {
                    showError(`Failed to duplicate workflow ${id}: ${extractApiErrorMessage(error, 'Unknown error')}`);
                }
            }
            // Reload workflows to show the new duplicates
            await loadWorkflows();
            setSelectedIds(new Set());
            if (duplicatedNames.length > 0) {
                showSuccess(`Successfully duplicated ${duplicatedNames.length} workflow(s)`);
            }
        } catch (error) {
            showError('Failed to duplicate workflows: ' + extractApiErrorMessage(error, 'Unknown error'));
        }
    };
    const handleToggleSelect = (id)=>{
        setSelectedIds((prev)=>{
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };
    const handleSelectAll = ()=>{
        if (selectedIds.size === workflows.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(workflows.map((w)=>w.id).filter(Boolean)));
        }
    };
    const openPublishModal = (workflowId)=>{
        if (!isAuthenticated) {
            showError('Please log in to publish workflows to the marketplace.');
            return;
        }
        setPublishingWorkflowId(workflowId);
        setPublishForm({
            category: 'automation',
            tags: '',
            difficulty: 'beginner',
            estimated_time: ''
        });
        setShowPublishModal(true);
    };
    const handlePublishFormChange = (field, value)=>{
        setPublishForm((prev)=>({
                ...prev,
                [field]: value
            }));
    };
    const handlePublish = async (event)=>{
        event.preventDefault();
        if (!publishingWorkflowId) {
            showError('No workflow selected for publishing.');
            return;
        }
        setIsPublishing(true);
        try {
            const tagsArray = parseTags(publishForm.tags);
            const published = await api.publishWorkflow(publishingWorkflowId, {
                category: publishForm.category,
                tags: tagsArray,
                difficulty: publishForm.difficulty,
                estimated_time: publishForm.estimated_time || undefined
            });
            showSuccess(`Published "${published.name}" to the marketplace.`);
            setShowPublishModal(false);
            setPublishingWorkflowId(null);
        } catch (error) {
            const detail = extractApiErrorMessage(error, 'Unknown error');
            showError(`Failed to publish workflow: ${detail}`);
        } finally{
            setIsPublishing(false);
        }
    };
    const handleBulkDelete = async ()=>{
        if (selectedIds.size === 0) {
            showWarning('Please select at least one workflow to delete');
            return;
        }
        const count = selectedIds.size;
        const confirmed = await showConfirm(`Are you sure you want to delete ${count} workflow(s)?`, {
            title: 'Delete Workflows',
            confirmText: 'Delete',
            cancelText: 'Cancel',
            type: 'danger'
        });
        if (!confirmed) return;
        try {
            const ids = Array.from(selectedIds);
            const result = await api.bulkDeleteWorkflows(ids);
            // Remove deleted workflows from the list
            setWorkflows(workflows.filter((w)=>!selectedIds.has(w.id || '')));
            setSelectedIds(new Set());
            if (result.failed_ids && result.failed_ids.length > 0) {
                showError(`${result.message}\nFailed IDs: ${result.failed_ids.join(', ')}`);
            } else {
                showSuccess(`Successfully deleted ${result.deleted_count} workflow(s)`);
            }
        } catch (error) {
            showError('Failed to delete workflows: ' + extractApiErrorMessage(error, 'Unknown error'));
        }
    };
    if (loading) {
        return /*#__PURE__*/ _jsx("div", {
            className: "flex items-center justify-center h-full",
            children: /*#__PURE__*/ _jsx("div", {
                className: "text-gray-500",
                children: "Loading workflows..."
            })
        });
    }
    if (workflows.length === 0) {
        return /*#__PURE__*/ _jsx("div", {
            className: "flex items-center justify-center h-full",
            children: /*#__PURE__*/ _jsx("div", {
                className: "text-center",
                children: !isAuthenticated ? /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-gray-500 mb-2",
                            children: "Showing anonymous workflows only"
                        }),
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-sm text-gray-400 mb-4",
                            children: "Log in to see your workflows"
                        }),
                        /*#__PURE__*/ _jsx("button", {
                            onClick: ()=>navigate('/auth'),
                            className: "px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors",
                            children: "Log In"
                        })
                    ]
                }) : /*#__PURE__*/ _jsxs(_Fragment, {
                    children: [
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-gray-500 mb-4",
                            children: "No workflows yet"
                        }),
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-sm text-gray-400",
                            children: "Create your first workflow in the Builder"
                        })
                    ]
                })
            })
        });
    }
    return /*#__PURE__*/ _jsxs("div", {
        className: "h-full overflow-y-auto",
        children: [
            /*#__PURE__*/ _jsxs("div", {
                className: "p-6",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center justify-between mb-6",
                        children: [
                            /*#__PURE__*/ _jsxs("div", {
                                className: "flex items-center gap-4",
                                children: [
                                    onBack && /*#__PURE__*/ _jsx("button", {
                                        onClick: onBack,
                                        className: "p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors",
                                        title: "Back to builder",
                                        children: /*#__PURE__*/ _jsx(ArrowLeft, {
                                            className: "w-5 h-5"
                                        })
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        children: [
                                            /*#__PURE__*/ _jsx("h2", {
                                                className: "text-2xl font-bold text-gray-900",
                                                children: "My Workflows"
                                            }),
                                            !isAuthenticated && /*#__PURE__*/ _jsxs("p", {
                                                className: "text-sm text-gray-500 mt-1",
                                                children: [
                                                    "Showing anonymous workflows only. ",
                                                    /*#__PURE__*/ _jsx("button", {
                                                        onClick: ()=>navigate('/auth'),
                                                        className: "text-primary-600 hover:text-primary-700 underline",
                                                        children: "Log in"
                                                    }),
                                                    " to see your workflows."
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }),
                            selectedIds.size > 0 && /*#__PURE__*/ _jsxs("div", {
                                className: "flex items-center gap-3",
                                children: [
                                    /*#__PURE__*/ _jsxs("span", {
                                        className: "text-sm text-gray-600",
                                        children: [
                                            selectedIds.size,
                                            " selected"
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("button", {
                                        onClick: handleBulkDuplicate,
                                        className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ _jsx(Copy, {
                                                className: "w-4 h-4"
                                            }),
                                            "Duplicate Selected (",
                                            selectedIds.size,
                                            ")"
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("button", {
                                        onClick: handleBulkDelete,
                                        className: "px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2",
                                        children: [
                                            /*#__PURE__*/ _jsx(Trash2, {
                                                className: "w-4 h-4"
                                            }),
                                            "Delete Selected (",
                                            selectedIds.size,
                                            ")"
                                        ]
                                    })
                                ]
                            })
                        ]
                    }),
                    workflows.length > 0 && /*#__PURE__*/ _jsx("div", {
                        className: "mb-4 flex items-center gap-2",
                        children: /*#__PURE__*/ _jsxs("button", {
                            onClick: handleSelectAll,
                            className: "flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg",
                            children: [
                                selectedIds.size === workflows.length ? /*#__PURE__*/ _jsx(CheckSquare, {
                                    className: "w-5 h-5 text-primary-600"
                                }) : /*#__PURE__*/ _jsx(Square, {
                                    className: "w-5 h-5 text-gray-400"
                                }),
                                /*#__PURE__*/ _jsx("span", {
                                    children: selectedIds.size === workflows.length ? 'Deselect All' : 'Select All'
                                })
                            ]
                        })
                    }),
                    /*#__PURE__*/ _jsx("div", {
                        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-6",
                        children: workflows.map((workflow)=>{
                            const isSelected = workflow.id && selectedIds.has(workflow.id);
                            const hasSelection = selectedIds.size > 0;
                            return /*#__PURE__*/ _jsxs("div", {
                                className: `bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow border-2 ${isSelected ? 'border-primary-500 bg-primary-50' : 'border-transparent'} ${hasSelection ? '' : 'cursor-pointer'}`,
                                onClick: (e)=>{
                                    // Only navigate if clicking on the card itself, not on interactive elements
                                    // If any workflows are selected, don't navigate (selection mode)
                                    if (!hasSelection && e.target === e.currentTarget || e.target.closest('.workflow-content')) {
                                        workflow.id && onSelectWorkflow(workflow.id);
                                    }
                                },
                                children: [
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "flex items-start justify-between mb-3",
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "flex items-start gap-3 flex-1",
                                                children: [
                                                    /*#__PURE__*/ _jsx("button", {
                                                        onClick: (e)=>{
                                                            e.stopPropagation();
                                                            workflow.id && handleToggleSelect(workflow.id);
                                                        },
                                                        className: "mt-1 flex-shrink-0",
                                                        title: isSelected ? 'Deselect workflow' : 'Select workflow',
                                                        children: isSelected ? /*#__PURE__*/ _jsx(CheckSquare, {
                                                            className: "w-5 h-5 text-primary-600"
                                                        }) : /*#__PURE__*/ _jsx(Square, {
                                                            className: "w-5 h-5 text-gray-400"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsxs("div", {
                                                        className: "flex-1 workflow-content",
                                                        onClick: (e)=>{
                                                            // Prevent navigation when clicking on content if in selection mode
                                                            if (hasSelection) {
                                                                e.stopPropagation();
                                                            }
                                                        },
                                                        children: [
                                                            /*#__PURE__*/ _jsx("h3", {
                                                                className: "font-semibold text-gray-900",
                                                                children: workflow.name
                                                            }),
                                                            workflow.description && /*#__PURE__*/ _jsx("p", {
                                                                className: "text-sm text-gray-600 mt-1",
                                                                children: workflow.description
                                                            })
                                                        ]
                                                    })
                                                ]
                                            }),
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "flex items-center gap-1 flex-shrink-0",
                                                children: [
                                                    isAuthenticated && /*#__PURE__*/ _jsx("button", {
                                                        onClick: (e)=>{
                                                            e.stopPropagation();
                                                            workflow.id && openPublishModal(workflow.id);
                                                        },
                                                        className: "text-blue-600 hover:bg-blue-50 p-1 rounded",
                                                        title: "Publish to marketplace",
                                                        children: /*#__PURE__*/ _jsx(Upload, {
                                                            className: "w-4 h-4"
                                                        })
                                                    }),
                                                    /*#__PURE__*/ _jsx("button", {
                                                        onClick: (e)=>{
                                                            e.stopPropagation();
                                                            workflow.id && handleDelete(workflow.id);
                                                        },
                                                        className: "text-red-600 hover:bg-red-50 p-1 rounded",
                                                        title: "Delete workflow",
                                                        children: /*#__PURE__*/ _jsx(Trash2, {
                                                            className: "w-4 h-4"
                                                        })
                                                    })
                                                ]
                                            })
                                        ]
                                    }),
                                    /*#__PURE__*/ _jsxs("div", {
                                        className: "flex items-center gap-4 text-sm text-gray-500 workflow-content",
                                        onClick: (e)=>{
                                            // Prevent navigation when clicking on metadata if in selection mode
                                            if (hasSelection) {
                                                e.stopPropagation();
                                            }
                                        },
                                        children: [
                                            /*#__PURE__*/ _jsxs("div", {
                                                className: "flex items-center gap-1",
                                                children: [
                                                    /*#__PURE__*/ _jsx(Play, {
                                                        className: "w-4 h-4"
                                                    }),
                                                    workflow.nodes?.length || 0,
                                                    " nodes"
                                                ]
                                            }),
                                            workflow.created_at && /*#__PURE__*/ _jsxs("div", {
                                                className: "flex items-center gap-1",
                                                children: [
                                                    /*#__PURE__*/ _jsx(Calendar, {
                                                        className: "w-4 h-4"
                                                    }),
                                                    new Date(workflow.created_at).toLocaleDateString()
                                                ]
                                            })
                                        ]
                                    })
                                ]
                            }, workflow.id);
                        })
                    })
                ]
            }),
            showPublishModal && /*#__PURE__*/ _jsx("div", {
                className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40",
                children: /*#__PURE__*/ _jsxs("form", {
                    onSubmit: handlePublish,
                    className: "bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4",
                    children: [
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex items-center justify-between",
                            children: [
                                /*#__PURE__*/ _jsx("h3", {
                                    className: "text-lg font-semibold text-gray-900",
                                    children: "Publish to Marketplace"
                                }),
                                /*#__PURE__*/ _jsx("button", {
                                    type: "button",
                                    onClick: ()=>{
                                        setShowPublishModal(false);
                                        setPublishingWorkflowId(null);
                                    },
                                    className: "text-gray-500 hover:text-gray-700",
                                    children: /*#__PURE__*/ _jsx(X, {
                                        className: "w-5 h-5"
                                    })
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            children: [
                                /*#__PURE__*/ _jsx("label", {
                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                    children: "Category"
                                }),
                                /*#__PURE__*/ _jsx("select", {
                                    value: publishForm.category,
                                    onChange: (e)=>handlePublishFormChange('category', e.target.value),
                                    className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                                    children: TEMPLATE_CATEGORIES.map((category)=>/*#__PURE__*/ _jsx("option", {
                                            value: category,
                                            children: formatCategory(category)
                                        }, category))
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex gap-4",
                            children: [
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex-1",
                                    children: [
                                        /*#__PURE__*/ _jsx("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: "Difficulty"
                                        }),
                                        /*#__PURE__*/ _jsx("select", {
                                            value: publishForm.difficulty,
                                            onChange: (e)=>handlePublishFormChange('difficulty', e.target.value),
                                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                                            children: TEMPLATE_DIFFICULTIES.map((diff)=>/*#__PURE__*/ _jsx("option", {
                                                    value: diff,
                                                    children: formatDifficulty(diff)
                                                }, diff))
                                        })
                                    ]
                                }),
                                /*#__PURE__*/ _jsxs("div", {
                                    className: "flex-1",
                                    children: [
                                        /*#__PURE__*/ _jsx("label", {
                                            className: "block text-sm font-medium text-gray-700 mb-1",
                                            children: "Estimated Time"
                                        }),
                                        /*#__PURE__*/ _jsx("input", {
                                            type: "text",
                                            value: publishForm.estimated_time,
                                            onChange: (e)=>handlePublishFormChange('estimated_time', e.target.value),
                                            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                                            placeholder: "e.g. 30 minutes"
                                        })
                                    ]
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            children: [
                                /*#__PURE__*/ _jsx("label", {
                                    className: "block text-sm font-medium text-gray-700 mb-1",
                                    children: "Tags (comma separated)"
                                }),
                                /*#__PURE__*/ _jsx("input", {
                                    type: "text",
                                    value: publishForm.tags,
                                    onChange: (e)=>handlePublishFormChange('tags', e.target.value),
                                    className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                                    placeholder: "automation, ai, ..."
                                })
                            ]
                        }),
                        /*#__PURE__*/ _jsxs("div", {
                            className: "flex justify-end gap-2",
                            children: [
                                /*#__PURE__*/ _jsx("button", {
                                    type: "button",
                                    onClick: ()=>{
                                        setShowPublishModal(false);
                                        setPublishingWorkflowId(null);
                                    },
                                    className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50",
                                    children: "Cancel"
                                }),
                                /*#__PURE__*/ _jsx("button", {
                                    type: "submit",
                                    disabled: isPublishing,
                                    className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2",
                                    children: isPublishing ? 'Publishing...' : 'Publish'
                                })
                            ]
                        })
                    ]
                })
            })
        ]
    });
}

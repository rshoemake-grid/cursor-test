import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { X, Trash2, Save, Check } from 'lucide-react';
import { useState } from 'react';
import { isAgentNode, isConditionNode, isLoopNode, isInputNode, isToolNode } from '../types/nodeData';
import AgentNodeEditor from './editors/AgentNodeEditor';
import ConditionNodeEditor from './editors/ConditionNodeEditor';
import LoopNodeEditor from './editors/LoopNodeEditor';
import InputNodeEditor from './editors/InputNodeEditor';
import DatabaseNodeEditor from './editors/DatabaseNodeEditor';
import FirebaseNodeEditor from './editors/FirebaseNodeEditor';
import BigQueryNodeEditor from './editors/BigQueryNodeEditor';
import ToolNodeEditor from './editors/ToolNodeEditor';
import { defaultAdapters } from '../types/adapters';
// Domain-based imports - Phase 7
import { useNodeForm, useSelectedNode, useNodeOperations } from '../hooks/nodes';
import { usePanelState } from '../hooks/ui';
import { useLoopConfig } from '../hooks/forms';
// DRY: Use centralized null checks
import { isNotNullOrUndefined, hasMultipleSelected, isExplicitlyFalse, safeArray } from '../utils/nullChecks';
// DRY: Extract input configuration component
import { InputConfiguration } from './PropertyPanel/InputConfiguration';
// Domain-based imports - Phase 7
import { useLLMProviders } from '../hooks/providers';
import { useAuth } from '../contexts/AuthContext';
export default function PropertyPanel({ selectedNodeId, setSelectedNodeId, selectedNodeIds, nodes: nodesProp, onSave, onSaveWorkflow, storage = defaultAdapters.createLocalStorageAdapter() }) {
    const { isAuthenticated } = useAuth();
    const { availableModels } = useLLMProviders({
        storage,
        isAuthenticated
    });
    // Node selection hook
    const { selectedNode } = useSelectedNode({
        selectedNodeId,
        nodesProp
    });
    // Panel state hook
    const { panelOpen, setPanelOpen, saveStatus, setSaveStatus, closePanel } = usePanelState({
        selectedNode
    });
    // Loop config initialization hook
    useLoopConfig({
        selectedNode
    });
    // Node operations hook
    const nodeOperations = useNodeOperations({
        selectedNode,
        setSelectedNodeId,
        onSave,
        onSaveWorkflow
    });
    const { handleUpdate, handleConfigUpdate, handleDelete, handleSave, handleAddInput: handleAddInputOperation, handleRemoveInput, handleUpdateInput } = nodeOperations;
    // Node form state management - MUST be called before any early returns (Rules of Hooks)
    const nodeForm = useNodeForm({
        selectedNode,
        onUpdate: handleUpdate
    });
    const { nameValue, descriptionValue, nameInputRef, descriptionInputRef, handleNameChange, handleDescriptionChange } = nodeForm;
    // Local state - MUST be called before any early returns (Rules of Hooks)
    const [showAddInput, setShowAddInput] = useState(false);
    // LLM providers are now loaded via useLLMProviders hook
    // DRY: Use centralized null check utilities
    const multipleSelected = hasMultipleSelected(selectedNodeIds);
    // DRY: Use centralized null check
    if (!isNotNullOrUndefined(selectedNode)) {
        return null;
    }
    // DRY: Use centralized false check
    if (isExplicitlyFalse(panelOpen)) {
        return /*#__PURE__*/ _jsx("div", {
            className: "fixed right-0 top-1/2 -translate-y-1/2 z-10",
            children: /*#__PURE__*/ _jsx("button", {
                onClick: ()=>setPanelOpen(true),
                className: "px-3 py-2 text-xs bg-white border border-gray-300 rounded-l-full shadow hover:bg-gray-100 focus:outline-none",
                title: "Reopen properties panel",
                children: "Properties"
            })
        });
    }
    // DRY: Use centralized check
    if (multipleSelected) {
        return /*#__PURE__*/ _jsxs("div", {
            className: "w-80 h-full bg-white border-l border-gray-200 p-4 overflow-y-auto",
            children: [
                /*#__PURE__*/ _jsx("h3", {
                    className: "text-lg font-semibold text-gray-900 mb-4",
                    children: "Properties"
                }),
                /*#__PURE__*/ _jsxs("div", {
                    className: "text-sm text-gray-500 mb-2",
                    children: [
                        /*#__PURE__*/ _jsxs("p", {
                            className: "mb-2",
                            children: [
                                "Multiple nodes selected (",
                                selectedNodeIds?.size,
                                ")"
                            ]
                        }),
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-xs text-gray-400",
                            children: "Select a single node to edit its properties"
                        }),
                        /*#__PURE__*/ _jsx("p", {
                            className: "text-xs text-gray-400 mt-2",
                            children: "You can drag selected nodes together to move them"
                        })
                    ]
                })
            ]
        });
    }
    const handleClose = ()=>{
        // Just close the panel (deselect node) without deleting
        setSelectedNodeId(null);
        closePanel();
    };
    const handleSaveWrapper = async ()=>{
        await handleSave(setSaveStatus);
    };
    const handleAddInput = (inputName, sourceNode, sourceField)=>{
        handleAddInputOperation(inputName, sourceNode, sourceField, setShowAddInput);
    };
    // DRY: Get safe inputs array
    const nodeInputs = safeArray(selectedNode.data.inputs);
    return /*#__PURE__*/ _jsxs("div", {
        className: "relative w-80 h-full bg-white border-l border-gray-200 p-4 overflow-y-auto",
        children: [
            /*#__PURE__*/ _jsx("button", {
                onClick: handleClose,
                className: "absolute top-3 right-3 p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors",
                title: "Close properties panel",
                children: /*#__PURE__*/ _jsx(X, {
                    className: "w-4 h-4"
                })
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "flex items-center justify-between mb-4",
                children: [
                    /*#__PURE__*/ _jsx("h3", {
                        className: "text-lg font-semibold text-gray-900",
                        children: "Properties"
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        className: "flex items-center gap-2",
                        children: [
                            /*#__PURE__*/ _jsx("button", {
                                onClick: handleSaveWrapper,
                                disabled: saveStatus === 'saving',
                                className: `px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${saveStatus === 'saved' ? 'bg-green-100 text-green-700' : saveStatus === 'saving' ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-primary-600 text-white hover:bg-primary-700'}`,
                                title: "Save changes",
                                children: saveStatus === 'saved' ? /*#__PURE__*/ _jsxs(_Fragment, {
                                    children: [
                                        /*#__PURE__*/ _jsx(Check, {
                                            className: "w-4 h-4"
                                        }),
                                        "Saved"
                                    ]
                                }) : saveStatus === 'saving' ? /*#__PURE__*/ _jsxs(_Fragment, {
                                    children: [
                                        /*#__PURE__*/ _jsx(Save, {
                                            className: "w-4 h-4 animate-pulse"
                                        }),
                                        "Saving..."
                                    ]
                                }) : /*#__PURE__*/ _jsxs(_Fragment, {
                                    children: [
                                        /*#__PURE__*/ _jsx(Save, {
                                            className: "w-4 h-4"
                                        }),
                                        "Save"
                                    ]
                                })
                            }),
                            /*#__PURE__*/ _jsx("button", {
                                onClick: handleDelete,
                                className: "p-1 text-red-600 hover:bg-red-50 rounded",
                                title: "Delete node",
                                "aria-label": "Delete selected node",
                                children: /*#__PURE__*/ _jsx(Trash2, {
                                    className: "w-4 h-4"
                                })
                            })
                        ]
                    })
                ]
            }),
            /*#__PURE__*/ _jsxs("div", {
                className: "space-y-4",
                children: [
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Name"
                            }),
                            /*#__PURE__*/ _jsx("input", {
                                ref: nameInputRef,
                                type: "text",
                                value: nameValue,
                                onChange: (e)=>handleNameChange(e.target.value),
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            })
                        ]
                    }),
                    /*#__PURE__*/ _jsxs("div", {
                        children: [
                            /*#__PURE__*/ _jsx("label", {
                                htmlFor: "node-description",
                                className: "block text-sm font-medium text-gray-700 mb-1",
                                children: "Description"
                            }),
                            /*#__PURE__*/ _jsx("textarea", {
                                id: "node-description",
                                ref: descriptionInputRef,
                                value: descriptionValue,
                                onChange: (e)=>handleDescriptionChange(e.target.value),
                                rows: 3,
                                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent",
                                "aria-label": "Node description"
                            })
                        ]
                    }),
                    selectedNode.type !== 'start' && selectedNode.type !== 'end' && /*#__PURE__*/ _jsx(InputConfiguration, {
                        inputs: nodeInputs,
                        showAddInput: showAddInput,
                        onAddInput: handleAddInput,
                        onRemoveInput: handleRemoveInput,
                        onUpdateInput: handleUpdateInput,
                        onShowAddInput: setShowAddInput
                    }),
                    isToolNode(selectedNode) && /*#__PURE__*/ _jsx(ToolNodeEditor, {
                        node: selectedNode,
                        onUpdate: handleUpdate,
                        onConfigUpdate: handleConfigUpdate
                    }),
                    isAgentNode(selectedNode) && /*#__PURE__*/ _jsx(AgentNodeEditor, {
                        node: selectedNode,
                        availableModels: availableModels,
                        onUpdate: handleUpdate,
                        onConfigUpdate: handleConfigUpdate
                    }),
                    isConditionNode(selectedNode) && /*#__PURE__*/ _jsx(ConditionNodeEditor, {
                        node: selectedNode,
                        onConfigUpdate: handleConfigUpdate
                    }),
                    isLoopNode(selectedNode) && /*#__PURE__*/ _jsx(LoopNodeEditor, {
                        node: selectedNode,
                        onUpdate: handleUpdate,
                        onConfigUpdate: handleConfigUpdate
                    }),
                    isInputNode(selectedNode) && [
                        'gcp_bucket',
                        'aws_s3',
                        'gcp_pubsub',
                        'local_filesystem'
                    ].includes(selectedNode.type) && /*#__PURE__*/ _jsx(InputNodeEditor, {
                        node: selectedNode,
                        onConfigUpdate: handleConfigUpdate
                    }),
                    selectedNode.type === 'database' && /*#__PURE__*/ _jsx(DatabaseNodeEditor, {
                        node: selectedNode,
                        onConfigUpdate: handleConfigUpdate
                    }),
                    selectedNode.type === 'firebase' && /*#__PURE__*/ _jsx(FirebaseNodeEditor, {
                        node: selectedNode,
                        onConfigUpdate: handleConfigUpdate
                    }),
                    selectedNode.type === 'bigquery' && /*#__PURE__*/ _jsx(BigQueryNodeEditor, {
                        node: selectedNode,
                        onConfigUpdate: handleConfigUpdate
                    })
                ]
            })
        ]
    });
}

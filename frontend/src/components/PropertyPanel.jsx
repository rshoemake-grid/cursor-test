import { X, Trash2, Save, Check } from "lucide-react";
import { useState } from "react";
import {
  isAgentNode,
  isConditionNode,
  isLoopNode,
  isInputNode,
  isToolNode,
} from "../types/nodeData";
import AgentNodeEditor from "./editors/AgentNodeEditor";
import ConditionNodeEditor from "./editors/ConditionNodeEditor";
import LoopNodeEditor from "./editors/LoopNodeEditor";
import InputNodeEditor from "./editors/InputNodeEditor";
import DatabaseNodeEditor from "./editors/DatabaseNodeEditor";
import FirebaseNodeEditor from "./editors/FirebaseNodeEditor";
import BigQueryNodeEditor from "./editors/BigQueryNodeEditor";
import ToolNodeEditor from "./editors/ToolNodeEditor";
import { defaultAdapters } from "../types/adapters";
import {
  useNodeForm,
  useSelectedNode,
  useNodeOperations,
} from "../hooks/nodes";
import { usePanelState } from "../hooks/ui";
import { useLoopConfig } from "../hooks/forms";
import {
  isNotNullOrUndefined,
  hasMultipleSelected,
  isExplicitlyFalse,
  safeArray,
} from "../utils/nullChecks";
import { InputConfiguration } from "./PropertyPanel/InputConfiguration";
import { useLLMProviders } from "../hooks/providers";
import { useAuth } from "../contexts/AuthContext";
function PropertyPanel({
  selectedNodeId,
  setSelectedNodeId,
  selectedNodeIds,
  nodes: nodesProp,
  onSave,
  onSaveWorkflow,
  storage = defaultAdapters.createLocalStorageAdapter(),
}) {
  const { isAuthenticated } = useAuth();
  const { availableModels } = useLLMProviders({
    storage,
    isAuthenticated,
  });
  const { selectedNode } = useSelectedNode({
    selectedNodeId,
    nodesProp,
  });
  const { panelOpen, setPanelOpen, saveStatus, setSaveStatus, closePanel } =
    usePanelState({
      selectedNode,
    });
  useLoopConfig({
    selectedNode,
  });
  const nodeOperations = useNodeOperations({
    selectedNode,
    setSelectedNodeId,
    onSave,
    onSaveWorkflow,
  });
  const {
    handleUpdate,
    handleConfigUpdate,
    handleDelete,
    handleSave,
    handleAddInput: handleAddInputOperation,
    handleRemoveInput,
    handleUpdateInput,
  } = nodeOperations;
  const nodeForm = useNodeForm({
    selectedNode,
    onUpdate: handleUpdate,
  });
  const {
    nameValue,
    descriptionValue,
    nameInputRef,
    descriptionInputRef,
    handleNameChange,
    handleDescriptionChange,
  } = nodeForm;
  const [showAddInput, setShowAddInput] = useState(false);
  const multipleSelected = hasMultipleSelected(selectedNodeIds);
  if (!isNotNullOrUndefined(selectedNode)) {
    return null;
  }
  if (isExplicitlyFalse(panelOpen)) {
    return (
      <div className="fixed right-0 top-1/2 -translate-y-1/2 z-10">
        <button
          onClick={() => setPanelOpen(true)}
          className="px-3 py-2 text-xs bg-white border border-gray-300 rounded-l-full shadow hover:bg-gray-100 focus:outline-none"
          title="Reopen properties panel"
        >
          Properties
        </button>
      </div>
    );
  }
  if (multipleSelected) {
    return (
      <div className="w-80 h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Properties</h3>
        <div className="text-sm text-gray-500 mb-2">
          <p className="mb-2">
            Multiple nodes selected ({selectedNodeIds?.size})
          </p>
          <p className="text-xs text-gray-400">
            Select a single node to edit its properties
          </p>
          <p className="text-xs text-gray-400 mt-2">
            You can drag selected nodes together to move them
          </p>
        </div>
      </div>
    );
  }
  const handleClose = () => {
    setSelectedNodeId(null);
    closePanel();
  };
  const handleSaveWrapper = async () => {
    await handleSave(setSaveStatus);
  };
  const handleAddInput = (inputName, sourceNode, sourceField) => {
    handleAddInputOperation(
      inputName,
      sourceNode,
      sourceField,
      setShowAddInput,
    );
  };
  const nodeInputs = safeArray(selectedNode.data.inputs);
  return (
    <div className="relative w-80 h-full bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <button
        onClick={handleClose}
        className="absolute top-3 right-3 p-1 text-gray-500 hover:bg-gray-100 rounded-full transition-colors"
        title="Close properties panel"
      >
        <X className="w-4 h-4" />
      </button>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Properties</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSaveWrapper}
            disabled={saveStatus === "saving"}
            className={`px-3 py-1.5 text-sm rounded-lg flex items-center gap-2 transition-colors ${saveStatus === "saved" ? "bg-green-100 text-green-700" : saveStatus === "saving" ? "bg-gray-100 text-gray-500 cursor-not-allowed" : "bg-primary-600 text-white hover:bg-primary-700"}`}
            title="Save changes"
          >
            {saveStatus === "saved" ? (
              <>
                <Check className="w-4 h-4" />
                Saved
              </>
            ) : saveStatus === "saving" ? (
              <>
                <Save className="w-4 h-4 animate-pulse" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save
              </>
            )}
          </button>
          <button
            onClick={handleDelete}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title="Delete node"
            aria-label="Delete selected node"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Name
          </label>
          <input
            ref={nameInputRef}
            type="text"
            value={nameValue}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
        <div>
          <label
            htmlFor="node-description"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Description
          </label>
          <textarea
            id="node-description"
            ref={descriptionInputRef}
            value={descriptionValue}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            aria-label="Node description"
          />
        </div>
        {selectedNode.type !== "start" && selectedNode.type !== "end" && (
          <InputConfiguration
            inputs={nodeInputs}
            showAddInput={showAddInput}
            onAddInput={handleAddInput}
            onRemoveInput={handleRemoveInput}
            onUpdateInput={handleUpdateInput}
            onShowAddInput={setShowAddInput}
          />
        )}
        {isToolNode(selectedNode) && (
          <ToolNodeEditor
            node={selectedNode}
            onUpdate={handleUpdate}
            onConfigUpdate={handleConfigUpdate}
          />
        )}
        {isAgentNode(selectedNode) && (
          <AgentNodeEditor
            node={selectedNode}
            availableModels={availableModels}
            onUpdate={handleUpdate}
            onConfigUpdate={handleConfigUpdate}
          />
        )}
        {isConditionNode(selectedNode) && (
          <ConditionNodeEditor
            node={selectedNode}
            onConfigUpdate={handleConfigUpdate}
          />
        )}
        {isLoopNode(selectedNode) && (
          <LoopNodeEditor
            node={selectedNode}
            onUpdate={handleUpdate}
            onConfigUpdate={handleConfigUpdate}
          />
        )}
        {isInputNode(selectedNode) &&
          ["gcp_bucket", "aws_s3", "gcp_pubsub", "local_filesystem"].includes(
            selectedNode.type,
          ) && (
            <InputNodeEditor
              node={selectedNode}
              onConfigUpdate={handleConfigUpdate}
            />
          )}
        {selectedNode.type === "database" && (
          <DatabaseNodeEditor
            node={selectedNode}
            onConfigUpdate={handleConfigUpdate}
          />
        )}
        {selectedNode.type === "firebase" && (
          <FirebaseNodeEditor
            node={selectedNode}
            onConfigUpdate={handleConfigUpdate}
          />
        )}
        {selectedNode.type === "bigquery" && (
          <BigQueryNodeEditor
            node={selectedNode}
            onConfigUpdate={handleConfigUpdate}
          />
        )}
      </div>
    </div>
  );
}
export { PropertyPanel as default };

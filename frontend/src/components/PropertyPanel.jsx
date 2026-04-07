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
import {
  PropertyPanelPeekWrap,
  PropertyPanelPeekBtn,
  PropertyPanelAside,
  PropertyPanelAsideRelative,
  PropertyPanelTitle,
  PropertyPanelMutedBlock,
  PropertyPanelMutedP,
  PropertyPanelHint,
  PropertyPanelHintSpaced,
  PropertyPanelCloseBtn,
  PropertyPanelHeaderRow,
  PropertyPanelHeaderActions,
  PropertyPanelSaveBtn,
  PropertyPanelSaveIconPulse,
  PropertyPanelDeleteBtn,
  PropertyPanelStack,
  PropertyPanelFieldLabel,
  PropertyPanelInput,
  PropertyPanelTextarea,
} from "../styles/propertyPanel.styled";

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
      <PropertyPanelPeekWrap>
        <PropertyPanelPeekBtn
          onClick={() => setPanelOpen(true)}
          title="Reopen properties panel"
        >
          Properties
        </PropertyPanelPeekBtn>
      </PropertyPanelPeekWrap>
    );
  }
  if (multipleSelected) {
    return (
      <PropertyPanelAside>
        <PropertyPanelTitle>Properties</PropertyPanelTitle>
        <PropertyPanelMutedBlock>
          <PropertyPanelMutedP>
            Multiple nodes selected ({selectedNodeIds?.size})
          </PropertyPanelMutedP>
          <PropertyPanelHint>
            Select a single node to edit its properties
          </PropertyPanelHint>
          <PropertyPanelHintSpaced>
            You can drag selected nodes together to move them
          </PropertyPanelHintSpaced>
        </PropertyPanelMutedBlock>
      </PropertyPanelAside>
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
  const saveBtnStatus =
    saveStatus === "saved"
      ? "saved"
      : saveStatus === "saving"
        ? "saving"
        : "default";
  return (
    <PropertyPanelAsideRelative>
      <PropertyPanelCloseBtn
        onClick={handleClose}
        title="Close properties panel"
        aria-label="Close properties panel"
      >
        <X aria-hidden />
      </PropertyPanelCloseBtn>
      <PropertyPanelHeaderRow>
        <PropertyPanelTitle $compact>Properties</PropertyPanelTitle>
        <PropertyPanelHeaderActions>
          <PropertyPanelSaveBtn
            onClick={handleSaveWrapper}
            disabled={saveStatus === "saving"}
            $status={saveBtnStatus}
            title="Save changes"
          >
            {saveStatus === "saved" ? (
              <>
                <Check aria-hidden />
                Saved
              </>
            ) : saveStatus === "saving" ? (
              <>
                <PropertyPanelSaveIconPulse>
                  <Save aria-hidden />
                </PropertyPanelSaveIconPulse>
                Saving...
              </>
            ) : (
              <>
                <Save aria-hidden />
                Save
              </>
            )}
          </PropertyPanelSaveBtn>
          <PropertyPanelDeleteBtn
            onClick={handleDelete}
            title="Delete node"
            aria-label="Delete selected node"
          >
            <Trash2 aria-hidden />
          </PropertyPanelDeleteBtn>
        </PropertyPanelHeaderActions>
      </PropertyPanelHeaderRow>
      <PropertyPanelStack>
        <div>
          <PropertyPanelFieldLabel>Name</PropertyPanelFieldLabel>
          <PropertyPanelInput
            ref={nameInputRef}
            type="text"
            value={nameValue}
            onChange={(e) => handleNameChange(e.target.value)}
          />
        </div>
        <div>
          <PropertyPanelFieldLabel htmlFor="node-description">
            Description
          </PropertyPanelFieldLabel>
          <PropertyPanelTextarea
            id="node-description"
            ref={descriptionInputRef}
            value={descriptionValue}
            onChange={(e) => handleDescriptionChange(e.target.value)}
            rows={3}
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
      </PropertyPanelStack>
    </PropertyPanelAsideRelative>
  );
}
export { PropertyPanel as default };

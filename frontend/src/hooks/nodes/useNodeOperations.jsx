import { useCallback } from "react";
import { useReactFlow } from "@xyflow/react";
import { showError } from "../../utils/notifications";
import { logger } from "../../utils/logger";
import { UI_CONSTANTS } from "../../config/constants";
import { confirmDelete } from "../utils/confirmations";
import {
  logicalOr,
  logicalOrToEmptyObject,
  logicalOrToEmptyArray,
} from "../utils/logicalOr";
import { extractApiErrorMessage } from "../utils/apiUtils";
function useNodeOperations({
  selectedNode,
  setSelectedNodeId,
  onSave,
  onSaveWorkflow,
  showErrorNotification = showError,
  logger: injectedLogger = logger,
}) {
  const { setNodes, deleteElements } = useReactFlow();
  const handleUpdate = useCallback(
    (field, value) => {
      if (!selectedNode) return;
      const nodeId = selectedNode.id;
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) return node;
          const updatedData = { ...node.data, [field]: value };
          if (field === "name") {
            updatedData.label = value;
          }
          return { ...node, data: updatedData };
        }),
      );
    },
    [selectedNode, setNodes],
  );
  const handleConfigUpdate = useCallback(
    (configField, field, value) => {
      if (!selectedNode) return;
      const nodeId = selectedNode.id;
      setNodes((nodes) =>
        nodes.map((node) => {
          if (node.id !== nodeId) return node;
          const currentConfig = logicalOrToEmptyObject(
            node.data[configField],
          );
          return {
            ...node,
            data: {
              ...node.data,
              [configField]: {
                ...currentConfig,
                [field]: value,
              },
            },
          };
        }),
      );
    },
    [selectedNode, setNodes],
  );
  const handleDelete = useCallback(async () => {
    if (!selectedNode) return;
    const itemName = logicalOr(
      selectedNode.data.name,
      logicalOr(selectedNode.data.label, selectedNode.id),
    );
    await confirmDelete(
      itemName,
      () => {
        deleteElements({ nodes: [{ id: selectedNode.id }] });
        setSelectedNodeId(null);
      },
      { title: "Delete Node" },
    );
  }, [selectedNode, deleteElements, setSelectedNodeId]);
  const handleSave = useCallback(
    async (setSaveStatus) => {
      if (!selectedNode) return;
      setSaveStatus("saving");
      try {
        if (onSaveWorkflow) {
          await onSaveWorkflow();
        }
        if (onSave) {
          await onSave();
        }
        setSaveStatus("saved");
        setTimeout(() => {
          setSaveStatus("idle");
        }, UI_CONSTANTS.SAVE_STATUS_DELAY);
      } catch (error) {
        injectedLogger.error("Save failed:", error);
        setSaveStatus("idle");
        showErrorNotification(
          "Failed to save workflow: " +
            extractApiErrorMessage(error, "Unknown error"),
        );
      }
    },
    [
      selectedNode,
      onSave,
      onSaveWorkflow,
      showErrorNotification,
      injectedLogger,
    ],
  );
  const handleAddInput = useCallback(
    (inputName, sourceNode, sourceField, setShowAddInput) => {
      if (!selectedNode) return;
      const currentInputs = logicalOrToEmptyArray(selectedNode.data.inputs);
      const newInput = {
        name: inputName,
        source_node: logicalOr(sourceNode, void 0),
        source_field: logicalOr(sourceField, "output"),
      };
      handleUpdate("inputs", [...currentInputs, newInput]);
      setShowAddInput(false);
    },
    [selectedNode, handleUpdate],
  );
  const handleRemoveInput = useCallback(
    (index) => {
      if (!selectedNode) return;
      const currentInputs = logicalOrToEmptyArray(selectedNode.data.inputs);
      const newInputs = currentInputs.filter((_, i) => i !== index);
      handleUpdate("inputs", newInputs);
    },
    [selectedNode, handleUpdate],
  );
  const handleUpdateInput = useCallback(
    (index, field, value) => {
      if (!selectedNode) return;
      const inputsArray = logicalOrToEmptyArray(selectedNode.data.inputs);
      const currentInputs = Array.isArray(inputsArray) ? [...inputsArray] : [];
      while (currentInputs.length <= index) {
        currentInputs.push({});
      }
      const existing = currentInputs[index];
      currentInputs[index] = {
        ...(typeof existing === "object" && existing !== null ? existing : {}),
        [field]: value,
      };
      handleUpdate("inputs", currentInputs);
    },
    [selectedNode, handleUpdate],
  );
  return {
    handleUpdate,
    handleConfigUpdate,
    handleDelete,
    handleSave,
    handleAddInput,
    handleRemoveInput,
    handleUpdateInput,
  };
}
export { useNodeOperations };

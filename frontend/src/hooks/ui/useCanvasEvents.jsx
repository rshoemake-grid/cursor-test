import { useCallback, useRef } from "react";
import { addEdge } from "@xyflow/react";
import { logger } from "../../utils/logger";
import { showSuccess, showError } from "../../utils/notifications";
import { STORAGE_KEYS } from "../../config/constants";
import {
  logicalOr,
  logicalOrToEmptyObject,
  logicalOrToEmptyArray,
} from "../utils/logicalOr";
function useCanvasEvents({
  reactFlowInstanceRef,
  setNodes,
  setEdges,
  setSelectedNodeId,
  notifyModified,
  clipboard,
  storage,
}) {
  const isDraggingRef = useRef(false);
  const onConnect = useCallback(
    (connection) => {
      setEdges((eds) => addEdge(connection, eds));
    },
    [setEdges],
  );
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);
  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      const type = event.dataTransfer.getData("application/reactflow");
      if (!type) return;
      let position;
      if (reactFlowInstanceRef.current?.screenToFlowPosition) {
        position = reactFlowInstanceRef.current.screenToFlowPosition({
          x: event.clientX,
          y: event.clientY,
        });
      } else {
        const reactFlowWrapper = event.currentTarget.closest(".react-flow");
        if (!reactFlowWrapper) return;
        const reactFlowBounds = reactFlowWrapper.getBoundingClientRect();
        position = {
          x: event.clientX - reactFlowBounds.left,
          y: event.clientY - reactFlowBounds.top,
        };
      }
      const customAgentData = event.dataTransfer.getData(
        "application/custom-agent",
      );
      const customToolData = event.dataTransfer.getData(
        "application/custom-tool",
      );
      let customData = null;
      if (customAgentData) {
        try {
          customData = JSON.parse(customAgentData);
        } catch (e) {
          logger.error("Failed to parse custom agent data:", e);
        }
      } else if (customToolData && type === "tool") {
        try {
          customData = JSON.parse(customToolData);
        } catch (e) {
          logger.error("Failed to parse custom tool data:", e);
        }
      }
      const defaultLabel = `${type.charAt(0).toUpperCase() + type.slice(1)} Node`;
      let nodeData;
      if (type === "tool" && customData) {
        nodeData = {
          label: logicalOr(customData.label, defaultLabel),
          name: logicalOr(customData.label, defaultLabel),
          description: logicalOr(customData.description, ""),
          tool_config: logicalOrToEmptyObject(customData.tool_config),
          inputs: [],
        };
      } else if (customData) {
        nodeData = {
          label: logicalOr(customData.label, defaultLabel),
          name: logicalOr(customData.label, defaultLabel),
          description: logicalOr(customData.description, ""),
          agent_config: logicalOrToEmptyObject(customData.agent_config),
          inputs: [],
        };
      } else {
        nodeData = {
          label: defaultLabel,
          name: defaultLabel,
          inputs: [],
        };
      }
      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        draggable: true,
        data: nodeData,
      };
      setNodes((nds) => [...nds, newNode]);
      notifyModified();
    },
    [reactFlowInstanceRef, setNodes, notifyModified],
  );
  const onNodeClick = useCallback(
    (event, node) => {
      if (isDraggingRef.current) {
        return;
      }
      event.stopPropagation();
      const isMultiSelect = event.shiftKey || event.metaKey || event.ctrlKey;
      if (isMultiSelect) {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === node.id ? !n.selected : n.selected,
          })),
        );
      } else {
        setNodes((nds) =>
          nds.map((n) => ({
            ...n,
            selected: n.id === node.id,
          })),
        );
        setSelectedNodeId(node.id);
      }
    },
    [setNodes, setSelectedNodeId],
  );
  const onPaneClick = useCallback(
    (event) => {
      setSelectedNodeId(null);
      if (
        (event.ctrlKey || event.metaKey) &&
        event.button === 0 &&
        clipboard?.clipboardNode
      ) {
        clipboard.paste(event.clientX, event.clientY);
      }
    },
    [clipboard, setSelectedNodeId],
  );
  const handleAddToAgentNodes = useCallback(
    (node) => {
      if (node.type !== "agent") return;
      if (!storage) {
        showError("Storage not available");
        return;
      }
      try {
        const savedAgentNodes = storage.getItem(
          STORAGE_KEYS.CUSTOM_AGENT_NODES,
        );
        const agentNodes = savedAgentNodes
          ? JSON.parse(savedAgentNodes)
          : logicalOrToEmptyArray([]);
        const agentTemplate = {
          id: `agent_${Date.now()}`,
          label: logicalOr(
            node.data.label,
            logicalOr(node.data.name, "Custom Agent"),
          ),
          description: logicalOr(node.data.description, ""),
          agent_config: logicalOrToEmptyObject(node.data.agent_config),
          type: "agent",
        };
        const exists = agentNodes.some(
          (n) =>
            n.label === agentTemplate.label &&
            JSON.stringify(n.agent_config) ===
              JSON.stringify(agentTemplate.agent_config),
        );
        if (!exists) {
          agentNodes.push(agentTemplate);
          storage.setItem(
            STORAGE_KEYS.CUSTOM_AGENT_NODES,
            JSON.stringify(agentNodes),
          );
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("customAgentNodesUpdated"));
          }
          showSuccess("Agent node added to palette");
        } else {
          showError("This agent node already exists in the palette");
        }
      } catch (error) {
        logger.error("Failed to save agent node:", error);
        showError("Failed to add agent node to palette");
      }
    },
    [storage],
  );
  const handleAddToToolNodes = useCallback(
    (node) => {
      if (node.type !== "tool") return;
      if (!storage) {
        showError("Storage not available");
        return;
      }
      try {
        const saved = storage.getItem(STORAGE_KEYS.CUSTOM_TOOL_NODES);
        const tools = saved ? JSON.parse(saved) : logicalOrToEmptyArray([]);
        const toolConfig = logicalOrToEmptyObject(node.data.tool_config);
        const toolTemplate = {
          id: `tool_${Date.now()}`,
          label: logicalOr(
            node.data.label,
            logicalOr(node.data.name, "Custom Tool"),
          ),
          description: logicalOr(node.data.description, ""),
          tool_config: toolConfig,
          type: "tool",
        };
        const exists = tools.some(
          (n) =>
            n.label === toolTemplate.label &&
            JSON.stringify(n.tool_config) ===
              JSON.stringify(toolTemplate.tool_config),
        );
        if (!exists) {
          tools.push(toolTemplate);
          storage.setItem(
            STORAGE_KEYS.CUSTOM_TOOL_NODES,
            JSON.stringify(tools),
          );
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("customToolNodesUpdated"));
          }
          showSuccess("Tool node added to palette");
        } else {
          showError("This tool node already exists in the palette");
        }
      } catch (error) {
        logger.error("Failed to save tool node:", error);
        showError("Failed to add tool node to palette");
      }
    },
    [storage],
  );
  return {
    onConnect,
    onDragOver,
    onDrop,
    onNodeClick,
    onPaneClick,
    handleAddToAgentNodes,
    handleAddToToolNodes,
    isDraggingRef,
  };
}
export { useCanvasEvents };

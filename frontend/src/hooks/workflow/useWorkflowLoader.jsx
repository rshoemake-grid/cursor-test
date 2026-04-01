import { useEffect } from "react";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
import { initializeReactFlowNodes, formatEdgesForReactFlow } from "../../utils/workflowFormat";
import { logicalOr, logicalOrToEmptyObject, logicalOrToEmptyArray } from "../utils/logicalOr";
function useWorkflowLoader({
  workflowId,
  tabIsUnsaved,
  setNodes,
  setEdges,
  setLocalWorkflowId,
  setLocalWorkflowName,
  setLocalWorkflowDescription,
  setVariables,
  setSelectedNodeId,
  workflowNodeToNode,
  onWorkflowLoaded,
  isLoadingRef,
  lastLoadedWorkflowIdRef,
  isAuthenticated = true
}) {
  useEffect(() => {
    if (!isAuthenticated) {
      if (workflowId) {
        lastLoadedWorkflowIdRef.current = null;
        isLoadingRef.current = false;
      }
      return;
    }
    if (workflowId && workflowId === lastLoadedWorkflowIdRef.current) {
      return;
    }
    if (workflowId) {
      if (tabIsUnsaved) {
        return;
      }
      isLoadingRef.current = true;
      api.getWorkflow(workflowId).then((workflow) => {
        if (workflow.id) {
          setLocalWorkflowId(workflow.id);
        }
        setLocalWorkflowName(workflow.name);
        setLocalWorkflowDescription(logicalOr(workflow.description, "") || "");
        setVariables(logicalOrToEmptyObject(workflow.variables));
        const convertedNodes = workflow.nodes.map(workflowNodeToNode);
        const initializedNodes = initializeReactFlowNodes(convertedNodes);
        logger.debug("Loaded nodes:", initializedNodes.map((n) => ({ id: n.id, type: n.type, position: n.position })));
        const formattedEdges = formatEdgesForReactFlow(logicalOrToEmptyArray(workflow.edges));
        setNodes(initializedNodes);
        setTimeout(() => {
          setEdges(formattedEdges);
        }, 50);
        lastLoadedWorkflowIdRef.current = workflowId;
        setSelectedNodeId(null);
        setTimeout(() => {
          isLoadingRef.current = false;
        }, 100);
        if (onWorkflowLoaded) {
          onWorkflowLoaded(workflowId, workflow.name);
        }
      }).catch((err) => {
        logger.error("Failed to load workflow:", err);
        isLoadingRef.current = false;
      });
    } else {
      lastLoadedWorkflowIdRef.current = null;
      isLoadingRef.current = false;
    }
  }, [workflowId, tabIsUnsaved, workflowNodeToNode, setNodes, setEdges, setLocalWorkflowId, setLocalWorkflowName, setLocalWorkflowDescription, setVariables, setSelectedNodeId, onWorkflowLoaded, isLoadingRef, lastLoadedWorkflowIdRef, isAuthenticated]);
}
export {
  useWorkflowLoader
};

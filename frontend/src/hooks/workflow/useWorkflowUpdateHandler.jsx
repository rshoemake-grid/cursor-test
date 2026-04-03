import { useCallback } from "react";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
import {
  initializeReactFlowNodes,
  formatEdgesForReactFlow,
} from "../../utils/workflowFormat";
import { logicalOrToEmptyArray } from "../utils/logicalOr";
function useWorkflowUpdateHandler({
  localWorkflowId,
  setNodes,
  setEdges,
  workflowNodeToNode,
  applyLocalChanges,
  isAuthenticated = true,
}) {
  const handleWorkflowUpdate = useCallback(
    (changes) => {
      if (!changes) return;
      logger.debug("Received workflow changes:", changes);
      const hasDeletions =
        changes.nodes_to_delete && changes.nodes_to_delete.length > 0;
      if (hasDeletions && localWorkflowId && isAuthenticated) {
        logger.debug(
          "Reloading workflow from database after deletions:",
          changes.nodes_to_delete,
        );
        setTimeout(() => {
          api
            .getWorkflow(localWorkflowId)
            .then((workflow) => {
              const convertedNodes = workflow.nodes.map(workflowNodeToNode);
              const initializedNodes = initializeReactFlowNodes(convertedNodes);
              setNodes(initializedNodes);
              setEdges(
                formatEdgesForReactFlow(logicalOrToEmptyArray(workflow.edges)),
              );
              logger.debug(
                "Reloaded workflow after deletion, nodes:",
                initializedNodes.map((n) => n.id),
              );
              logger.debug("Expected deleted nodes:", changes.nodes_to_delete);
            })
            .catch((err) => {
              logger.error("Failed to reload workflow after deletion:", err);
              applyLocalChanges(changes);
            });
        }, 200);
        return;
      }
      applyLocalChanges(changes);
    },
    [
      localWorkflowId,
      workflowNodeToNode,
      setNodes,
      setEdges,
      applyLocalChanges,
      isAuthenticated,
    ],
  );
  return {
    handleWorkflowUpdate,
  };
}
export { useWorkflowUpdateHandler };

import { useEffect, useRef } from "react";
import { api } from "../../api/client";
import { logger } from "../../utils/logger";
import { showError as defaultShowError } from "../../utils/notifications";
import { extractApiErrorMessage } from "../utils/apiUtils";
import {
  initializeReactFlowNodes,
  formatEdgesForReactFlow,
} from "../../utils/workflowFormat";
import {
  logicalOr,
  logicalOrToEmptyObject,
  logicalOrToEmptyArray,
} from "../utils/logicalOr";
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
  isAuthenticated = true,
  showError = defaultShowError,
}) {
  const prevAuthenticatedRef = useRef(undefined);
  useEffect(() => {
    const prevAuthenticated = prevAuthenticatedRef.current;
    prevAuthenticatedRef.current = isAuthenticated;
    const authBecameTrue =
      isAuthenticated === true && prevAuthenticated === false;

    if (!isAuthenticated) {
      if (workflowId) {
        logger.debug(
          "[useWorkflowLoader] Skip fetch: not authenticated",
          { workflowId },
        );
        lastLoadedWorkflowIdRef.current = null;
        isLoadingRef.current = false;
      }
      return;
    }
    if (
      authBecameTrue &&
      workflowId &&
      tabIsUnsaved !== true
    ) {
      lastLoadedWorkflowIdRef.current = null;
    }
    if (workflowId && workflowId === lastLoadedWorkflowIdRef.current) {
      logger.debug(
        "[useWorkflowLoader] Skip fetch: already loaded in this tab",
        { workflowId },
      );
      return;
    }
    if (workflowId) {
      if (tabIsUnsaved) {
        logger.debug(
          "[useWorkflowLoader] Skip fetch: tab is unsaved (draft only, no GET)",
          { workflowId },
        );
        return;
      }
      isLoadingRef.current = true;
      logger.debug("[useWorkflowLoader] Fetching workflow", { workflowId });
      api
        .getWorkflow(workflowId)
        .then((workflow) => {
          if (workflow.id) {
            setLocalWorkflowId(workflow.id);
          }
          setLocalWorkflowName(workflow.name);
          setLocalWorkflowDescription(
            logicalOr(workflow.description, "") || "",
          );
          setVariables(logicalOrToEmptyObject(workflow.variables));
          const convertedNodes = workflow.nodes.map(workflowNodeToNode);
          const initializedNodes = initializeReactFlowNodes(convertedNodes);
          logger.debug(
            "Loaded nodes:",
            initializedNodes.map((n) => ({
              id: n.id,
              type: n.type,
              position: n.position,
            })),
          );
          const formattedEdges = formatEdgesForReactFlow(
            logicalOrToEmptyArray(workflow.edges),
          );
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
        })
        .catch((err) => {
          logger.error("Failed to load workflow:", err);
          isLoadingRef.current = false;
          const detail = extractApiErrorMessage(err, "Request failed");
          showError(
            `Could not load workflow${workflowId ? ` (${workflowId})` : ""}: ${detail}`,
          );
        });
    } else {
      logger.debug(
        "[useWorkflowLoader] No workflowId on tab — open a saved workflow or save this tab to fetch from API",
      );
      lastLoadedWorkflowIdRef.current = null;
      isLoadingRef.current = false;
    }
  }, [
    workflowId,
    tabIsUnsaved,
    workflowNodeToNode,
    setNodes,
    setEdges,
    setLocalWorkflowId,
    setLocalWorkflowName,
    setLocalWorkflowDescription,
    setVariables,
    setSelectedNodeId,
    onWorkflowLoaded,
    isLoadingRef,
    lastLoadedWorkflowIdRef,
    isAuthenticated,
    showError,
  ]);
}
export { useWorkflowLoader };

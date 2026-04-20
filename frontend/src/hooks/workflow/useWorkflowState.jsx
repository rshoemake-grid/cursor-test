import { useState, useEffect, useRef, useLayoutEffect } from "react";
function useWorkflowState({
  workflowId: initialWorkflowId,
  tabName,
  tabId = "default-tab",
}) {
  const [localWorkflowId, setLocalWorkflowId] = useState(initialWorkflowId);
  const [localWorkflowName, setLocalWorkflowName] =
    useState("Untitled Workflow");
  const [localWorkflowDescription, setLocalWorkflowDescription] = useState("");
  const [variables, setVariables] = useState({});
  const tabNameRef = useRef(tabName);
  const prevTabIdRef = useRef(tabId);
  useLayoutEffect(() => {
    if (prevTabIdRef.current !== tabId) {
      prevTabIdRef.current = tabId;
      setLocalWorkflowId(initialWorkflowId ?? null);
      setLocalWorkflowName(tabName);
      setLocalWorkflowDescription("");
      setVariables({});
      tabNameRef.current = tabName;
    }
  }, [tabId, initialWorkflowId, tabName]);
  useEffect(() => {
    if (tabName !== tabNameRef.current) {
      tabNameRef.current = tabName;
      setLocalWorkflowName(tabName);
    }
  }, [tabName]);
  useEffect(() => {
    if (initialWorkflowId !== localWorkflowId) {
      setLocalWorkflowId(initialWorkflowId);
    }
  }, [initialWorkflowId]);
  return {
    localWorkflowId,
    setLocalWorkflowId,
    localWorkflowName,
    setLocalWorkflowName,
    localWorkflowDescription,
    setLocalWorkflowDescription,
    variables,
    setVariables,
  };
}
export { useWorkflowState };

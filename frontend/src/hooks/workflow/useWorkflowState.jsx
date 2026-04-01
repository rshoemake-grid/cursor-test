import { useState, useEffect, useRef } from "react";
function useWorkflowState({
  workflowId: initialWorkflowId,
  tabName
}) {
  const [localWorkflowId, setLocalWorkflowId] = useState(initialWorkflowId);
  const [localWorkflowName, setLocalWorkflowName] = useState("Untitled Workflow");
  const [localWorkflowDescription, setLocalWorkflowDescription] = useState("");
  const [variables, setVariables] = useState({});
  const tabNameRef = useRef(tabName);
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
    setVariables
  };
}
export {
  useWorkflowState
};

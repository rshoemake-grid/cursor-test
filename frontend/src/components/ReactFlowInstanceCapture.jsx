import { useEffect } from "react";
import { useReactFlow } from "@xyflow/react";
function ReactFlowInstanceCapture({ instanceRef }) {
  const reactFlowInstance = useReactFlow();
  useEffect(() => {
    instanceRef.current = reactFlowInstance;
  }, [reactFlowInstance, instanceRef]);
  return null;
}
export { ReactFlowInstanceCapture };

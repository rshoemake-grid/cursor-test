import { useEffect } from "react";
import PropTypes from "prop-types";
import { useReactFlow } from "@xyflow/react";
function ReactFlowInstanceCapture({ instanceRef }) {
  const reactFlowInstance = useReactFlow();
  useEffect(() => {
    instanceRef.current = reactFlowInstance;
  }, [reactFlowInstance, instanceRef]);
  return null;
}

ReactFlowInstanceCapture.propTypes = {
  instanceRef: PropTypes.shape({ current: PropTypes.any }).isRequired,
};

export { ReactFlowInstanceCapture };

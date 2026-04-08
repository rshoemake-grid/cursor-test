import PropTypes from "prop-types";
import { Position } from "@xyflow/react";
import { Flag } from "lucide-react";
import {
  WNHandle,
  WNTerminalRow,
  WNTerminalTitle,
  WorkflowTerminalNode,
} from "../../styles/workflowNodes.styled";

function EndNode({ selected }) {
  return (
    <WorkflowTerminalNode
      data-testid="end-node"
      $variant="end"
      $selected={selected}
    >
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNTerminalRow>
        <Flag aria-hidden />
        <WNTerminalTitle>End</WNTerminalTitle>
      </WNTerminalRow>
    </WorkflowTerminalNode>
  );
}

EndNode.propTypes = {
  selected: PropTypes.bool,
  id: PropTypes.string,
};

export { EndNode as default };

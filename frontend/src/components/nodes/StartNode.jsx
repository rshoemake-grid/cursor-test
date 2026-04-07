import { Position } from "@xyflow/react";
import { Play } from "lucide-react";
import {
  WNHandle,
  WNTerminalRow,
  WNTerminalTitle,
  WorkflowTerminalNode,
} from "../../styles/workflowNodes.styled";

function StartNode({ selected }) {
  return (
    <WorkflowTerminalNode
      data-testid="start-node"
      $variant="start"
      $selected={selected}
    >
      <WNTerminalRow>
        <Play aria-hidden />
        <WNTerminalTitle>Start</WNTerminalTitle>
      </WNTerminalRow>
      <WNHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WNHandle type="source" position={Position.Right} id="source-right" />
    </WorkflowTerminalNode>
  );
}
export { StartNode as default };

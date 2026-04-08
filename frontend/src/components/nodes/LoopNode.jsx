import PropTypes from "prop-types";
import { Position } from "@xyflow/react";
import { RotateCw } from "lucide-react";
import {
  WNDescription,
  WNHandle,
  WNHeaderRow,
  WNIconWrap,
  WNMetaRow,
  WNTitle,
  WorkflowNodeCard,
} from "../../styles/workflowNodes.styled";

function LoopNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return (
    <WorkflowNodeCard
      data-testid="loop-node"
      $width={180}
      $borderPalette="neutral"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNHeaderRow>
        <WNIconWrap $palette="green">
          <RotateCw aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || "")}</WNTitle>
      </WNHeaderRow>
      {data.description && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      {data.loop_config?.loop_type && (
        <WNMetaRow>
          {data.loop_config.loop_type}
          {data.loop_config.max_iterations &&
            ` (max: ${data.loop_config.max_iterations})`}
        </WNMetaRow>
      )}
      <WNHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WNHandle type="source" position={Position.Right} id="source-right" />
    </WorkflowNodeCard>
  );
}

LoopNode.propTypes = {
  data: PropTypes.object,
  selected: PropTypes.bool,
  id: PropTypes.string,
};

export { LoopNode as default };

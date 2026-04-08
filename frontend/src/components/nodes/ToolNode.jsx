import PropTypes from "prop-types";
import { Position } from "@xyflow/react";
import { Wrench } from "lucide-react";
import {
  WNDescription,
  WNHandle,
  WNHeaderRow,
  WNIconWrap,
  WNMetaRow,
  WNTitle,
  WorkflowNodeCard,
} from "../../styles/workflowNodes.styled";

function ToolNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  const toolName = data.tool_config?.tool_name || data.tool_name || "Tool";
  return (
    <WorkflowNodeCard
      data-testid="tool-node"
      $width={200}
      $borderPalette="neutral"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNHeaderRow>
        <WNIconWrap $palette="amber">
          <Wrench aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || toolName)}</WNTitle>
      </WNHeaderRow>
      {data.description != null && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      <WNMetaRow>{toolName}</WNMetaRow>
      <WNHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WNHandle type="source" position={Position.Right} id="source-right" />
    </WorkflowNodeCard>
  );
}

ToolNode.propTypes = {
  data: PropTypes.object,
  selected: PropTypes.bool,
  id: PropTypes.string,
};

export { ToolNode as default };

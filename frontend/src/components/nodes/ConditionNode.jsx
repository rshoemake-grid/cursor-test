import PropTypes from "prop-types";
import { Position } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import {
  WNBranchInner,
  WNBranchLabel,
  WNBranchLabelRow,
  WNBranchSection,
  WNDescription,
  WNHandle,
  WNHandleFalse,
  WNHandleTrue,
  WNHeaderRow,
  WNIconWrap,
  WNMetaRow,
  WNTitle,
  WorkflowNodeCard,
} from "../../styles/workflowNodes.styled";

function ConditionNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return (
    <WorkflowNodeCard
      data-testid="condition-node"
      $width={180}
      $borderPalette="neutral"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNHeaderRow>
        <WNIconWrap $palette="purple">
          <GitBranch aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || "")}</WNTitle>
      </WNHeaderRow>
      {data.description && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      {data.condition_config?.condition_type && (
        <WNMetaRow>
          {data.condition_config.condition_type}:{" "}
          {data.condition_config.field}
        </WNMetaRow>
      )}
      <WNBranchSection>
        <WNBranchInner>
          <WNHandleTrue
            type="source"
            position={Position.Right}
            id="true"
            style={{ top: "32%" }}
          />
          <WNHandleFalse
            type="source"
            position={Position.Right}
            id="false"
            style={{ top: "68%" }}
          />
          <WNBranchLabelRow>
            <WNBranchLabel $tone="true">True</WNBranchLabel>
          </WNBranchLabelRow>
          <WNBranchLabelRow>
            <WNBranchLabel $tone="false">False</WNBranchLabel>
          </WNBranchLabelRow>
        </WNBranchInner>
      </WNBranchSection>
    </WorkflowNodeCard>
  );
}

ConditionNode.propTypes = {
  data: PropTypes.object,
  selected: PropTypes.bool,
  id: PropTypes.string,
};

export { ConditionNode as default };

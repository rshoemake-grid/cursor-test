import PropTypes from "prop-types";
import { Position } from "@xyflow/react";
import { Database } from "lucide-react";
import {
  WNDescription,
  WNHandle,
  WNHeaderRow,
  WNIconWrap,
  WNTitle,
  WorkflowNodeCard,
} from "../../styles/workflowNodes.styled";

function GCPBucketNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return (
    <WorkflowNodeCard
      data-testid="gcp-bucket-node"
      $width={200}
      $borderPalette="orange"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHeaderRow>
        <WNIconWrap $palette="orange">
          <Database aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || "GCP Bucket")}</WNTitle>
      </WNHeaderRow>
      {data.description && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WNHandle type="source" position={Position.Right} id="source-right" />
    </WorkflowNodeCard>
  );
}

GCPBucketNode.propTypes = {
  data: PropTypes.object,
  selected: PropTypes.bool,
  id: PropTypes.string,
};

export { GCPBucketNode as default };

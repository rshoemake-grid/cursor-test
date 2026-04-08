import PropTypes from "prop-types";
import { Position } from "@xyflow/react";
import { Database } from "lucide-react";
import {
  WNDescription,
  WNHandle,
  WNHeaderRow,
  WNIconWrap,
  WNMetaHighlight,
  WNMetaRow,
  WNTitle,
  WorkflowNodeCard,
} from "../../styles/workflowNodes.styled";

function FirebaseNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  const inputConfig = data.input_config || {};
  return (
    <WorkflowNodeCard
      data-testid="firebase-node"
      $width={200}
      $borderPalette="orange"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHeaderRow>
        <WNIconWrap $palette="orange">
          <Database aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || "Firebase")}</WNTitle>
      </WNHeaderRow>
      {data.description && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      {inputConfig.firebase_service && (
        <WNMetaRow>Service: {inputConfig.firebase_service}</WNMetaRow>
      )}
      {inputConfig.project_id && (
        <WNMetaRow>Project: {inputConfig.project_id}</WNMetaRow>
      )}
      {inputConfig.mode && (
        <WNMetaHighlight>
          Mode: {inputConfig.mode === "write" ? "Write" : "Read"}
        </WNMetaHighlight>
      )}
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WNHandle type="source" position={Position.Right} id="source-right" />
    </WorkflowNodeCard>
  );
}

FirebaseNode.propTypes = {
  data: PropTypes.object,
  selected: PropTypes.bool,
  id: PropTypes.string,
};

export { FirebaseNode as default };

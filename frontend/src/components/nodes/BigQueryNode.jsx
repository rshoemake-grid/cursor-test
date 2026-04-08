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

function BigQueryNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  const inputConfig = data.input_config || {};
  return (
    <WorkflowNodeCard
      data-testid="bigquery-node"
      $width={200}
      $borderPalette="blue"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHeaderRow>
        <WNIconWrap $palette="blue">
          <Database aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || "BigQuery")}</WNTitle>
      </WNHeaderRow>
      {data.description && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      {inputConfig.project_id && (
        <WNMetaRow>Project: {inputConfig.project_id}</WNMetaRow>
      )}
      {inputConfig.dataset && (
        <WNMetaRow>Dataset: {inputConfig.dataset}</WNMetaRow>
      )}
      {inputConfig.table && (
        <WNMetaRow>Table: {inputConfig.table}</WNMetaRow>
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

BigQueryNode.propTypes = {
  data: PropTypes.object,
  selected: PropTypes.bool,
  id: PropTypes.string,
};

export { BigQueryNode as default };

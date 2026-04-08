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

function DatabaseNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  const inputConfig = data.input_config || {};
  return (
    <WorkflowNodeCard
      data-testid="database-node"
      $width={200}
      $borderPalette="indigo"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHeaderRow>
        <WNIconWrap $palette="indigo">
          <Database aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || "Database")}</WNTitle>
      </WNHeaderRow>
      {data.description && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      {inputConfig.database_type && (
        <WNMetaRow>Type: {inputConfig.database_type}</WNMetaRow>
      )}
      {inputConfig.database_name && (
        <WNMetaRow>DB: {inputConfig.database_name}</WNMetaRow>
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

DatabaseNode.propTypes = {
  data: PropTypes.object,
  selected: PropTypes.bool,
  id: PropTypes.string,
};

export { DatabaseNode as default };

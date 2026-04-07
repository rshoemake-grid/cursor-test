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

const getFilename = (path) => {
  if (!path) return "";
  const parts = path.split("/").filter((p) => p);
  return parts[parts.length - 1] || path;
};

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
      {data.input_config?.bucket_name && (
        <WNMetaRow>Bucket: {data.input_config.bucket_name}</WNMetaRow>
      )}
      {data.input_config?.object_path && (
        <WNMetaRow>File: {getFilename(data.input_config.object_path)}</WNMetaRow>
      )}
      {data.input_config?.mode && (
        <WNMetaHighlight>
          Mode: {data.input_config.mode === "write" ? "Write" : "Read"}
        </WNMetaHighlight>
      )}
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WNHandle type="source" position={Position.Right} id="source-right" />
    </WorkflowNodeCard>
  );
}
export { GCPBucketNode as default };

import { Position } from "@xyflow/react";
import { Folder } from "lucide-react";
import {
  WNDescription,
  WNHandle,
  WNHeaderRow,
  WNIconWrap,
  WNInlineMuted,
  WNMetaHighlight,
  WNMetaRow,
  WNTitle,
  WorkflowNodeCard,
} from "../../styles/workflowNodes.styled";

const getFilename = (path) => {
  if (!path) return "";
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter((p) => p);
  return parts[parts.length - 1] || path;
};

function LocalFileSystemNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return (
    <WorkflowNodeCard
      data-testid="local-filesystem-node"
      $width={200}
      $borderPalette="green"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHeaderRow>
        <WNIconWrap $palette="green">
          <Folder aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || "Local File System")}</WNTitle>
      </WNHeaderRow>
      {data.description && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      {data.input_config?.file_path && (
        <WNMetaRow>File: {getFilename(data.input_config.file_path)}</WNMetaRow>
      )}
      {data.input_config?.file_pattern && (
        <WNMetaRow>Pattern: {data.input_config.file_pattern}</WNMetaRow>
      )}
      {data.input_config?.mode && (
        <WNMetaHighlight>
          Mode: {data.input_config.mode === "write" ? "Write" : "Read"}
          {data.input_config.mode === "write" &&
            data.input_config.overwrite === false && (
              <WNInlineMuted>(Auto-increment)</WNInlineMuted>
            )}
        </WNMetaHighlight>
      )}
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WNHandle type="source" position={Position.Right} id="source-right" />
    </WorkflowNodeCard>
  );
}
export { LocalFileSystemNode as default };

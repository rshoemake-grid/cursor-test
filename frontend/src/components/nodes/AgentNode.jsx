import { Position } from "@xyflow/react";
import { Bot } from "lucide-react";
import {
  WNDescription,
  WNHandle,
  WNHeaderRow,
  WNIconWrap,
  WNMetaRow,
  WNTitle,
  WorkflowNodeCard,
} from "../../styles/workflowNodes.styled";

function AgentNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return (
    <WorkflowNodeCard
      data-testid="agent-node"
      $width={200}
      $borderPalette="neutral"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNHeaderRow>
        <WNIconWrap $palette="blue">
          <Bot aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || "")}</WNTitle>
      </WNHeaderRow>
      {data.description && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      {data.agent_config?.model && (
        <WNMetaRow>{data.agent_config.model}</WNMetaRow>
      )}
      <WNHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WNHandle type="source" position={Position.Right} id="source-right" />
    </WorkflowNodeCard>
  );
}
export { AgentNode as default };

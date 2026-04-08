import PropTypes from "prop-types";
import { Position } from "@xyflow/react";
import { Radio } from "lucide-react";
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

function GCPPubSubNode({ data, selected }) {
  const executionStatus = data.executionStatus;
  const hasError = executionStatus === "failed";
  return (
    <WorkflowNodeCard
      data-testid="gcp-pubsub-node"
      $width={200}
      $borderPalette="purple"
      $hasError={hasError}
      $selected={selected}
    >
      <WNHeaderRow>
        <WNIconWrap $palette="purple">
          <Radio aria-hidden />
        </WNIconWrap>
        <WNTitle>{String(data.label || "GCP Pub/Sub")}</WNTitle>
      </WNHeaderRow>
      {data.description && (
        <WNDescription>{String(data.description)}</WNDescription>
      )}
      {data.input_config?.topic_name && (
        <WNMetaRow>Topic: {data.input_config.topic_name}</WNMetaRow>
      )}
      {data.input_config?.subscription_name && (
        <WNMetaRow>
          Subscription: {data.input_config.subscription_name}
        </WNMetaRow>
      )}
      {data.input_config?.mode && (
        <WNMetaHighlight>
          Mode: {data.input_config.mode === "write" ? "Publish" : "Subscribe"}
        </WNMetaHighlight>
      )}
      <WNHandle type="target" position={Position.Top} id="target-top" />
      <WNHandle type="target" position={Position.Left} id="target-left" />
      <WNHandle type="source" position={Position.Bottom} id="source-bottom" />
      <WNHandle type="source" position={Position.Right} id="source-right" />
    </WorkflowNodeCard>
  );
}

GCPPubSubNode.propTypes = {
  data: PropTypes.object,
  selected: PropTypes.bool,
  id: PropTypes.string,
};

export { GCPPubSubNode as default };

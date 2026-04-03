import AgentNode from "./AgentNode";
import ConditionNode from "./ConditionNode";
import LoopNode from "./LoopNode";
import StartNode from "./StartNode";
import EndNode from "./EndNode";
import GCPBucketNode from "./GCPBucketNode";
import AWSS3Node from "./AWSS3Node";
import GCPPubSubNode from "./GCPPubSubNode";
import LocalFileSystemNode from "./LocalFileSystemNode";
import DatabaseNode from "./DatabaseNode";
import FirebaseNode from "./FirebaseNode";
import BigQueryNode from "./BigQueryNode";
import ToolNode from "./ToolNode";
const nodeTypes = {
  agent: AgentNode,
  condition: ConditionNode,
  loop: LoopNode,
  start: StartNode,
  end: EndNode,
  gcp_bucket: GCPBucketNode,
  aws_s3: AWSS3Node,
  gcp_pubsub: GCPPubSubNode,
  local_filesystem: LocalFileSystemNode,
  database: DatabaseNode,
  firebase: FirebaseNode,
  bigquery: BigQueryNode,
  tool: ToolNode,
};
export {
  AWSS3Node,
  AgentNode,
  ConditionNode,
  EndNode,
  GCPBucketNode,
  GCPPubSubNode,
  LocalFileSystemNode,
  LoopNode,
  StartNode,
  ToolNode,
  nodeTypes,
};

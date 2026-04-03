function isAgentNode(node) {
  return node?.type === "agent";
}
function isConditionNode(node) {
  return node?.type === "condition";
}
function isLoopNode(node) {
  return node?.type === "loop";
}
function isInputNode(node) {
  return (
    node !== null &&
    [
      "gcp_bucket",
      "aws_s3",
      "gcp_pubsub",
      "local_filesystem",
      "database",
      "firebase",
      "bigquery",
    ].includes(node.type || "")
  );
}
function isStartNode(node) {
  return node?.type === "start";
}
function isEndNode(node) {
  return node?.type === "end";
}
function isToolNode(node) {
  return node?.type === "tool";
}
export {
  isAgentNode,
  isConditionNode,
  isEndNode,
  isInputNode,
  isLoopNode,
  isStartNode,
  isToolNode,
};

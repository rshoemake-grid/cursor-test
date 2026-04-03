import { createPositioningStrategy } from "./positioningStrategies";
const DEFAULT_OPTIONS = {
  horizontalSpacing: 200,
  verticalSpacing: 150,
  defaultX: 250,
  defaultY: 250,
};
function mergeOptions(options = {}) {
  return { ...DEFAULT_OPTIONS, ...options };
}
function getMaxNodeX(nodes) {
  if (nodes.length === 0) {
    return 0;
  }
  return Math.max(...nodes.map((n) => n.position.x));
}
function getMaxNodeY(nodes) {
  if (nodes.length === 0) {
    return 0;
  }
  return Math.max(...nodes.map((n) => n.position.y));
}
function calculateNextNodePosition(existingNodes, options = {}) {
  const opts = mergeOptions(options);
  const strategy = createPositioningStrategy("horizontal");
  const positions = strategy.calculatePositions(existingNodes, 1, opts);
  return positions[0];
}
function calculateMultipleNodePositions(existingNodes, count, options = {}) {
  const opts = mergeOptions(options);
  const strategy = createPositioningStrategy("vertical");
  return strategy.calculatePositions(existingNodes, count, opts);
}
function calculateGridPosition(
  existingNodes,
  count,
  columnsPerRow = 3,
  options = {},
) {
  const opts = mergeOptions(options);
  const strategy = createPositioningStrategy("grid", columnsPerRow);
  return strategy.calculatePositions(existingNodes, count, opts);
}
function calculateRelativePosition(referenceNode, offset = { x: 200, y: 0 }) {
  return {
    x: referenceNode.position.x + offset.x,
    y: referenceNode.position.y + offset.y,
  };
}
export {
  calculateGridPosition,
  calculateMultipleNodePositions,
  calculateNextNodePosition,
  calculateRelativePosition,
  getMaxNodeX,
  getMaxNodeY,
};

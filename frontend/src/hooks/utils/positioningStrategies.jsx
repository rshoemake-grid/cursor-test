class HorizontalStrategy {
  calculatePositions(existingNodes, count, options) {
    if (existingNodes.length === 0) {
      return Array.from({ length: count }, (_, i) => ({
        x: options.defaultX + i * options.horizontalSpacing,
        y: options.defaultY,
      }));
    }
    const maxX = Math.max(...existingNodes.map((n) => n.position.x));
    return Array.from({ length: count }, (_, i) => ({
      x: maxX + options.horizontalSpacing + i * options.horizontalSpacing,
      y: options.defaultY,
    }));
  }
}
class VerticalStrategy {
  calculatePositions(existingNodes, count, options) {
    if (existingNodes.length === 0) {
      return Array.from({ length: count }, (_, i) => ({
        x: options.defaultX,
        y: options.defaultY + i * options.verticalSpacing,
      }));
    }
    const maxX = Math.max(...existingNodes.map((n) => n.position.x));
    return Array.from({ length: count }, (_, i) => ({
      x: maxX + options.horizontalSpacing,
      y: options.defaultY + i * options.verticalSpacing,
    }));
  }
}
class GridStrategy {
  constructor(columnsPerRow = 3) {
    this.columnsPerRow = columnsPerRow;
  }
  calculatePositions(existingNodes, count, options) {
    let startX = options.defaultX;
    let startY = options.defaultY;
    if (existingNodes.length > 0) {
      const maxX = Math.max(...existingNodes.map((n) => n.position.x));
      const maxY = Math.max(...existingNodes.map((n) => n.position.y));
      startX = maxX + options.horizontalSpacing;
      startY = Math.max(options.defaultY, maxY);
    }
    return Array.from({ length: count }, (_, index) => {
      const row = Math.floor(index / this.columnsPerRow);
      const col = index % this.columnsPerRow;
      return {
        x: startX + col * options.horizontalSpacing,
        y: startY + row * options.verticalSpacing,
      };
    });
  }
}
function createPositioningStrategy(type, columnsPerRow) {
  switch (type) {
    case "horizontal":
      return new HorizontalStrategy();
    case "vertical":
      return new VerticalStrategy();
    case "grid":
      return new GridStrategy(columnsPerRow);
    default:
      return new HorizontalStrategy();
  }
}
export { createPositioningStrategy };

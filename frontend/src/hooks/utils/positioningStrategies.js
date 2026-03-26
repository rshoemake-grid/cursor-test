/**
 * Positioning Strategies
 * Strategy Pattern implementation for node positioning algorithms
 * Follows Open/Closed Principle - extensible without modification
 */ function _define_property(obj, key, value) {
    if (key in obj) {
        Object.defineProperty(obj, key, {
            value: value,
            enumerable: true,
            configurable: true,
            writable: true
        });
    } else {
        obj[key] = value;
    }
    return obj;
}
/**
 * Horizontal positioning strategy
 * Single Responsibility: Only handles horizontal positioning
 */ class HorizontalStrategy {
    calculatePositions(existingNodes, count, options) {
        if (existingNodes.length === 0) {
            // Position all nodes horizontally starting from default position
            return Array.from({
                length: count
            }, (_, i)=>({
                    x: options.defaultX + i * options.horizontalSpacing,
                    y: options.defaultY
                }));
        }
        // Position nodes to the right of existing nodes
        const maxX = Math.max(...existingNodes.map((n)=>n.position.x));
        return Array.from({
            length: count
        }, (_, i)=>({
                x: maxX + options.horizontalSpacing + i * options.horizontalSpacing,
                y: options.defaultY
            }));
    }
}
/**
 * Vertical positioning strategy
 * Single Responsibility: Only handles vertical positioning
 */ class VerticalStrategy {
    calculatePositions(existingNodes, count, options) {
        if (existingNodes.length === 0) {
            // Position all nodes vertically starting from default position
            return Array.from({
                length: count
            }, (_, i)=>({
                    x: options.defaultX,
                    y: options.defaultY + i * options.verticalSpacing
                }));
        }
        // Position nodes in a column to the right of existing nodes
        const maxX = Math.max(...existingNodes.map((n)=>n.position.x));
        return Array.from({
            length: count
        }, (_, i)=>({
                x: maxX + options.horizontalSpacing,
                y: options.defaultY + i * options.verticalSpacing
            }));
    }
}
/**
 * Grid positioning strategy
 * Single Responsibility: Only handles grid positioning
 */ class GridStrategy {
    calculatePositions(existingNodes, count, options) {
        // Calculate starting position
        let startX = options.defaultX;
        let startY = options.defaultY;
        if (existingNodes.length > 0) {
            const maxX = Math.max(...existingNodes.map((n)=>n.position.x));
            const maxY = Math.max(...existingNodes.map((n)=>n.position.y));
            startX = maxX + options.horizontalSpacing;
            startY = Math.max(options.defaultY, maxY);
        }
        // Calculate positions in grid
        return Array.from({
            length: count
        }, (_, index)=>{
            const row = Math.floor(index / this.columnsPerRow);
            const col = index % this.columnsPerRow;
            return {
                x: startX + col * options.horizontalSpacing,
                y: startY + row * options.verticalSpacing
            };
        });
    }
    constructor(columnsPerRow = 3){
        _define_property(this, "columnsPerRow", void 0);
        this.columnsPerRow = columnsPerRow;
    }
}
/**
 * Strategy factory
 * Factory Pattern: Creates appropriate strategy
 * 
 * @param type Positioning strategy type
 * @param columnsPerRow Number of columns per row (for grid strategy)
 * @returns Positioning strategy instance
 */ export function createPositioningStrategy(type, columnsPerRow) {
    switch(type){
        case 'horizontal':
            return new HorizontalStrategy();
        case 'vertical':
            return new VerticalStrategy();
        case 'grid':
            return new GridStrategy(columnsPerRow);
        default:
            return new HorizontalStrategy();
    }
}

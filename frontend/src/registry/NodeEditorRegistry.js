function _define_property(obj, key, value) {
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
import { logger } from '../utils/logger';
/**
 * Node Editor Registry
 * Follows Open/Closed Principle - open for extension, closed for modification
 * New node types can be added without modifying existing code
 */ class NodeEditorRegistry {
    /**
   * Register a handler for a node type
   */ register(nodeType, handler) {
        if (this.handlers.has(nodeType)) {
            logger.warn(`Node type "${nodeType}" is already registered. Overwriting.`);
        }
        this.handlers.set(nodeType, handler);
    }
    /**
   * Get handler for a node type
   */ getHandler(nodeType) {
        return this.handlers.get(nodeType);
    }
    /**
   * Check if a node type is registered
   */ hasHandler(nodeType) {
        return this.handlers.has(nodeType);
    }
    /**
   * Get all registered node types
   */ getRegisteredTypes() {
        return Array.from(this.handlers.keys());
    }
    /**
   * Unregister a node type handler
   */ unregister(nodeType) {
        return this.handlers.delete(nodeType);
    }
    constructor(){
        _define_property(this, "handlers", new Map());
    }
}
// Export singleton instance
export const nodeEditorRegistry = new NodeEditorRegistry();

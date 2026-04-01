var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
import { logger } from "../utils/logger";
class NodeEditorRegistry {
  constructor() {
    __publicField(this, "handlers", /* @__PURE__ */ new Map());
  }
  /**
   * Register a handler for a node type
   */
  register(nodeType, handler) {
    if (this.handlers.has(nodeType)) {
      logger.warn(`Node type "${nodeType}" is already registered. Overwriting.`);
    }
    this.handlers.set(nodeType, handler);
  }
  /**
   * Get handler for a node type
   */
  getHandler(nodeType) {
    return this.handlers.get(nodeType);
  }
  /**
   * Check if a node type is registered
   */
  hasHandler(nodeType) {
    return this.handlers.has(nodeType);
  }
  /**
   * Get all registered node types
   */
  getRegisteredTypes() {
    return Array.from(this.handlers.keys());
  }
  /**
   * Unregister a node type handler
   */
  unregister(nodeType) {
    return this.handlers.delete(nodeType);
  }
}
const nodeEditorRegistry = new NodeEditorRegistry();
export {
  nodeEditorRegistry
};

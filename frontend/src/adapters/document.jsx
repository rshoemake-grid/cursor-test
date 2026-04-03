import { isBrowserEnvironment } from "../utils/environment";
const DocumentAdapterFactory = {
  /**
   * Create default document adapter
   */
  createDocumentAdapter() {
    if (!isBrowserEnvironment()) {
      return null;
    }
    return {
      createElement: (tag) => document.createElement(tag),
      getElementById: (id) => document.getElementById(id),
      getActiveElement: () => document.activeElement,
      head: document.head,
      body: document.body,
    };
  },
};
export { DocumentAdapterFactory };

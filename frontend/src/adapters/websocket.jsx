const WebSocketFactoryFactory = {
  /**
   * Create default WebSocket factory
   */
  createWebSocketFactory() {
    return {
      create: (url) => new WebSocket(url)
    };
  }
};
export {
  WebSocketFactoryFactory
};

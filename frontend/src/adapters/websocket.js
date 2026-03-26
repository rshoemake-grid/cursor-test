/**
 * WebSocket Factory
 * Follows Single Responsibility Principle - only handles WebSocket factory creation
 */ /**
 * WebSocket Factory Factory
 * Provides factory methods for creating WebSocket factories
 */ export const WebSocketFactoryFactory = {
    /**
   * Create default WebSocket factory
   */ createWebSocketFactory () {
        return {
            create: (url)=>new WebSocket(url)
        };
    }
};

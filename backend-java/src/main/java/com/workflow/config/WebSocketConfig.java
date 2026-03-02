package com.workflow.config;

import com.workflow.websocket.ExecutionWebSocketHandler;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket configuration - matches Python /ws/executions/{execution_id}
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final ExecutionWebSocketHandler executionHandler;

    public WebSocketConfig(ExecutionWebSocketHandler executionHandler) {
        this.executionHandler = executionHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(executionHandler, "/ws/executions/*")
                .setAllowedOrigins("*");
    }
}

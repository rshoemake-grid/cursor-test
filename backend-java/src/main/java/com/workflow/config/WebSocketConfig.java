package com.workflow.config;

import com.workflow.websocket.ExecutionWebSocketHandler;
import com.workflow.websocket.WebSocketAuthHandshakeInterceptor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * WebSocket configuration - matches Python /ws/executions/{execution_id}
 * S-H3: Handshake interceptor validates token and execution ownership
 * Code Review 2026: Origins configurable via websocket.allowed-origins (restricted in production)
 */
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final ExecutionWebSocketHandler executionHandler;
    private final WebSocketAuthHandshakeInterceptor authInterceptor;
    private final String[] allowedOrigins;

    public WebSocketConfig(ExecutionWebSocketHandler executionHandler,
                          WebSocketAuthHandshakeInterceptor authInterceptor,
                          @Value("${websocket.allowed-origins:*}") String allowedOrigins) {
        this.executionHandler = executionHandler;
        this.authInterceptor = authInterceptor;
        this.allowedOrigins = "*".equals(allowedOrigins) ? new String[]{"*"} : allowedOrigins.split(",");
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        var registration = registry.addHandler(executionHandler, "/ws/executions/*")
                .addInterceptors(authInterceptor);
        // Browsers send Origin (e.g. http://localhost:3000) for WS upgrades to :8000.
        // setAllowedOrigins("*") does not reliably allow cross-origin WebSocket in Spring 6+;
        // use origin patterns for the dev wildcard.
        if (allowedOrigins.length == 1 && "*".equals(allowedOrigins[0])) {
            registration.setAllowedOriginPatterns("*");
        } else {
            registration.setAllowedOrigins(allowedOrigins);
        }
    }
}

package com.workflow.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;

/**
 * Returns Apigee-compatible 403 error format for unauthorized access.
 */
@Component
public class ApigeeAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");

        Map<String, Object> body = Map.of(
            "error", Map.of(
                "code", "403",
                "message", accessDeniedException.getMessage() != null ? accessDeniedException.getMessage() : "Forbidden",
                "path", request.getRequestURI(),
                "timestamp", java.time.Instant.now().toString()
            )
        );
        response.getWriter().write(objectMapper.writeValueAsString(body));
    }
}

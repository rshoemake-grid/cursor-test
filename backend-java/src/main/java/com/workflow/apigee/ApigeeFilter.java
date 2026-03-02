package com.workflow.apigee;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.UUID;

/**
 * Apigee-compatible filter for API management.
 * Adds request correlation, security headers, rate-limit headers, and request size validation.
 * Mirrors Python backend Apigee middleware.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE - 1)  // Run before MetricsFilter to set request ID early
public class ApigeeFilter extends OncePerRequestFilter {

    private static final Logger log = LoggerFactory.getLogger(ApigeeFilter.class);
    private static final int DEFAULT_MAX_REQUEST_SIZE = 10 * 1024 * 1024;  // 10MB

    @Value("${apigee.max-request-size:" + DEFAULT_MAX_REQUEST_SIZE + "}")
    private long maxRequestSize;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        // 1. Request ID / Correlation ID (Apigee may pass these; echo or generate)
        String requestId = request.getHeader("X-Request-ID");
        if (requestId == null || requestId.isBlank()) {
            requestId = request.getHeader("X-Correlation-ID");
        }
        if (requestId == null || requestId.isBlank()) {
            requestId = UUID.randomUUID().toString();
        }
        request.setAttribute("requestId", requestId);
        response.setHeader("X-Request-ID", requestId);

        // 2. Request size validation for POST/PUT/PATCH
        if (isModifyingMethod(request.getMethod())) {
            String contentLength = request.getHeader("Content-Length");
            if (contentLength != null && !contentLength.isBlank()) {
                try {
                    long size = Long.parseLong(contentLength.trim());
                    if (size > maxRequestSize) {
                        response.setStatus(HttpServletResponse.SC_REQUEST_ENTITY_TOO_LARGE);
                        response.setContentType("application/json");
                        response.setCharacterEncoding("UTF-8");
                        double sizeMb = maxRequestSize / (1024.0 * 1024.0);
                        String body = String.format(
                            "{\"error\":{\"code\":\"413\",\"message\":\"Request body too large. Maximum size: %.1fMB\",\"path\":\"%s\",\"timestamp\":\"%s\"}}",
                            sizeMb, request.getRequestURI(), java.time.Instant.now().toString()
                        );
                        response.getWriter().write(body);
                        return;
                    }
                } catch (NumberFormatException ignored) {
                    // Invalid Content-Length; let downstream handle it
                }
            }
        }

        // 3. Add Apigee-compatible headers before processing (headers can be set until first byte)
        addSecurityHeaders(response);
        addRateLimitHeaders(response);

        filterChain.doFilter(request, response);
    }

    private boolean isModifyingMethod(String method) {
        return "POST".equalsIgnoreCase(method)
            || "PUT".equalsIgnoreCase(method)
            || "PATCH".equalsIgnoreCase(method);
    }

    private void addSecurityHeaders(HttpServletResponse response) {
        response.setHeader("X-Content-Type-Options", "nosniff");
        response.setHeader("X-Frame-Options", "DENY");
        response.setHeader("X-XSS-Protection", "1; mode=block");
        response.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    }

    private void addRateLimitHeaders(HttpServletResponse response) {
        // Placeholder values; Apigee will override with actual values when deployed behind Apigee
        response.setHeader("X-RateLimit-Limit", "1000");
        response.setHeader("X-RateLimit-Remaining", "999");
        response.setHeader("X-RateLimit-Reset", String.valueOf(System.currentTimeMillis() / 1000 + 3600));
    }
}

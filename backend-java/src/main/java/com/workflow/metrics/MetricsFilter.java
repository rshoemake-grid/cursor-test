package com.workflow.metrics;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter to record request metrics - matches Python middleware behavior.
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class MetricsFilter extends OncePerRequestFilter {

    private final MetricsCollector metricsCollector;

    public MetricsFilter(MetricsCollector metricsCollector) {
        this.metricsCollector = metricsCollector;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        long startTime = System.currentTimeMillis();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long latencyMs = System.currentTimeMillis() - startTime;
            String endpoint = request.getMethod() + " " + request.getRequestURI();
            metricsCollector.recordRequest(endpoint, response.getStatus(), latencyMs);
        }
    }
}

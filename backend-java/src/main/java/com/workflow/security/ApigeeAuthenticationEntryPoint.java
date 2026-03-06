package com.workflow.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.util.ErrorResponseBuilder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns Apigee-compatible 401 error format for unauthenticated requests.
 * DRY: Uses ErrorResponseBuilder.buildErrorBody.
 */
@Component
public class ApigeeAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper;

    public ApigeeAuthenticationEntryPoint(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void commence(HttpServletRequest request, HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        String message = authException.getMessage() != null ? authException.getMessage() : "Unauthorized";
        ErrorResponseBuilder.writeToServletResponse(response, objectMapper, "401", message,
                HttpServletResponse.SC_UNAUTHORIZED, request.getRequestURI());
    }
}

package com.workflow.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.workflow.util.ErrorMessages;
import com.workflow.util.ErrorResponseBuilder;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Returns Apigee-compatible 403 error format for unauthorized access.
 * DRY: Uses ErrorResponseBuilder.buildErrorBody.
 */
@Component
public class ApigeeAccessDeniedHandler implements AccessDeniedHandler {

    private final ObjectMapper objectMapper;

    public ApigeeAccessDeniedHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void handle(HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        String message = ErrorMessages.FORBIDDEN;
        ErrorResponseBuilder.writeToServletResponse(response, objectMapper, "403", message,
                HttpServletResponse.SC_FORBIDDEN, request.getRequestURI());
    }
}

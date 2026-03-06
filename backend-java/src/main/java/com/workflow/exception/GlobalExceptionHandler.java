package com.workflow.exception;

import com.workflow.util.ErrorResponseBuilder;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Arrays;
import java.util.Map;

/**
 * Global exception handler - matches Python FastAPI / Apigee-compatible error response format
 * DRY: Uses ErrorResponseBuilder to avoid code duplication
 * S-M1, S-M2: In production, avoid stack traces in logs and generic 500 message to client
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private static final String GENERIC_ERROR_MESSAGE = "An unexpected error occurred";

    private final Environment environment;

    public GlobalExceptionHandler(Environment environment) {
        this.environment = environment;
    }

    private boolean isProduction() {
        return Arrays.stream(environment.getActiveProfiles())
                .anyMatch(p -> "production".equalsIgnoreCase(p));
    }

    private static String getRequestPath(HttpServletRequest request) {
        return request != null ? request.getRequestURI() : null;
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<Map<String, Object>> handleResourceNotFound(
            ResourceNotFoundException e, HttpServletRequest request) {
        log.debug("Resource not found: {}", e.getMessage());
        return ErrorResponseBuilder.notFound(e.getMessage(), getRequestPath(request));
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(
            ValidationException e, HttpServletRequest request) {
        log.debug("Validation error: {}", e.getMessage());
        return ErrorResponseBuilder.validationError(e.getMessage(), getRequestPath(request));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalArgument(
            IllegalArgumentException e, HttpServletRequest request) {
        log.debug("Bad request: {}", e.getMessage());
        return ErrorResponseBuilder.badRequest(e.getMessage(), getRequestPath(request));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(
            ForbiddenException e, HttpServletRequest request) {
        log.debug("Forbidden: {}", e.getMessage());
        return ErrorResponseBuilder.forbidden(e.getMessage(), getRequestPath(request));
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException e, HttpServletRequest request) {
        String message = e.getBindingResult().getFieldErrors().stream()
            .map(error -> error.getField() + ": " + error.getDefaultMessage())
            .reduce((a, b) -> a + ", " + b)
            .orElse("Validation failed");
        log.debug("Validation error: {}", message);
        return ErrorResponseBuilder.validationError(message, getRequestPath(request));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception e, HttpServletRequest request) {
        if (isProduction()) {
            log.error("Unexpected error: {}", e.getMessage());
        } else {
            log.error("Unexpected error occurred", e);
        }
        String clientMessage = isProduction() ? GENERIC_ERROR_MESSAGE
                : (e.getMessage() != null ? e.getMessage() : GENERIC_ERROR_MESSAGE);
        return ErrorResponseBuilder.internalServerError(clientMessage, getRequestPath(request));
    }
}

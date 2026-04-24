package com.workflow.exception;

import com.workflow.util.ObjectUtils;
import com.workflow.util.EnvironmentUtils;
import com.workflow.util.ErrorMessages;
import com.workflow.util.ErrorResponseBuilder;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.core.env.Environment;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

/**
 * Global exception handler - matches Python FastAPI / Apigee-compatible error response format
 * DRY: Uses ErrorResponseBuilder to avoid code duplication
 * S-M1, S-M2: In production, avoid stack traces in logs and generic 500 message to client
 */
@RestControllerAdvice
public class GlobalExceptionHandler {
    private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    private final Environment environment;

    public GlobalExceptionHandler(Environment environment) {
        this.environment = environment;
    }

    private static String getRequestPath(HttpServletRequest request) {
        return ObjectUtils.safeGet(request, HttpServletRequest::getRequestURI);
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

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<Map<String, Object>> handleIllegalState(
            IllegalStateException e, HttpServletRequest request) {
        log.debug("Invalid state: {}", e.getMessage());
        return ErrorResponseBuilder.internalServerError(e.getMessage(), getRequestPath(request));
    }

    @ExceptionHandler(UnauthorizedException.class)
    public ResponseEntity<Map<String, Object>> handleUnauthorized(
            UnauthorizedException e, HttpServletRequest request) {
        log.debug("Unauthorized: {}", e.getMessage());
        return ErrorResponseBuilder.unauthorized(e.getMessage(), getRequestPath(request));
    }

    @ExceptionHandler(ForbiddenException.class)
    public ResponseEntity<Map<String, Object>> handleForbidden(
            ForbiddenException e, HttpServletRequest request) {
        log.debug("Forbidden: {}", e.getMessage());
        return ErrorResponseBuilder.forbidden(e.getMessage(), getRequestPath(request));
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<Map<String, Object>> handleBadCredentials(
            BadCredentialsException e, HttpServletRequest request) {
        log.debug("Bad credentials: {}", e.getMessage());
        return ErrorResponseBuilder.unauthorized(ErrorMessages.INVALID_CREDENTIALS, getRequestPath(request));
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<Map<String, Object>> handleHttpMessageNotReadable(
            HttpMessageNotReadableException e, HttpServletRequest request) {
        boolean jsonish =
                e.getMessage() != null
                        && (e.getMessage().contains("JSON")
                                || e.getMessage().contains("json"));
        String message =
                jsonish ? ErrorMessages.INVALID_JSON : ErrorMessages.INVALID_REQUEST_BODY;
        if (!EnvironmentUtils.isProduction(environment)) {
            Throwable root = e.getMostSpecificCause();
            if (root != null && root.getMessage() != null && !root.getMessage().equals(e.getMessage())) {
                String hint = root.getMessage();
                if (hint.length() > 400) {
                    hint = hint.substring(0, 400) + "…";
                }
                message = message + " — " + hint;
            }
        }
        if (EnvironmentUtils.isProduction(environment)) {
            log.debug("Bad request (malformed JSON/body): {}", message);
        } else {
            log.warn("Bad request (malformed JSON/body): {}", message, e);
        }
        return ErrorResponseBuilder.badRequest(message, getRequestPath(request));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleMethodArgumentNotValid(
            MethodArgumentNotValidException e, HttpServletRequest request) {
        log.debug("Validation error: {}", e.getBindingResult().getFieldErrors());
        return ErrorResponseBuilder.validationError(ErrorMessages.VALIDATION_FAILED, getRequestPath(request));
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGenericException(
            Exception e, HttpServletRequest request) {
        if (EnvironmentUtils.isProduction(environment)) {
            log.error("Unexpected error: {}", e.getMessage());
        } else {
            log.error("Unexpected error occurred", e);
        }
        return ErrorResponseBuilder.internalServerError(ErrorMessages.UNEXPECTED_ERROR, getRequestPath(request));
    }
}

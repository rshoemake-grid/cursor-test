package com.workflow.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import java.io.IOException;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Objects;

/**
 * Utility class for building standardized error responses
 * DRY: Centralizes error response building logic
 * Matches Python FastAPI / Apigee-compatible error response format
 */
public class ErrorResponseBuilder {
    
    /**
     * Build standardized error response (Apigee-compatible)
     * @param code HTTP status code as string
     * @param message Error message
     * @param status HTTP status
     * @return ResponseEntity with error response
     */
    public static ResponseEntity<Map<String, Object>> buildErrorResponse(
            String code, String message, HttpStatus status) {
        return buildErrorResponse(code, message, status, null);
    }

    /**
     * Build standardized error response with path (Apigee-compatible)
     */
    public static ResponseEntity<Map<String, Object>> buildErrorResponse(
            String code, String message, HttpStatus status, String path) {
        return ResponseEntity.status(status).body(buildErrorBody(code, message, path));
    }

    /**
     * Build error response body map (Apigee-compatible). Use for servlet responses.
     */
    public static Map<String, Object> buildErrorBody(String code, String message, String path) {
        Map<String, Object> error = new HashMap<>();
        error.put("code", code);
        error.put("message", Objects.requireNonNullElse(message, ""));
        error.put("timestamp", Instant.now().toString());
        if (path != null && !path.isBlank()) {
            error.put("path", path);
        }
        Map<String, Object> response = new HashMap<>();
        response.put("error", error);
        return response;
    }

    /**
     * Write error response to HttpServletResponse. Use for servlet entry points (401, 403).
     */
    public static void writeToServletResponse(HttpServletResponse response, ObjectMapper objectMapper,
                                              String code, String message, int status, String path) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(objectMapper.writeValueAsString(buildErrorBody(code, message, path)));
    }
    
    /**
     * Build error response for internal server error
     */
    public static ResponseEntity<Map<String, Object>> internalServerError(String message) {
        return buildErrorResponse("500", message, HttpStatus.INTERNAL_SERVER_ERROR, null);
    }

    /**
     * Build error response for internal server error with path
     */
    public static ResponseEntity<Map<String, Object>> internalServerError(String message, String path) {
        return buildErrorResponse("500", message, HttpStatus.INTERNAL_SERVER_ERROR, path);
    }
    
    /**
     * Build error response for not found
     */
    public static ResponseEntity<Map<String, Object>> notFound(String message) {
        return buildErrorResponse("404", message, HttpStatus.NOT_FOUND, null);
    }

    /**
     * Build error response for not found with path
     */
    public static ResponseEntity<Map<String, Object>> notFound(String message, String path) {
        return buildErrorResponse("404", message, HttpStatus.NOT_FOUND, path);
    }
    
    /**
     * Build error response for validation error
     */
    public static ResponseEntity<Map<String, Object>> validationError(String message) {
        return buildErrorResponse("422", message, HttpStatus.UNPROCESSABLE_ENTITY, null);
    }

    /**
     * Build error response for validation error with path
     */
    public static ResponseEntity<Map<String, Object>> validationError(String message, String path) {
        return buildErrorResponse("422", message, HttpStatus.UNPROCESSABLE_ENTITY, path);
    }
    
    /**
     * Build error response for bad request
     */
    public static ResponseEntity<Map<String, Object>> badRequest(String message) {
        return buildErrorResponse("400", message, HttpStatus.BAD_REQUEST, null);
    }

    /**
     * Build error response for bad request with path
     */
    public static ResponseEntity<Map<String, Object>> badRequest(String message, String path) {
        return buildErrorResponse("400", message, HttpStatus.BAD_REQUEST, path);
    }
    
    /**
     * Build error response for unauthorized
     */
    public static ResponseEntity<Map<String, Object>> unauthorized(String message) {
        return buildErrorResponse("401", message, HttpStatus.UNAUTHORIZED, null);
    }

    /**
     * Build error response for unauthorized with path
     */
    public static ResponseEntity<Map<String, Object>> unauthorized(String message, String path) {
        return buildErrorResponse("401", message, HttpStatus.UNAUTHORIZED, path);
    }

    /**
     * Build error response for forbidden
     */
    public static ResponseEntity<Map<String, Object>> forbidden(String message) {
        return buildErrorResponse("403", message, HttpStatus.FORBIDDEN, null);
    }

    /**
     * Build error response for forbidden with path
     */
    public static ResponseEntity<Map<String, Object>> forbidden(String message, String path) {
        return buildErrorResponse("403", message, HttpStatus.FORBIDDEN, path);
    }

}

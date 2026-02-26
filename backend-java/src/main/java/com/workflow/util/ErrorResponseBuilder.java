package com.workflow.util;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Utility class for building standardized error responses
 * DRY: Centralizes error response building logic
 * Matches Python FastAPI error response format
 */
public class ErrorResponseBuilder {
    
    /**
     * Build standardized error response
     * @param code HTTP status code as string
     * @param message Error message
     * @param status HTTP status
     * @return ResponseEntity with error response
     */
    public static ResponseEntity<Map<String, Object>> buildErrorResponse(
            String code, String message, HttpStatus status) {
        Map<String, Object> error = new HashMap<>();
        error.put("code", code);
        error.put("message", message);
        error.put("timestamp", LocalDateTime.now().toString());
        
        Map<String, Object> response = new HashMap<>();
        response.put("error", error);
        
        return ResponseEntity.status(status).body(response);
    }
    
    /**
     * Build error response for internal server error
     */
    public static ResponseEntity<Map<String, Object>> internalServerError(String message) {
        return buildErrorResponse("500", message, HttpStatus.INTERNAL_SERVER_ERROR);
    }
    
    /**
     * Build error response for not found
     */
    public static ResponseEntity<Map<String, Object>> notFound(String message) {
        return buildErrorResponse("404", message, HttpStatus.NOT_FOUND);
    }
    
    /**
     * Build error response for validation error
     */
    public static ResponseEntity<Map<String, Object>> validationError(String message) {
        return buildErrorResponse("422", message, HttpStatus.UNPROCESSABLE_ENTITY);
    }
    
    /**
     * Build error response for bad request
     */
    public static ResponseEntity<Map<String, Object>> badRequest(String message) {
        return buildErrorResponse("400", message, HttpStatus.BAD_REQUEST);
    }
    
    /**
     * Build error response for unauthorized
     */
    public static ResponseEntity<Map<String, Object>> unauthorized(String message) {
        return buildErrorResponse("401", message, HttpStatus.UNAUTHORIZED);
    }
}

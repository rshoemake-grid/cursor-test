package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Login request DTO - matches Python UserLogin schema
 * Supports remember_me for extended token expiry
 * Ignores unknown fields (e.g. email, fullName from UserCreate) for compatibility
 */
@Data
@JsonIgnoreProperties(ignoreUnknown = true)
@NoArgsConstructor
@AllArgsConstructor
public class LoginRequest {
    @NotBlank(message = "Username is required")
    private String username;

    @NotBlank(message = "Password is required")
    private String password;

    @JsonProperty("remember_me")
    private Boolean rememberMe = false;
}

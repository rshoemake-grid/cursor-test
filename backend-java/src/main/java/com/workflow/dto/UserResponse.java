package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * UserResponse DTO - matches Python UserResponse schema (snake_case for API compatibility)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private String email;

    @JsonProperty("full_name")
    private String fullName;

    @JsonProperty("is_active")
    private Boolean isActive;

    @JsonProperty("is_admin")
    private Boolean isAdmin;

    @JsonProperty("created_at")
    private LocalDateTime createdAt;

    @JsonProperty("last_login")
    private LocalDateTime lastLogin;
}

package com.workflow.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * UserResponse DTO - matches Python UserResponse schema
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private String id;
    private String username;
    private String email;
    private String fullName;
    private Boolean isActive;
    private Boolean isAdmin;
    private LocalDateTime createdAt;
    private LocalDateTime lastLogin;
}

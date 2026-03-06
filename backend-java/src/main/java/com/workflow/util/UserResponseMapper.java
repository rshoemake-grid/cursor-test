package com.workflow.util;

import com.workflow.dto.UserResponse;
import com.workflow.entity.User;
import org.springframework.stereotype.Component;

/**
 * SRP-3: Maps User entity to UserResponse DTO.
 */
@Component
public class UserResponseMapper {

    public UserResponse toUserResponse(User user) {
        if (user == null) return null;
        UserResponse response = new UserResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setFullName(user.getFullName());
        response.setIsActive(user.getIsActive());
        response.setIsAdmin(user.getIsAdmin());
        response.setCreatedAt(user.getCreatedAt());
        response.setLastLogin(user.getLastLogin());
        return response;
    }
}

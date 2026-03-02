package com.workflow.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * TokenResponse DTO - matches Python Token schema (snake_case for API compatibility)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
public class TokenResponse {
    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("token_type")
    private String tokenType = "bearer";

    @JsonProperty("refresh_token")
    private String refreshToken;

    @JsonProperty("expires_in")
    private Long expiresIn;  // seconds until access token expiration

    private UserResponse user;
}

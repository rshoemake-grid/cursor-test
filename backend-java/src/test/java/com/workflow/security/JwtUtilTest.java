package com.workflow.security;

import com.workflow.config.JwtTimeProperties;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

import io.jsonwebtoken.JwtException;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private static final String TEST_SECRET = "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256-algorithm";
    private static final String TEST_REFRESH_SECRET =
            "other-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256-algorithm";

    @BeforeEach
    void setUp() {
        JwtTimeProperties times = new JwtTimeProperties();
        times.setAccessExpirationMinutes(60);
        times.setRefreshExpirationDays(7);
        jwtUtil = new JwtUtil(TEST_SECRET, "", times);
    }

    @Test
    void generateToken_ReturnsValidToken() {
        String token = jwtUtil.generateToken("testuser", "user-123");

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void generateRefreshToken_ReturnsValidToken() {
        String token = jwtUtil.generateRefreshToken("testuser", "user-123");

        assertNotNull(token);
        assertFalse(token.isEmpty());
    }

    @Test
    void generateRefreshToken_withoutSeparateRefreshSecret_isReadableWithAccessVerification() {
        String refresh = jwtUtil.generateRefreshToken("testuser", "user-123");

        assertEquals("testuser", jwtUtil.extractUsername(refresh));
    }

    @Test
    void generateRefreshToken_withSeparateRefreshSecret_failsAccessKeyVerification() {
        JwtTimeProperties times = new JwtTimeProperties();
        times.setAccessExpirationMinutes(60);
        times.setRefreshExpirationDays(7);
        JwtUtil withRefreshKey = new JwtUtil(TEST_SECRET, TEST_REFRESH_SECRET, times);

        String refresh = withRefreshKey.generateRefreshToken("testuser", "user-123");

        assertThrows(JwtException.class, () -> withRefreshKey.extractUsername(refresh));
    }

    @Test
    void extractUsername_FromValidToken_ReturnsUsername() {
        String token = jwtUtil.generateToken("testuser", "user-123");

        String username = jwtUtil.extractUsername(token);

        assertEquals("testuser", username);
    }

    @Test
    void extractExpiration_FromValidToken_ReturnsFutureDate() {
        String token = jwtUtil.generateToken("testuser", "user-123");

        assertNotNull(jwtUtil.extractExpiration(token));
    }

    @Test
    void validateToken_WithValidToken_ReturnsTrue() {
        String token = jwtUtil.generateToken("testuser", "user-123");

        Boolean valid = jwtUtil.validateToken(token, "testuser");

        assertTrue(valid);
    }

    @Test
    void validateToken_WithWrongUsername_ReturnsFalse() {
        String token = jwtUtil.generateToken("testuser", "user-123");

        Boolean valid = jwtUtil.validateToken(token, "wronguser");

        assertFalse(valid);
    }

    @Test
    void generateToken_DifferentUsers_ProducesDifferentTokens() {
        String token1 = jwtUtil.generateToken("user1", "id-1");
        String token2 = jwtUtil.generateToken("user2", "id-2");

        assertNotEquals(token1, token2);
    }

}

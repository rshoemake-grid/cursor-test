package com.workflow.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;

import static org.junit.jupiter.api.Assertions.*;

class JwtUtilTest {

    private JwtUtil jwtUtil;
    private static final String TEST_SECRET = "test-secret-key-that-is-at-least-256-bits-long-for-hmac-sha256-algorithm";
    private static final Long EXPIRATION = 3600000L;
    private static final Long REFRESH_EXPIRATION = 604800000L;

    @BeforeEach
    void setUp() throws Exception {
        jwtUtil = new JwtUtil();
        setField(jwtUtil, "secret", TEST_SECRET);
        setField(jwtUtil, "expiration", EXPIRATION);
        setField(jwtUtil, "refreshExpiration", REFRESH_EXPIRATION);
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

    private void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = target.getClass().getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}

package com.workflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.boot.ApplicationArguments;
import org.springframework.core.env.Environment;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/**
 * Tests for JwtSecretValidator - S-M3: JWT key size check in production.
 */
class JwtSecretValidatorTest {

    private static final ApplicationArguments ARGS = mock(ApplicationArguments.class);

    @Test
    void run_productionShortSecret_throws() {
        Environment env = mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"production"});

        JwtSecretValidator validator = new JwtSecretValidator("short", env);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> validator.run(ARGS));
        assertTrue(ex.getMessage().contains("256 bits"));
        assertTrue(ex.getMessage().contains("32 bytes"));
    }

    @Test
    void run_productionLongSecret_doesNotThrow() {
        Environment env = mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"production"});
        String longSecret = "a".repeat(32);

        JwtSecretValidator validator = new JwtSecretValidator(longSecret, env);

        assertDoesNotThrow(() -> validator.run(ARGS));
    }

    @Test
    void run_testProfile_doesNotThrow() {
        Environment env = mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"test"});

        JwtSecretValidator validator = new JwtSecretValidator("short", env);

        assertDoesNotThrow(() -> validator.run(ARGS));
    }

    @Test
    void run_productionDefaultSecret_throws() {
        Environment env = mock(Environment.class);
        when(env.getActiveProfiles()).thenReturn(new String[]{"production"});

        JwtSecretValidator validator = new JwtSecretValidator(
                "your-secret-key-change-in-production-min-256-bits", env);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> validator.run(ARGS));
        assertTrue(ex.getMessage().contains("must not equal the default"));
    }
}

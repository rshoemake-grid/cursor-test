package com.workflow.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * S-C4: Fail startup if JWT secret is missing or equals default in production.
 * S-M3: For HS256, key must be ≥256 bits (32 bytes) to avoid weak-key attacks.
 */
@Component
public class JwtSecretValidator implements ApplicationRunner {

    private static final String DEFAULT_SECRET = "your-secret-key-change-in-production-min-256-bits";
    /** HS256 requires key ≥256 bits (32 bytes) per NIST/OWASP recommendations */
    private static final int MIN_SECRET_BYTES = 32;

    private final String jwtSecret;
    private final Environment environment;

    public JwtSecretValidator(
            @Value("${jwt.secret}") String jwtSecret,
            Environment environment) {
        this.jwtSecret = jwtSecret;
        this.environment = environment;
    }

    @Override
    public void run(ApplicationArguments args) {
        if (!isProduction()) {
            return;
        }
        if (jwtSecret == null || jwtSecret.isBlank() || DEFAULT_SECRET.equals(jwtSecret)) {
            throw new IllegalStateException(
                    "S-C4: JWT_SECRET must be set and must not equal the default value in production. " +
                    "Set JWT_SECRET environment variable to a secure value (min 256 bits for HS256).");
        }
        int byteLength = jwtSecret.getBytes(java.nio.charset.StandardCharsets.UTF_8).length;
        if (byteLength < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "S-M3: JWT_SECRET must be at least 256 bits (32 bytes) for HS256. " +
                    "Current length: " + byteLength + " bytes. Use a longer secret.");
        }
    }

    private boolean isProduction() {
        for (String profile : environment.getActiveProfiles()) {
            if ("production".equalsIgnoreCase(profile)) {
                return true;
            }
        }
        return false;
    }
}

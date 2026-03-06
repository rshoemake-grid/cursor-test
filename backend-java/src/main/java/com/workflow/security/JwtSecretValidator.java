package com.workflow.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

/**
 * S-C4: Fail startup if JWT secret is missing or equals default in production.
 */
@Component
public class JwtSecretValidator implements ApplicationRunner {

    private static final String DEFAULT_SECRET = "your-secret-key-change-in-production-min-256-bits";

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

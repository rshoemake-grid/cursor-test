package com.workflow.config;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;

/**
 * Parity with Python {@code backend/services/test_access_token_expire_settings.py}.
 */
class JwtTimePropertiesTest {

    private final Validator validator = Validation.buildDefaultValidatorFactory().getValidator();

    @Test
    void defaultsMatchPython() {
        JwtTimeProperties p = new JwtTimeProperties();
        assertEquals(30, p.getAccessExpirationMinutes());
        assertEquals(30, p.getRefreshExpirationDays());
        assertEquals(0, validator.validate(p).size());
    }

    @Test
    void accessExpirationMinutesTwentyIsValid() {
        JwtTimeProperties p = new JwtTimeProperties();
        p.setAccessExpirationMinutes(20);
        Set<ConstraintViolation<JwtTimeProperties>> v = validator.validate(p);
        assertEquals(0, v.size());
    }

    @Test
    void accessExpirationMinutesBelowTwentyIsInvalid() {
        JwtTimeProperties p = new JwtTimeProperties();
        p.setAccessExpirationMinutes(19);
        Set<ConstraintViolation<JwtTimeProperties>> v = validator.validate(p);
        assertFalse(v.isEmpty());
    }

    @Test
    void millisHelpers() {
        JwtTimeProperties p = new JwtTimeProperties();
        p.setAccessExpirationMinutes(30);
        p.setRefreshExpirationDays(30);
        assertEquals(30L * 60 * 1000, p.getAccessExpirationMillis());
        assertEquals(30L * 24 * 60 * 60 * 1000, p.getRefreshExpirationMillis());
    }
}

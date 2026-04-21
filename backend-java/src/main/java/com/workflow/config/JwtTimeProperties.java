package com.workflow.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * JWT lifetimes aligned with the Python backend ({@code backend/config.py}, {@code backend/auth/auth.py}):
 * <ul>
 *   <li>Access token: {@code ACCESS_TOKEN_EXPIRE_MINUTES} (minimum 20, default 30)</li>
 *   <li>Refresh token: {@code REFRESH_TOKEN_EXPIRE_DAYS} (default 30 days, matches Python {@code REFRESH_TOKEN_EXPIRE_DAYS})</li>
 * </ul>
 */
@ConfigurationProperties(prefix = "jwt")
@Validated
public class JwtTimeProperties {

    /**
     * Same semantics as Python {@code Settings.access_token_expire_minutes} / env {@code ACCESS_TOKEN_EXPIRE_MINUTES}.
     */
    @Min(20)
    @Max(525600)
    private int accessExpirationMinutes = 30;

    /**
     * Same semantics as Python {@code REFRESH_TOKEN_EXPIRE_DAYS} in {@code backend/auth/auth.py}.
     */
    @Min(1)
    @Max(3660)
    private int refreshExpirationDays = 30;

    public int getAccessExpirationMinutes() {
        return accessExpirationMinutes;
    }

    public void setAccessExpirationMinutes(int accessExpirationMinutes) {
        this.accessExpirationMinutes = accessExpirationMinutes;
    }

    public int getRefreshExpirationDays() {
        return refreshExpirationDays;
    }

    public void setRefreshExpirationDays(int refreshExpirationDays) {
        this.refreshExpirationDays = refreshExpirationDays;
    }

    public long getAccessExpirationMillis() {
        return accessExpirationMinutes * 60L * 1000L;
    }

    public long getRefreshExpirationMillis() {
        return refreshExpirationDays * 24L * 60L * 60L * 1000L;
    }
}

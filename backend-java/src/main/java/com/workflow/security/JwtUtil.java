package com.workflow.security;

import com.workflow.config.JwtTimeProperties;
import com.workflow.util.ObjectUtils;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Component
public class JwtUtil {
    private final String secret;
    private final String refreshSecret;
    private final JwtTimeProperties jwtTimeProperties;

    public JwtUtil(
            @Value("${jwt.secret}") String secret,
            @Value("${jwt.refresh-secret:}") String refreshSecret,
            JwtTimeProperties jwtTimeProperties) {
        this.secret = secret;
        this.refreshSecret = refreshSecret != null ? refreshSecret : "";
        this.jwtTimeProperties = jwtTimeProperties;
    }

    private SecretKey getSigningKey() {
        byte[] keyBytes = secret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(keyBytes);
    }

    /** Refresh tokens use {@code jwt.refresh-secret} when set; otherwise the access secret (Python parity). */
    private SecretKey getRefreshSigningKey() {
        if (!refreshSecret.isBlank()) {
            return Keys.hmacShaKeyFor(refreshSecret.getBytes(StandardCharsets.UTF_8));
        }
        return getSigningKey();
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    /** Extract userId from token claims (for WebSocket auth). Returns null if invalid/expired. */
    public String extractUserId(String token) {
        try {
            Claims claims = extractAllClaims(token);
            Object userId = claims.get("userId");
            return ObjectUtils.toStringOrDefault(userId, null);
        } catch (Exception e) {
            return null;
        }
    }

    public Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    private Boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    public String generateToken(String username, String userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        return createAccessToken(claims, username, jwtTimeProperties.getAccessExpirationMillis());
    }

    /**
     * Generate token with custom expiration (e.g. for remember_me = 7 days)
     */
    public String generateToken(String username, String userId, long expirationMs) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        return createAccessToken(claims, username, expirationMs);
    }

    public String generateRefreshToken(String username, String userId) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", userId);
        return createToken(claims, username, jwtTimeProperties.getRefreshExpirationMillis(), getRefreshSigningKey());
    }

    private String createToken(Map<String, Object> claims, String subject, long expirationTime, SecretKey signingKey) {
        return Jwts.builder()
                .claims(claims)
                .subject(subject)
                .issuedAt(new Date(System.currentTimeMillis()))
                .expiration(new Date(System.currentTimeMillis() + expirationTime))
                .signWith(signingKey)
                .compact();
    }

    private String createAccessToken(Map<String, Object> claims, String subject, long expirationTime) {
        return createToken(claims, subject, expirationTime, getSigningKey());
    }

    public Boolean validateToken(String token, String username) {
        final String extractedUsername = extractUsername(token);
        return extractedUsername != null && extractedUsername.equals(username) && !isTokenExpired(token);
    }
}

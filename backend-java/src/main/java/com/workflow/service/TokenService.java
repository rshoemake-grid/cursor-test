package com.workflow.service;

import com.workflow.dto.TokenResponse;
import com.workflow.entity.RefreshToken;
import com.workflow.entity.User;
import com.workflow.exception.ValidationException;
import com.workflow.repository.RefreshTokenRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.RepositoryUtils;
import com.workflow.repository.UserRepository;
import com.workflow.security.JwtUtil;
import com.workflow.util.UserResponseMapper;
import com.workflow.config.JwtTimeProperties;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;

import static com.workflow.constants.WorkflowConstants.TOKEN_TYPE_BEARER;

/**
 * SRP-3: Token generation and refresh logic extracted from AuthService.
 */
@Service
public class TokenService {
    private static final Logger log = LoggerFactory.getLogger(TokenService.class);

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtUtil jwtUtil;
    private final UserResponseMapper userResponseMapper;
    private final JwtTimeProperties jwtTimeProperties;

    public TokenService(UserRepository userRepository, RefreshTokenRepository refreshTokenRepository,
                        JwtUtil jwtUtil, UserResponseMapper userResponseMapper,
                        JwtTimeProperties jwtTimeProperties) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.jwtUtil = jwtUtil;
        this.userResponseMapper = userResponseMapper;
        this.jwtTimeProperties = jwtTimeProperties;
    }

    public TokenResponse buildTokenResponse(String accessToken, String refreshToken, User user) {
        return buildTokenResponse(
                accessToken, refreshToken, user, jwtTimeProperties.getAccessExpirationMillis() / 1000);
    }

    public TokenResponse buildTokenResponse(String accessToken, String refreshToken, User user, long expiresInSeconds) {
        TokenResponse response = new TokenResponse();
        response.setAccessToken(accessToken);
        response.setRefreshToken(refreshToken);
        response.setTokenType(TOKEN_TYPE_BEARER);
        response.setExpiresIn(expiresInSeconds);
        response.setUser(userResponseMapper.toUserResponse(user));
        return response;
    }

    @Transactional
    public void saveRefreshToken(String userId, String refreshToken) {
        RefreshToken entity = new RefreshToken();
        entity.setId(UUID.randomUUID().toString());
        entity.setUserId(userId);
        entity.setToken(refreshToken);
        entity.setExpiresAt(LocalDateTime.now().plusDays(jwtTimeProperties.getRefreshExpirationDays()));
        entity.setRevoked(false);
        refreshTokenRepository.save(entity);
    }

    @Transactional
    public TokenResponse refreshToken(String refreshTokenValue) {
        log.debug("Refreshing token");

        RefreshToken tokenEntity = RepositoryUtils.orElseThrow(
                refreshTokenRepository.findByToken(refreshTokenValue),
                () -> new ValidationException(ErrorMessages.INVALID_REFRESH_TOKEN));

        if (tokenEntity.getRevoked() || tokenEntity.getExpiresAt().isBefore(LocalDateTime.now())) {
            throw new ValidationException(ErrorMessages.REFRESH_TOKEN_EXPIRED);
        }

        User user = RepositoryUtils.findByIdOrThrow(userRepository, tokenEntity.getUserId(), ErrorMessages.USER_NOT_FOUND);

        String newAccessToken = jwtUtil.generateToken(user.getUsername(), user.getId());
        String newRefreshToken = jwtUtil.generateRefreshToken(user.getUsername(), user.getId());

        tokenEntity.setToken(newRefreshToken);
        tokenEntity.setExpiresAt(LocalDateTime.now().plusDays(jwtTimeProperties.getRefreshExpirationDays()));
        refreshTokenRepository.save(tokenEntity);

        log.debug("Token refreshed for user: {}", user.getUsername());

        return buildTokenResponse(newAccessToken, newRefreshToken, user);
    }
}

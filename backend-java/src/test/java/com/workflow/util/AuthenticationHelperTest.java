package com.workflow.util;

import com.workflow.entity.User;
import com.workflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthenticationHelperTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AuthenticationHelper authenticationHelper;

    private Authentication authentication;
    private UserDetails userDetails;
    private User userEntity;

    @BeforeEach
    void setUp() {
        // Setup UserDetails
        userDetails = org.springframework.security.core.userdetails.User.builder()
            .username("testuser")
            .password("password")
            .authorities("ROLE_USER")
            .build();

        // Setup User entity
        userEntity = new User();
        userEntity.setId("user-id");
        userEntity.setUsername("testuser");
        userEntity.setEmail("test@example.com");
        userEntity.setHashedPassword("hashedPassword");
        userEntity.setIsActive(true);
        userEntity.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void extractUserId_AuthenticatedUser_Success() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(userEntity));

        // When
        String result = authenticationHelper.extractUserId(authentication);

        // Then
        assertNotNull(result);
        assertEquals("user-id", result);
        verify(userRepository, times(1)).findByUsername("testuser");
    }

    @Test
    void extractUserId_NullAuthentication_ReturnsNull() {
        // When
        String result = authenticationHelper.extractUserId(null);

        // Then
        assertNull(result);
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void extractUserId_NotAuthenticated_ReturnsNull() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(false);

        // When
        String result = authenticationHelper.extractUserId(authentication);

        // Then
        assertNull(result);
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void extractUserId_NonUserDetailsPrincipal_ReturnsNull() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("not-a-userdetails");

        // When
        String result = authenticationHelper.extractUserId(authentication);

        // Then
        assertNull(result);
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void extractUserId_UserNotFound_ReturnsNull() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        // When
        String result = authenticationHelper.extractUserId(authentication);

        // Then
        assertNull(result);
        verify(userRepository, times(1)).findByUsername("testuser");
    }

    @Test
    void extractUser_AuthenticatedUser_Success() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.of(userEntity));

        // When
        Optional<User> result = authenticationHelper.extractUser(authentication);

        // Then
        assertTrue(result.isPresent());
        assertEquals("user-id", result.get().getId());
        assertEquals("testuser", result.get().getUsername());
        verify(userRepository, times(1)).findByUsername("testuser");
    }

    @Test
    void extractUser_NullAuthentication_ReturnsEmpty() {
        // When
        Optional<User> result = authenticationHelper.extractUser(null);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void extractUser_NotAuthenticated_ReturnsEmpty() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(false);

        // When
        Optional<User> result = authenticationHelper.extractUser(authentication);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void extractUser_NonUserDetailsPrincipal_ReturnsEmpty() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn("not-a-userdetails");

        // When
        Optional<User> result = authenticationHelper.extractUser(authentication);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository, never()).findByUsername(anyString());
    }

    @Test
    void extractUser_UserNotFound_ReturnsEmpty() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);
        when(authentication.getPrincipal()).thenReturn(userDetails);
        when(userRepository.findByUsername("testuser")).thenReturn(Optional.empty());

        // When
        Optional<User> result = authenticationHelper.extractUser(authentication);

        // Then
        assertFalse(result.isPresent());
        verify(userRepository, times(1)).findByUsername("testuser");
    }

    @Test
    void isAuthenticated_Authenticated_ReturnsTrue() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(true);

        // When
        boolean result = authenticationHelper.isAuthenticated(authentication);

        // Then
        assertTrue(result);
    }

    @Test
    void isAuthenticated_NotAuthenticated_ReturnsFalse() {
        // Given
        authentication = mock(Authentication.class);
        when(authentication.isAuthenticated()).thenReturn(false);

        // When
        boolean result = authenticationHelper.isAuthenticated(authentication);

        // Then
        assertFalse(result);
    }

    @Test
    void isAuthenticated_NullAuthentication_ReturnsFalse() {
        // When
        boolean result = authenticationHelper.isAuthenticated(null);

        // Then
        assertFalse(result);
    }
}

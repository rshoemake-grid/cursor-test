package com.workflow.security;

import com.workflow.entity.User;
import com.workflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserDetailsServiceImplTest {

    @Mock
    private UserRepository userRepository;

    private UserDetailsServiceImpl userDetailsService;

    private User user;

    @BeforeEach
    void setUp() {
        userDetailsService = new UserDetailsServiceImpl(userRepository);

        user = new User();
        user.setId("user-id");
        user.setUsername("testuser");
        user.setEmail("test@example.com");
        user.setHashedPassword("hashedPassword");
        user.setIsActive(true);
        user.setCreatedAt(LocalDateTime.now());
    }

    @Test
    void loadUserByUsername_UserExists_ReturnsUserDetails() {
        when(userRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.of(user));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertNotNull(result);
        assertEquals("testuser", result.getUsername());
        assertEquals("hashedPassword", result.getPassword());
        assertTrue(result.isEnabled());
        assertTrue(result.getAuthorities().isEmpty());
        verify(userRepository, times(1)).findByUsernameOrEmail("testuser");
    }

    @Test
    void loadUserByUsername_UserNotFound_ThrowsUsernameNotFoundException() {
        when(userRepository.findByUsernameOrEmail("unknown")).thenReturn(Optional.empty());

        assertThrows(UsernameNotFoundException.class, () ->
                userDetailsService.loadUserByUsername("unknown"));

        verify(userRepository, times(1)).findByUsernameOrEmail("unknown");
    }

    @Test
    void loadUserByUsername_InactiveUser_ReturnsUserDetailsWithDisabled() {
        user.setIsActive(false);
        when(userRepository.findByUsernameOrEmail("testuser")).thenReturn(Optional.of(user));

        UserDetails result = userDetailsService.loadUserByUsername("testuser");

        assertNotNull(result);
        assertFalse(result.isEnabled());
    }

    @Test
    void loadUserByUsername_ResolvesEmailToSameUser() {
        when(userRepository.findByUsernameOrEmail("test@example.com")).thenReturn(Optional.of(user));

        UserDetails result = userDetailsService.loadUserByUsername("test@example.com");

        assertEquals("testuser", result.getUsername());
        verify(userRepository, times(1)).findByUsernameOrEmail("test@example.com");
    }
}

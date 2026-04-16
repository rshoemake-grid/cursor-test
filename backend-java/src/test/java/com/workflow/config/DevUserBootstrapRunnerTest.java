package com.workflow.config;

import com.workflow.entity.User;
import com.workflow.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DevUserBootstrapRunnerTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private Environment environment;

    private DevUserBootstrapRunner runner;

    @BeforeEach
    void setUp() {
        runner = new DevUserBootstrapRunner(userRepository, passwordEncoder, environment);
    }

    @Test
    void skipsWhenProductionProfile() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"production"});
        injectBootstrapFields("devuser", "secret", "");
        runner.run(null);
        verifyNoInteractions(userRepository);
    }

    @Test
    void skipsWhenUsernameBlank() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"development"});
        injectBootstrapFields("", "secret", "");
        runner.run(null);
        verifyNoInteractions(userRepository);
    }

    @Test
    void createsUserWhenMissing() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"development"});
        injectBootstrapFields("newuser", "pw", "");
        when(userRepository.findByUsernameOrEmail("newuser")).thenReturn(Optional.empty());
        when(passwordEncoder.encode("pw")).thenReturn("hash");

        runner.run(null);

        ArgumentCaptor<User> cap = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(cap.capture());
        assertEquals("newuser", cap.getValue().getUsername());
        assertTrue(cap.getValue().getEmail().endsWith("@dev-bootstrap.local"));
    }

    @Test
    void resetsPasswordWhenUserExists() throws Exception {
        when(environment.getActiveProfiles()).thenReturn(new String[]{"development"});
        injectBootstrapFields("u1", "newpw", "");
        User existing = new User();
        existing.setId("id1");
        existing.setUsername("u1");
        existing.setEmail("u1@x.com");
        existing.setHashedPassword("old");
        when(userRepository.findByUsernameOrEmail("u1")).thenReturn(Optional.of(existing));
        when(passwordEncoder.encode("newpw")).thenReturn("newhash");

        runner.run(null);

        verify(userRepository).save(existing);
        assertEquals("newhash", existing.getHashedPassword());
    }

    private void injectBootstrapFields(String user, String pass, String email) throws Exception {
        var f1 = DevUserBootstrapRunner.class.getDeclaredField("bootstrapUsername");
        f1.setAccessible(true);
        f1.set(runner, user);
        var f2 = DevUserBootstrapRunner.class.getDeclaredField("bootstrapPassword");
        f2.setAccessible(true);
        f2.set(runner, pass);
        var f3 = DevUserBootstrapRunner.class.getDeclaredField("bootstrapEmail");
        f3.setAccessible(true);
        f3.set(runner, email);
    }
}

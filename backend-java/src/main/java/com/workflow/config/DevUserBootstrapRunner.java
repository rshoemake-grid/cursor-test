package com.workflow.config;

import com.workflow.entity.User;
import com.workflow.repository.UserRepository;
import com.workflow.util.EnvironmentUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.UUID;
import java.util.regex.Pattern;

/**
 * Optional dev bootstrap — mirrors Python {@code dev_user_bootstrap.apply_dev_user_bootstrap}.
 * Runs only when not production and username + password are set.
 */
@Component
public class DevUserBootstrapRunner implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DevUserBootstrapRunner.class);
    private static final Pattern SAFE_EMAIL_LOCAL = Pattern.compile("[^a-zA-Z0-9._+-]");

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final Environment environment;

    @Value("${dev.bootstrap.username:}")
    private String bootstrapUsername;

    @Value("${dev.bootstrap.password:}")
    private String bootstrapPassword;

    @Value("${dev.bootstrap.email:}")
    private String bootstrapEmail;

    public DevUserBootstrapRunner(UserRepository userRepository,
                                  PasswordEncoder passwordEncoder,
                                  Environment environment) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.environment = environment;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (EnvironmentUtils.isProduction(environment)) {
            return;
        }
        String username = bootstrapUsername == null ? "" : bootstrapUsername.trim();
        // Do not trim password — spaces/specials may be intentional; .env users should quote if needed.
        String password = bootstrapPassword == null ? "" : bootstrapPassword;
        if (username.isEmpty() || password.isEmpty()) {
            return;
        }

        User user = userRepository.findByUsernameOrEmail(username).orElse(null);

        if (user == null) {
            String email = bootstrapEmail == null || bootstrapEmail.isBlank()
                    ? defaultDevEmail(username)
                    : bootstrapEmail.trim();
            user = new User();
            user.setId(UUID.randomUUID().toString());
            user.setUsername(username);
            user.setEmail(email);
            user.setHashedPassword(passwordEncoder.encode(password));
            user.setFullName(null);
            user.setIsActive(true);
            user.setIsAdmin(false);
            user.setCreatedAt(LocalDateTime.now());
            userRepository.save(user);
            log.info("Dev bootstrap: created user {}", username);
            return;
        }

        user.setHashedPassword(passwordEncoder.encode(password));
        userRepository.save(user);
        log.info("Dev bootstrap: reset password for user {}", username);
    }

    private static String defaultDevEmail(String username) {
        String safe = SAFE_EMAIL_LOCAL.matcher(username).replaceAll("-");
        return (safe.isBlank() ? "dev" : safe) + "@dev-bootstrap.local";
    }
}

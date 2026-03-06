package com.workflow.security;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.http.HttpMethod;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {
    private static final Logger log = LoggerFactory.getLogger(SecurityConfig.class);

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ApigeeAuthenticationEntryPoint authenticationEntryPoint;
    private final ApigeeAccessDeniedHandler accessDeniedHandler;
    private final String corsOrigins;
    private final boolean corsAllowCredentials;
    private final Environment environment;

    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            ApigeeAuthenticationEntryPoint authenticationEntryPoint,
            ApigeeAccessDeniedHandler accessDeniedHandler,
            @Value("${cors.allowed-origins:*}") String corsOrigins,
            @Value("${cors.allowed-credentials:true}") boolean corsAllowCredentials,
            Environment environment) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.corsOrigins = corsOrigins;
        this.corsAllowCredentials = corsAllowCredentials;
        this.environment = environment;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        // S-H1: CSRF disabled - acceptable because we use JWT (Bearer token) in headers, not cookie-based auth.
        // No session cookies are used for authentication. If adding cookie-based auth later, re-enable CSRF.
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/health", "/metrics", "/api-docs/**", "/swagger-ui/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                // S-C2: Execution endpoints require authentication (ownership enforced in controller/service)
                .requestMatchers("/api/workflows/*/execute").authenticated()
                .requestMatchers("/api/executions/**", "/api/workflows/*/executions", "/api/users/*/executions").authenticated()
                .requestMatchers("/api/marketplace/discover", "/api/marketplace/trending", "/api/marketplace/stats").permitAll()
                .requestMatchers(HttpMethod.GET, "/api/marketplace/agents").permitAll()
                .requestMatchers("/api/templates", "/api/templates/categories", "/api/templates/difficulties", "/api/templates/*").permitAll()
                // S-C3: Debug endpoints require authentication
                .requestMatchers("/api/debug/**").authenticated()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
        
        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        List<String> origins = corsOrigins.equals("*") ?
            Arrays.asList("*") : Arrays.asList(corsOrigins.split(","));
        configuration.setAllowedOrigins(origins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(Arrays.asList("*"));

        // S-H2: Browsers reject "*" with credentials. In production, require explicit origins.
        boolean allowCreds = corsAllowCredentials;
        if (origins.contains("*") && corsAllowCredentials) {
            log.warn("S-H2: CORS origins is '*' - setting allowCredentials to false (browsers reject * with credentials)");
            allowCreds = false;
        }
        boolean isProduction = com.workflow.util.EnvironmentUtils.isProduction(environment);
        if (isProduction && origins.contains("*")) {
            throw new IllegalStateException(
                    "S-H2: In production, cors.allowed-origins must be explicit (e.g. https://yourdomain.com). " +
                    "Wildcard '*' is not allowed. Set cors.allowed-origins in application-production.properties");
        }
        configuration.setAllowCredentials(allowCreds);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }
}

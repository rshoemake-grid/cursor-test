package com.workflow.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
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
    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final ApigeeAuthenticationEntryPoint authenticationEntryPoint;
    private final ApigeeAccessDeniedHandler accessDeniedHandler;
    private final String corsOrigins;
    private final boolean corsAllowCredentials;
    
    public SecurityConfig(
            JwtAuthenticationFilter jwtAuthenticationFilter,
            ApigeeAuthenticationEntryPoint authenticationEntryPoint,
            ApigeeAccessDeniedHandler accessDeniedHandler,
            @Value("${cors.allowed-origins:*}") String corsOrigins,
            @Value("${cors.allowed-credentials:true}") boolean corsAllowCredentials) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
        this.authenticationEntryPoint = authenticationEntryPoint;
        this.accessDeniedHandler = accessDeniedHandler;
        this.corsOrigins = corsOrigins;
        this.corsAllowCredentials = corsAllowCredentials;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http.csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(authenticationEntryPoint)
                .accessDeniedHandler(accessDeniedHandler))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**", "/health", "/metrics", "/api-docs/**", "/swagger-ui/**").permitAll()
                .requestMatchers("/ws/**").permitAll()
                .requestMatchers("/api/v1/workflows/*/execute", "/api/v1/executions/**").permitAll()
                .requestMatchers("/api/v1/marketplace/discover", "/api/v1/marketplace/trending", "/api/v1/marketplace/stats").permitAll()
                .requestMatchers("/api/v1/templates", "/api/v1/templates/categories", "/api/v1/templates/difficulties", "/api/v1/templates/*").permitAll()
                .requestMatchers("/api/v1/debug/**").permitAll()
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
        configuration.setAllowCredentials(corsAllowCredentials);
        
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

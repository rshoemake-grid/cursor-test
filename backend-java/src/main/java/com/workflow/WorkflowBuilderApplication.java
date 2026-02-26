package com.workflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Main Spring Boot Application
 * Drop-in replacement for Python FastAPI backend
 */
@SpringBootApplication
@EnableJpaRepositories
@EnableAsync
public class WorkflowBuilderApplication {
    public static void main(String[] args) {
        SpringApplication.run(WorkflowBuilderApplication.class, args);
    }
}

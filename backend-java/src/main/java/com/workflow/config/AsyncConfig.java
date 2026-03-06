package com.workflow.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.AsyncConfigurer;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

/**
 * Code Review 2026 P-4: Bounded TaskExecutor for @Async workflow execution.
 * Avoids unbounded thread creation (SimpleAsyncTaskExecutor default) and provides
 * thread pool exhaustion handling via CallerRunsPolicy (backpressure).
 */
@Configuration
public class AsyncConfig implements AsyncConfigurer {

    private static final int CORE_POOL_SIZE = 4;
    private static final int MAX_POOL_SIZE = 16;
    private static final int QUEUE_CAPACITY = 100;

    @Override
    @Bean(name = "taskExecutor")
    public Executor getAsyncExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(CORE_POOL_SIZE);
        executor.setMaxPoolSize(MAX_POOL_SIZE);
        executor.setQueueCapacity(QUEUE_CAPACITY);
        executor.setThreadNamePrefix("workflow-exec-");
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}

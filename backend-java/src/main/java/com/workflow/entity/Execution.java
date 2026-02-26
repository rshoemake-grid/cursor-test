package com.workflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Execution entity - matches Python ExecutionDB model
 */
@Entity
@Table(name = "executions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Execution {
    @Id
    private String id;
    
    @Column(nullable = false)
    private String workflowId;
    
    @Column(name = "user_id")
    private String userId;
    
    @Column(nullable = false)
    private String status;
    
    @Column(nullable = false, columnDefinition = "TEXT")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> state; // Stores full execution state
    
    @Column(nullable = false)
    private LocalDateTime startedAt = LocalDateTime.now();
    
    private LocalDateTime completedAt;
}

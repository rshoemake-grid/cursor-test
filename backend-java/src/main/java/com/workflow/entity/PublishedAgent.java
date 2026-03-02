package com.workflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

/**
 * Published agent entity - matches Python PublishedAgentDB model
 */
@Entity
@Table(name = "published_agents")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PublishedAgent {
    @Id
    private String id;

    @Column(nullable = false)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String category;

    @Column(columnDefinition = "TEXT")
    @JdbcTypeCode(SqlTypes.JSON)
    private List<String> tags;

    @Column(nullable = false)
    private String difficulty = "beginner";

    @Column(name = "estimated_time")
    private String estimatedTime;

    @Column(name = "agent_config", nullable = false, columnDefinition = "TEXT")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> agentConfig;

    @Column(name = "author_id")
    private String authorId;

    @Column(name = "is_official", nullable = false)
    private Boolean isOfficial = false;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();

    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

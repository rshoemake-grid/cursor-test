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
 * WorkflowTemplate entity - matches Python WorkflowTemplateDB model
 */
@Entity
@Table(name = "workflow_templates")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowTemplate {
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
    
    @Column(nullable = false, columnDefinition = "TEXT")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> definition;
    
    @Column(name = "author_id")
    private String authorId;
    
    @Column(nullable = false)
    private Boolean isOfficial = false;
    
    @Column(nullable = false)
    private String difficulty = "beginner";
    
    private String estimatedTime;
    
    @Column(nullable = false)
    private Integer usesCount = 0;
    
    @Column(nullable = false)
    private Integer likesCount = 0;
    
    @Column(nullable = false)
    private Integer rating = 0;
    
    private String thumbnailUrl;
    
    private String previewImageUrl;
    
    @Column(nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
    
    @Column(nullable = false)
    private LocalDateTime updatedAt = LocalDateTime.now();
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

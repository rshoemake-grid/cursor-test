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
 * WorkflowVersion entity - stores versioned workflow definitions.
 */
@Entity
@Table(name = "workflow_versions")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowVersion {
    @Id
    private String id;

    @Column(name = "workflow_id", nullable = false)
    private String workflowId;

    @Column(name = "version_number", nullable = false)
    private Integer versionNumber;

    @Column(nullable = false, columnDefinition = "TEXT")
    @JdbcTypeCode(SqlTypes.JSON)
    private Map<String, Object> definition;

    @Column(name = "change_notes", columnDefinition = "TEXT")
    private String changeNotes;

    @Column(name = "created_by")
    private String createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

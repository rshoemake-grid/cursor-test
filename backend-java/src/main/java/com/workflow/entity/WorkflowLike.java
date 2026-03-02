package com.workflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * WorkflowLike entity - stores workflow like associations.
 */
@Entity
@Table(name = "workflow_likes")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowLike {
    @Id
    private String id;

    @Column(name = "workflow_id", nullable = false)
    private String workflowId;

    @Column(name = "user_id", nullable = false)
    private String userId;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

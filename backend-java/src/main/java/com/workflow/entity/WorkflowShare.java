package com.workflow.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * WorkflowShare entity - stores workflow sharing permissions.
 */
@Entity
@Table(name = "workflow_shares")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WorkflowShare {
    @Id
    private String id;

    @Column(name = "workflow_id", nullable = false)
    private String workflowId;

    @Column(name = "shared_with_user_id", nullable = false)
    private String sharedWithUserId;

    @Column(nullable = false)
    private String permission;

    @Column(name = "shared_by", nullable = false)
    private String sharedBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt = LocalDateTime.now();
}

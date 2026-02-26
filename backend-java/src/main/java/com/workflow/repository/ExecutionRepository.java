package com.workflow.repository;

import com.workflow.entity.Execution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ExecutionRepository extends JpaRepository<Execution, String> {
    List<Execution> findByWorkflowId(String workflowId);
    List<Execution> findByUserId(String userId);
    List<Execution> findByStatus(String status);
    
    @Query("SELECT e FROM Execution e WHERE e.workflowId = :workflowId AND (:status IS NULL OR e.status = :status)")
    List<Execution> findByWorkflowIdAndStatus(@Param("workflowId") String workflowId, @Param("status") String status);
    
    @Query("SELECT e FROM Execution e WHERE e.userId = :userId AND (:status IS NULL OR e.status = :status)")
    List<Execution> findByUserIdAndStatus(@Param("userId") String userId, @Param("status") String status);
}

package com.workflow.service;

import com.workflow.dto.ExecutionStatus;
import com.workflow.entity.Execution;
import com.workflow.exception.ExecutionNotFoundException;
import com.workflow.exception.ForbiddenException;
import com.workflow.repository.ExecutionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageRequest;

import java.time.LocalDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * T-2: Unit tests for ExecutionService - CRUD, logs, cancel.
 */
@ExtendWith(MockitoExtension.class)
class ExecutionServiceTest {

    @Mock
    private ExecutionRepository executionRepository;

    @InjectMocks
    private ExecutionService executionService;

    private static final String EXEC_ID = "exec-123";
    private static final String WORKFLOW_ID = "wf-456";
    private static final String USER_ID = "user-789";
    private static final String OTHER_USER_ID = "other-user";

    private Execution execution;

    @BeforeEach
    void setUp() {
        execution = new Execution();
        execution.setId(EXEC_ID);
        execution.setWorkflowId(WORKFLOW_ID);
        execution.setUserId(USER_ID);
        execution.setStatus(ExecutionStatus.RUNNING.getValue());
        execution.setStartedAt(LocalDateTime.now());
        execution.setState(Map.of(
                "current_node", "node-1",
                "logs", List.of(Map.of(
                        "timestamp", LocalDateTime.now().toString(),
                        "level", "INFO",
                        "node_id", "node-1",
                        "message", "Started"
                ))
        ));
    }

    @Test
    void getExecution_success() {
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.of(execution));

        var result = executionService.getExecution(EXEC_ID, USER_ID);

        assertNotNull(result);
        assertEquals(EXEC_ID, result.getExecutionId());
        assertEquals(WORKFLOW_ID, result.getWorkflowId());
        assertEquals(ExecutionStatus.RUNNING.getValue(), result.getStatus());
        verify(executionRepository).findById(EXEC_ID);
    }

    @Test
    void getExecution_notFound_throwsExecutionNotFoundException() {
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.empty());

        assertThrows(ExecutionNotFoundException.class, () ->
                executionService.getExecution(EXEC_ID, USER_ID));
        verify(executionRepository).findById(EXEC_ID);
    }

    @Test
    void getExecution_wrongUser_throwsForbiddenException() {
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.of(execution));

        assertThrows(ForbiddenException.class, () ->
                executionService.getExecution(EXEC_ID, OTHER_USER_ID));
        verify(executionRepository).findById(EXEC_ID);
    }

    @Test
    void listExecutions_success() {
        when(executionRepository.findWithFilters(eq(WORKFLOW_ID), eq(USER_ID), eq(null), any(PageRequest.class)))
                .thenReturn(List.of(execution));

        var result = executionService.listExecutions(WORKFLOW_ID, USER_ID, null, 50, 0);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(EXEC_ID, result.get(0).getExecutionId());
        verify(executionRepository).findWithFilters(eq(WORKFLOW_ID), eq(USER_ID), eq(null), any(PageRequest.class));
    }

    @Test
    void getRunningExecutions_success() {
        when(executionRepository.findByUserIdAndStatus(USER_ID, ExecutionStatus.RUNNING.getValue()))
                .thenReturn(List.of(execution));

        var result = executionService.getRunningExecutions(USER_ID);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals(EXEC_ID, result.get(0).getExecutionId());
        verify(executionRepository).findByUserIdAndStatus(USER_ID, ExecutionStatus.RUNNING.getValue());
    }

    @Test
    void getRunningExecutions_nullUserId_throwsIllegalArgumentException() {
        assertThrows(IllegalArgumentException.class, () ->
                executionService.getRunningExecutions(null));
        verify(executionRepository, never()).findByUserIdAndStatus(any(), any());
    }

    @Test
    void getExecutionLogs_success() {
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.of(execution));

        var result = executionService.getExecutionLogs(EXEC_ID, USER_ID, null, null, 100, 0);

        assertNotNull(result);
        assertEquals(EXEC_ID, result.getExecutionId());
        assertNotNull(result.getLogs());
        assertTrue(result.getTotal() >= 1);
        verify(executionRepository).findById(EXEC_ID);
    }

    @Test
    void getExecutionLogs_notFound_throwsExecutionNotFoundException() {
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.empty());

        assertThrows(ExecutionNotFoundException.class, () ->
                executionService.getExecutionLogs(EXEC_ID, USER_ID, null, null, 100, 0));
        verify(executionRepository).findById(EXEC_ID);
    }

    @Test
    void getExecutionLogs_wrongUser_throwsForbiddenException() {
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.of(execution));

        assertThrows(ForbiddenException.class, () ->
                executionService.getExecutionLogs(EXEC_ID, OTHER_USER_ID, null, null, 100, 0));
        verify(executionRepository).findById(EXEC_ID);
    }

    @Test
    void cancelExecution_success() {
        execution.setStatus(ExecutionStatus.RUNNING.getValue());
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.of(execution));
        when(executionRepository.save(any(Execution.class))).thenAnswer(inv -> inv.getArgument(0));

        var result = executionService.cancelExecution(EXEC_ID, USER_ID);

        assertNotNull(result);
        assertEquals(ExecutionStatus.CANCELLED.getValue(), result.getStatus());
        verify(executionRepository, atLeast(2)).findById(EXEC_ID);
        verify(executionRepository).save(any(Execution.class));
    }

    @Test
    void cancelExecution_notFound_throwsExecutionNotFoundException() {
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.empty());

        assertThrows(ExecutionNotFoundException.class, () ->
                executionService.cancelExecution(EXEC_ID, USER_ID));
        verify(executionRepository).findById(EXEC_ID);
        verify(executionRepository, never()).save(any());
    }

    @Test
    void cancelExecution_wrongUser_throwsForbiddenException() {
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.of(execution));

        assertThrows(ForbiddenException.class, () ->
                executionService.cancelExecution(EXEC_ID, OTHER_USER_ID));
        verify(executionRepository).findById(EXEC_ID);
        verify(executionRepository, never()).save(any());
    }

    @Test
    void cancelExecution_alreadyCompleted_throwsIllegalArgumentException() {
        execution.setStatus(ExecutionStatus.COMPLETED.getValue());
        when(executionRepository.findById(EXEC_ID)).thenReturn(Optional.of(execution));

        assertThrows(IllegalArgumentException.class, () ->
                executionService.cancelExecution(EXEC_ID, USER_ID));
        verify(executionRepository).findById(EXEC_ID);
        verify(executionRepository, never()).save(any());
    }
}

package com.workflow.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.workflow.dto.*;
import com.workflow.entity.Workflow;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ValidationException;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.WorkflowMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.*;

import static com.workflow.constants.WorkflowConstants.DEFAULT_VERSION;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class WorkflowServiceTest {

    @Mock
    private WorkflowRepository workflowRepository;

    private WorkflowMapper workflowMapper;  // Use real instance instead of mock
    private WorkflowService workflowService;  // Create manually instead of @InjectMocks

    private WorkflowCreate validWorkflowCreate;
    private Workflow workflowEntity;
    private WorkflowResponse workflowResponse;

    @BeforeEach
    void setUp() {
        // Use real WorkflowMapper instance (like WorkflowMapperTest)
        // This avoids Mockito mocking issues with concrete classes
        ObjectMapper objectMapper = new ObjectMapper();
        objectMapper.registerModule(new JavaTimeModule());
        workflowMapper = new WorkflowMapper(objectMapper);
        
        // Manually create service instance since @InjectMocks doesn't work with manual construction
        workflowService = new WorkflowService(workflowRepository, workflowMapper);
        
        // Setup valid WorkflowCreate
        validWorkflowCreate = new WorkflowCreate();
        validWorkflowCreate.setName("Test Workflow");
        validWorkflowCreate.setDescription("Test Description");
        validWorkflowCreate.setVersion("1.0.0");
        validWorkflowCreate.setNodes(Arrays.asList(new Node()));
        validWorkflowCreate.setEdges(Arrays.asList(new Edge()));
        validWorkflowCreate.setVariables(Map.of("key", "value"));

        // Setup Workflow entity
        workflowEntity = new Workflow();
        workflowEntity.setId("test-id");
        workflowEntity.setName("Test Workflow");
        workflowEntity.setDescription("Test Description");
        workflowEntity.setVersion("1.0.0");
        workflowEntity.setOwnerId("user-id");
        workflowEntity.setIsPublic(false);
        workflowEntity.setIsTemplate(false);
        workflowEntity.setCreatedAt(LocalDateTime.now());
        workflowEntity.setUpdatedAt(LocalDateTime.now());
        workflowEntity.setDefinition(Map.of(
            "nodes", Arrays.asList(new Node()),
            "edges", Arrays.asList(new Edge()),
            "variables", Map.of("key", "value")
        ));

        // Setup WorkflowResponse
        workflowResponse = new WorkflowResponse();
        workflowResponse.setId("test-id");
        workflowResponse.setName("Test Workflow");
        workflowResponse.setDescription("Test Description");
        workflowResponse.setVersion("1.0.0");
        workflowResponse.setNodes(Arrays.asList(new Node()));
        workflowResponse.setEdges(Arrays.asList(new Edge()));
        workflowResponse.setVariables(Map.of("key", "value"));
        workflowResponse.setCreatedAt(LocalDateTime.now());
        workflowResponse.setUpdatedAt(LocalDateTime.now());
    }

    @Test
    void createWorkflow_Success() {
        // Given
        String userId = "user-id";
        when(workflowRepository.save(any(Workflow.class))).thenAnswer(invocation -> {
            Workflow w = invocation.getArgument(0);
            w.setId("test-id");
            return w;
        });

        // When
        WorkflowResponse result = workflowService.createWorkflow(validWorkflowCreate, userId);

        // Then
        assertNotNull(result);
        assertEquals("test-id", result.getId());
        assertEquals("Test Workflow", result.getName());
        assertEquals("Test Description", result.getDescription());
        verify(workflowRepository, times(1)).save(any(Workflow.class));
    }

    @Test
    void createWorkflow_WithDefaultVersion() {
        // Given
        validWorkflowCreate.setVersion(null);
        String userId = "user-id";
        when(workflowRepository.save(any(Workflow.class))).thenAnswer(invocation -> {
            Workflow w = invocation.getArgument(0);
            w.setId("test-id");
            return w;
        });

        // When
        WorkflowResponse result = workflowService.createWorkflow(validWorkflowCreate, userId);

        // Then
        assertNotNull(result);
        assertEquals(DEFAULT_VERSION, result.getVersion());
        verify(workflowRepository, times(1)).save(argThat(w -> DEFAULT_VERSION.equals(w.getVersion())));
    }

    @Test
    void createWorkflow_NullWorkflowCreate_ThrowsValidationException() {
        // Given
        String userId = "user-id";
        
        // When/Then
        assertThrows(ValidationException.class, () -> 
            workflowService.createWorkflow(null, userId));
        verify(workflowRepository, never()).save(any());
    }

    @Test
    void createWorkflow_EmptyName_ThrowsValidationException() {
        // Given
        validWorkflowCreate.setName("");

        // When/Then
        assertThrows(ValidationException.class, () -> 
            workflowService.createWorkflow(validWorkflowCreate, "user-id"));
        verify(workflowRepository, never()).save(any());
    }

    @Test
    void createWorkflow_NullNodes_ThrowsValidationException() {
        // Given
        validWorkflowCreate.setNodes(null);

        // When/Then
        assertThrows(ValidationException.class, () -> 
            workflowService.createWorkflow(validWorkflowCreate, "user-id"));
        verify(workflowRepository, never()).save(any());
    }

    @Test
    void createWorkflow_NullEdges_ThrowsValidationException() {
        // Given
        validWorkflowCreate.setEdges(null);

        // When/Then
        assertThrows(ValidationException.class, () -> 
            workflowService.createWorkflow(validWorkflowCreate, "user-id"));
        verify(workflowRepository, never()).save(any());
    }

    @Test
    void getWorkflow_Success() {
        // Given
        String workflowId = "test-id";
        workflowEntity.setDefinition(Map.of(
            "nodes", Arrays.asList(new Node()),
            "edges", Arrays.asList(new Edge()),
            "variables", Map.of("key", "value")
        ));
        when(workflowRepository.findById(workflowId)).thenReturn(Optional.of(workflowEntity));

        // When
        WorkflowResponse result = workflowService.getWorkflow(workflowId);

        // Then
        assertNotNull(result);
        assertEquals("test-id", result.getId());
        assertEquals("Test Workflow", result.getName());
        verify(workflowRepository, times(1)).findById(workflowId);
    }

    @Test
    void getWorkflow_NotFound_ThrowsResourceNotFoundException() {
        // Given
        String workflowId = "non-existent-id";
        when(workflowRepository.findById(workflowId)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
            workflowService.getWorkflow(workflowId));
        verify(workflowRepository, times(1)).findById(workflowId);
    }

    @Test
    void listWorkflows_WithUserId() {
        // Given
        String userId = "user-id";
        workflowEntity.setDefinition(Map.of(
            "nodes", Arrays.asList(new Node()),
            "edges", Arrays.asList(new Edge()),
            "variables", Map.of()
        ));
        List<Workflow> workflows = Arrays.asList(workflowEntity);
        when(workflowRepository.findAccessibleWorkflows(userId)).thenReturn(workflows);

        // When
        List<WorkflowResponse> result = workflowService.listWorkflows(userId);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("test-id", result.get(0).getId());
        verify(workflowRepository, times(1)).findAccessibleWorkflows(userId);
        verify(workflowRepository, never()).findByIsPublicTrue();
    }

    @Test
    void listWorkflows_WithoutUserId() {
        // Given
        workflowEntity.setDefinition(Map.of(
            "nodes", Arrays.asList(new Node()),
            "edges", Arrays.asList(new Edge()),
            "variables", Map.of()
        ));
        List<Workflow> workflows = Arrays.asList(workflowEntity);
        when(workflowRepository.findByIsPublicTrue()).thenReturn(workflows);

        // When
        List<WorkflowResponse> result = workflowService.listWorkflows(null);

        // Then
        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("test-id", result.get(0).getId());
        verify(workflowRepository, times(1)).findByIsPublicTrue();
        verify(workflowRepository, never()).findAccessibleWorkflows(any());
    }

    @Test
    void updateWorkflow_Success() {
        // Given
        String workflowId = "test-id";
        workflowEntity.setDefinition(Map.of(
            "nodes", Arrays.asList(new Node()),
            "edges", Arrays.asList(new Edge()),
            "variables", Map.of()
        ));
        when(workflowRepository.findById(workflowId)).thenReturn(Optional.of(workflowEntity));
        when(workflowRepository.save(workflowEntity)).thenReturn(workflowEntity);

        // When
        WorkflowResponse result = workflowService.updateWorkflow(workflowId, validWorkflowCreate);

        // Then
        assertNotNull(result);
        assertEquals("Test Workflow", result.getName());
        assertEquals("Test Description", result.getDescription());
        verify(workflowRepository, times(1)).findById(workflowId);
        verify(workflowRepository, times(1)).save(workflowEntity);
    }

    @Test
    void updateWorkflow_NotFound_ThrowsResourceNotFoundException() {
        // Given
        String workflowId = "non-existent-id";
        when(workflowRepository.findById(workflowId)).thenReturn(Optional.empty());

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
            workflowService.updateWorkflow(workflowId, validWorkflowCreate));
        verify(workflowRepository, never()).save(any());
    }

    @Test
    void updateWorkflow_NullVersion_UsesExistingVersion() {
        // Given
        String workflowId = "test-id";
        workflowEntity.setVersion("2.0.0");
        workflowEntity.setDefinition(Map.of(
            "nodes", Arrays.asList(new Node()),
            "edges", Arrays.asList(new Edge()),
            "variables", Map.of()
        ));
        validWorkflowCreate.setVersion(null);
        when(workflowRepository.findById(workflowId)).thenReturn(Optional.of(workflowEntity));
        when(workflowRepository.save(workflowEntity)).thenReturn(workflowEntity);

        // When
        WorkflowResponse result = workflowService.updateWorkflow(workflowId, validWorkflowCreate);

        // Then
        assertNotNull(result);
        assertEquals("2.0.0", result.getVersion());
    }

    @Test
    void deleteWorkflow_Success() {
        // Given
        String workflowId = "test-id";
        when(workflowRepository.existsById(workflowId)).thenReturn(true);

        // When
        workflowService.deleteWorkflow(workflowId);

        // Then
        verify(workflowRepository, times(1)).existsById(workflowId);
        verify(workflowRepository, times(1)).deleteById(workflowId);
    }

    @Test
    void deleteWorkflow_NotFound_ThrowsResourceNotFoundException() {
        // Given
        String workflowId = "non-existent-id";
        when(workflowRepository.existsById(workflowId)).thenReturn(false);

        // When/Then
        assertThrows(ResourceNotFoundException.class, () -> 
            workflowService.deleteWorkflow(workflowId));
        verify(workflowRepository, never()).deleteById(any());
    }
}

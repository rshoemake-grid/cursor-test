package com.workflow.service;

import com.workflow.dto.WorkflowTemplateCreate;
import com.workflow.dto.WorkflowTemplateResponse;
import com.workflow.entity.User;
import com.workflow.entity.Workflow;
import com.workflow.entity.WorkflowTemplate;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.exception.ForbiddenException;
import com.workflow.repository.UserRepository;
import com.workflow.repository.WorkflowRepository;
import com.workflow.repository.WorkflowTemplateRepository;
import com.workflow.util.WorkflowMapper;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Template service - matches Python template_routes
 */
@Service
@Transactional
public class TemplateService {
    private static final List<String> CATEGORIES = List.of("automation", "data-processing", "content", "analytics", "custom");
    private static final List<String> DIFFICULTIES = List.of("beginner", "intermediate", "advanced");

    private final WorkflowTemplateRepository templateRepository;
    private final WorkflowRepository workflowRepository;
    private final UserRepository userRepository;
    private final WorkflowMapper workflowMapper;

    public TemplateService(WorkflowTemplateRepository templateRepository,
                           WorkflowRepository workflowRepository,
                           UserRepository userRepository,
                           WorkflowMapper workflowMapper) {
        this.templateRepository = templateRepository;
        this.workflowRepository = workflowRepository;
        this.userRepository = userRepository;
        this.workflowMapper = workflowMapper;
    }

    public WorkflowTemplateResponse createTemplate(WorkflowTemplateCreate create, String userId, boolean isAdmin) {
        WorkflowTemplate t = new WorkflowTemplate();
        t.setId(UUID.randomUUID().toString());
        t.setName(create.getName());
        t.setDescription(create.getDescription());
        t.setCategory(create.getCategory());
        t.setTags(create.getTags());
        t.setDefinition(create.getDefinition());
        t.setAuthorId(userId);
        t.setIsOfficial(Boolean.TRUE.equals(create.getIsOfficial()) && isAdmin);
        t.setDifficulty(create.getDifficulty() != null ? create.getDifficulty() : "beginner");
        t.setEstimatedTime(create.getEstimatedTime());
        t = templateRepository.save(t);
        return toResponse(t, userRepository.findById(userId).map(User::getUsername).orElse(null));
    }

    public List<WorkflowTemplateResponse> listTemplates(String category, String difficulty, String search,
                                                        String sortBy, int limit, int offset) {
        var sort = "recent".equals(sortBy) ? Sort.by(Sort.Direction.DESC, "createdAt")
                : "rating".equals(sortBy) ? Sort.by(Sort.Direction.DESC, "rating")
                : Sort.by(Sort.Direction.DESC, "usesCount");
        var pageable = PageRequest.of(offset / limit, limit, sort);
        List<WorkflowTemplate> templates = templateRepository.findWithFilters(category, difficulty, pageable);
        return templates.stream()
                .filter(t -> search == null || search.isBlank() ||
                        (t.getName() != null && t.getName().toLowerCase().contains(search.toLowerCase())) ||
                        (t.getDescription() != null && t.getDescription().toLowerCase().contains(search.toLowerCase())))
                .map(t -> toResponse(t, userRepository.findById(t.getAuthorId()).map(User::getUsername).orElse(null)))
                .collect(Collectors.toList());
    }

    public List<String> getCategories() {
        return CATEGORIES;
    }

    public List<String> getDifficulties() {
        return DIFFICULTIES;
    }

    public WorkflowTemplateResponse getTemplate(String templateId) {
        WorkflowTemplate t = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        return toResponse(t, userRepository.findById(t.getAuthorId()).map(User::getUsername).orElse(null));
    }

    @Transactional
    public com.workflow.dto.WorkflowResponse useTemplate(String templateId, String name, String description, String userId) {
        WorkflowTemplate t = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        t.setUsesCount((t.getUsesCount() != null ? t.getUsesCount() : 0) + 1);
        templateRepository.save(t);

        Workflow w = new Workflow();
        w.setId(UUID.randomUUID().toString());
        w.setName(name != null ? name : t.getName() + " (from template)");
        w.setDescription(description != null ? description : t.getDescription());
        w.setVersion("1.0.0");
        w.setDefinition(t.getDefinition());
        w.setOwnerId(userId);
        w.setIsPublic(false);
        w.setIsTemplate(false);
        w.setCategory(t.getCategory());
        w.setTags(t.getTags());
        w = workflowRepository.save(w);

        com.workflow.dto.WorkflowResponse resp = new com.workflow.dto.WorkflowResponse();
        resp.setId(w.getId());
        resp.setName(w.getName());
        resp.setDescription(w.getDescription());
        resp.setVersion(w.getVersion());
        resp.setNodes(workflowMapper.extractNodes(w.getDefinition()));
        resp.setEdges(workflowMapper.extractEdges(w.getDefinition()));
        resp.setVariables(workflowMapper.extractVariables(w.getDefinition()));
        resp.setCreatedAt(w.getCreatedAt());
        resp.setUpdatedAt(w.getUpdatedAt());
        return resp;
    }

    public void deleteTemplate(String templateId, String userId, boolean isAdmin) {
        WorkflowTemplate t = templateRepository.findById(templateId)
                .orElseThrow(() -> new ResourceNotFoundException("Template not found"));
        if (!t.getAuthorId().equals(userId) && !isAdmin) {
            throw new ForbiddenException("Not authorized to delete this template");
        }
        templateRepository.delete(t);
    }

    private WorkflowTemplateResponse toResponse(WorkflowTemplate t, String authorName) {
        return new WorkflowTemplateResponse(
                t.getId(), t.getName(), t.getDescription(), t.getCategory(), t.getTags(),
                t.getDifficulty(), t.getEstimatedTime(), t.getIsOfficial(),
                t.getUsesCount(), t.getLikesCount(), t.getRating(),
                t.getAuthorId(), authorName, t.getThumbnailUrl(), t.getPreviewImageUrl(),
                t.getCreatedAt(), t.getUpdatedAt());
    }
}

package com.workflow.controller;

import com.workflow.dto.WorkflowResponse;
import com.workflow.dto.WorkflowTemplateCreate;
import jakarta.validation.Valid;
import com.workflow.dto.WorkflowTemplateResponse;
import com.workflow.service.TemplateQueryService;
import com.workflow.service.TemplateService;
import com.workflow.util.AuthenticationHelper;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Template Controller - matches Python template_routes.py
 */
@RestController
@RequestMapping("/api/templates")
@Tag(name = "Templates", description = "Workflow templates")
public class TemplateController {
    private final TemplateService templateService;
    private final TemplateQueryService templateQueryService;
    private final AuthenticationHelper authenticationHelper;

    public TemplateController(TemplateService templateService, TemplateQueryService templateQueryService,
                              AuthenticationHelper authenticationHelper) {
        this.templateService = templateService;
        this.templateQueryService = templateQueryService;
        this.authenticationHelper = authenticationHelper;
    }

    @PostMapping
    @Operation(summary = "Create Template")
    public ResponseEntity<WorkflowTemplateResponse> create(@Valid @RequestBody WorkflowTemplateCreate create, Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        boolean isAdmin = authenticationHelper.extractIsAdmin(authentication);
        return ResponseEntity.status(201).body(templateService.createTemplate(create, userId, isAdmin));
    }

    @GetMapping
    @Operation(summary = "List Templates")
    public ResponseEntity<List<WorkflowTemplateResponse>> list(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "popular") String sortBy,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0") int offset) {
        return ResponseEntity.ok(templateQueryService.listTemplates(category, difficulty, search, sortBy, limit, offset));
    }

    @GetMapping("/categories")
    @Operation(summary = "List Categories")
    public ResponseEntity<List<String>> categories() {
        return ResponseEntity.ok(templateQueryService.getCategories());
    }

    @GetMapping("/difficulties")
    @Operation(summary = "List Difficulties")
    public ResponseEntity<List<String>> difficulties() {
        return ResponseEntity.ok(templateQueryService.getDifficulties());
    }

    @GetMapping("/{templateId}")
    @Operation(summary = "Get Template")
    public ResponseEntity<WorkflowTemplateResponse> get(@PathVariable String templateId) {
        return ResponseEntity.ok(templateQueryService.getTemplate(templateId));
    }

    @PostMapping("/{templateId}/use")
    @Operation(summary = "Use Template")
    public ResponseEntity<WorkflowResponse> use(
            @PathVariable String templateId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String description,
            Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        return ResponseEntity.status(201).body(templateService.useTemplate(templateId, name, description, userId));
    }

    @DeleteMapping("/{templateId}")
    @Operation(summary = "Delete Template")
    public ResponseEntity<Void> delete(@PathVariable String templateId, Authentication authentication) {
        String userId = authenticationHelper.extractUserIdRequired(authentication);
        boolean isAdmin = authenticationHelper.extractIsAdmin(authentication);
        templateService.deleteTemplate(templateId, userId, isAdmin);
        return ResponseEntity.noContent().build();
    }
}

package com.workflow.service;

import com.workflow.entity.WorkflowTemplate;
import com.workflow.exception.ResourceNotFoundException;
import com.workflow.util.ErrorMessages;
import com.workflow.util.OwnershipUtils;
import org.springframework.stereotype.Service;

import java.util.Objects;

/**
 * DRY-4: Centralized template ownership checks.
 * Author or admin can delete templates.
 */
@Service
public class TemplateOwnershipService {

    /**
     * Assert that the user can delete the template (author or admin).
     *
     * @param template the template
     * @param userId  the requesting user id
     * @param isAdmin whether the user has admin role
     * @throws ResourceNotFoundException if template is null
     * @throws ForbiddenException        if user is neither author nor admin
     */
    public void assertCanDelete(WorkflowTemplate template, String userId, boolean isAdmin) {
        if (template == null) {
            throw new ResourceNotFoundException(ErrorMessages.TEMPLATE_NOT_FOUND);
        }
        boolean canDelete = Objects.equals(template.getAuthorId(), userId) || isAdmin;
        OwnershipUtils.require(canDelete, ErrorMessages.NOT_AUTHORIZED_DELETE_TEMPLATE);
    }
}

package com.workflow.service;

import com.workflow.dto.Edge;
import com.workflow.dto.Node;
import com.workflow.entity.Workflow;
import com.workflow.repository.WorkflowRepository;
import com.workflow.util.ErrorMessages;
import com.workflow.util.ObjectUtils;
import com.workflow.util.RepositoryUtils;
import com.workflow.util.WorkflowMapper;
import org.springframework.stereotype.Service;

import java.util.*;

/**
 * SRP-1: Workflow validation logic extracted from DebugController.
 */
@Service
public class WorkflowValidationService {
    private final WorkflowRepository workflowRepository;
    private final WorkflowMapper workflowMapper;

    public WorkflowValidationService(WorkflowRepository workflowRepository, WorkflowMapper workflowMapper) {
        this.workflowRepository = workflowRepository;
        this.workflowMapper = workflowMapper;
    }

    public Map<String, Object> validate(String workflowId) {
        Workflow w = RepositoryUtils.findByIdOrThrow(workflowRepository, workflowId, ErrorMessages.WORKFLOW_NOT_FOUND);
        Map<String, Object> def = w.getDefinition();
        List<Node> nodes = workflowMapper.extractNodes(def);
        List<Edge> edges = workflowMapper.extractEdges(def);

        List<Map<String, Object>> issues = new ArrayList<>();
        List<Map<String, Object>> warnings = new ArrayList<>();

        Set<String> nodeIds = new HashSet<>();
        Set<String> connected = new HashSet<>();
        for (Node n : nodes) {
            if (n.getId() != null) nodeIds.add(n.getId());
        }
        for (Edge e : edges) {
            if (e.getSource() != null) connected.add(e.getSource());
            if (e.getTarget() != null) connected.add(e.getTarget());
        }
        Set<String> orphans = new HashSet<>(nodeIds);
        orphans.removeAll(connected);
        if (!orphans.isEmpty()) {
            warnings.add(Map.of("type", "orphan_nodes", "message", "Found " + orphans.size() + " disconnected nodes", "nodes", orphans));
        }

        List<String> types = nodes.stream()
                .map(n -> ObjectUtils.safeGet(n.getType(), com.workflow.dto.NodeType::getValue))
                .filter(Objects::nonNull)
                .toList();
        if (!types.contains("start")) {
            issues.add(Map.of("type", "missing_start", "message", "Workflow has no START node", "severity", "error"));
        }
        if (!types.contains("end")) {
            warnings.add(Map.of("type", "missing_end", "message", "Workflow has no END node", "severity", "warning"));
        }

        Map<String, Object> result = new HashMap<>();
        result.put("workflow_id", workflowId);
        result.put("valid", issues.isEmpty());
        result.put("issues", issues);
        result.put("warnings", warnings);
        result.put("node_count", nodes.size());
        result.put("edge_count", edges.size());
        return result;
    }
}

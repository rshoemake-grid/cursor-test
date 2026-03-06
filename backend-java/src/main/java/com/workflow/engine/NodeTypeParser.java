package com.workflow.engine;

import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * OCP-3: Parses NodeType from node data when type is not set on the node.
 * Extracts type from node.getData() map or returns TOOL as default.
 */
@Component
public class NodeTypeParser {

    /**
     * Parse NodeType from node. Uses node.getType() if set, otherwise extracts from node.getData().
     *
     * @param node the node
     * @return the parsed NodeType, or TOOL as default
     */
    public NodeType parseNodeType(Node node) {
        if (node.getType() != null) {
            return node.getType();
        }
        if (node.getData() instanceof Map) {
            Object t = ((Map<?, ?>) node.getData()).get("type");
            if (t != null) {
                try {
                    return NodeType.valueOf(String.valueOf(t).toUpperCase().replace("-", "_"));
                } catch (IllegalArgumentException ignored) {
                    // fall through to default
                }
            }
        }
        return NodeType.TOOL;
    }
}

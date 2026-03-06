package com.workflow.engine;

import com.workflow.dto.Node;

import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;
import java.util.Map;

/**
 * Executes LOOP nodes - extracts items and returns last item.
 */
@Component
public class LoopNodeExecutor implements NodeExecutor {

    @Override
    public Object execute(Node node, Map<String, Object> inputs, ExecutionState state,
                          NodeExecutionContext ctx) {
        Object itemsObj = InputResolver.getFirstOf(inputs, "items", "data", "lines", "output");

        List<?> items = Collections.emptyList();
        if (itemsObj instanceof List) {
            items = (List<?>) itemsObj;
        } else if (itemsObj != null) {
            items = List.of(itemsObj);
        }

        if (items.isEmpty()) {
            return null;
        }
        return items.get(items.size() - 1);
    }
}

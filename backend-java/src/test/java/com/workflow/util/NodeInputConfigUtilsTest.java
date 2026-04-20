package com.workflow.util;

import com.workflow.dto.Node;
import com.workflow.dto.NodeType;
import org.junit.jupiter.api.Test;

import java.util.LinkedHashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;

class NodeInputConfigUtilsTest {

    @Test
    void mergesDataInputConfigWithTopLevelSnakeCaseStylePayload() {
        Node n = new Node();
        n.setId("n1");
        n.setType(NodeType.GCP_BUCKET);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("input_config", Map.of("bucket_name", "sysco-smarter-catalog-ce-batch-job-dev", "mode", "read"));
        n.setData(data);
        n.setInputConfig(null);
        Map<String, Object> merged = NodeInputConfigUtils.getMergedInputConfig(n);
        assertEquals("sysco-smarter-catalog-ce-batch-job-dev", merged.get("bucket_name"));
        assertEquals("read", merged.get("mode"));
    }

    @Test
    void topLevelInputConfigDeserializedFromJsonWinsOverEmptyData() {
        Node n = new Node();
        n.setId("n1");
        n.setType(NodeType.GCP_BUCKET);
        n.setData(new LinkedHashMap<>());
        n.setInputConfig(Map.of("bucket_name", "top-bucket", "object_path", "a.txt"));
        Map<String, Object> merged = NodeInputConfigUtils.getMergedInputConfig(n);
        assertEquals("top-bucket", merged.get("bucket_name"));
        assertEquals("a.txt", merged.get("object_path"));
    }

    @Test
    void nonBlankTopLevelOverridesDataForSameKey() {
        Node n = new Node();
        n.setId("n1");
        n.setType(NodeType.GCP_BUCKET);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("input_config", Map.of("bucket_name", "old", "mode", "read"));
        n.setData(data);
        n.setInputConfig(Map.of("bucket_name", "new-bucket"));
        Map<String, Object> merged = NodeInputConfigUtils.getMergedInputConfig(n);
        assertEquals("new-bucket", merged.get("bucket_name"));
    }
}

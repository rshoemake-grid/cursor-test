package com.workflow.storage;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class GcpPubSubIdsTest {

    @Test
    void stripsProjectsPrefixAndTopicSuffix() {
        assertEquals("my-proj", GcpPubSubIds.normalizeProjectId("projects/my-proj/topics/t1"));
    }

    @Test
    void keepsPlainProjectId() {
        assertEquals("my-proj", GcpPubSubIds.normalizeProjectId("my-proj"));
    }

    @Test
    void handlesProjectsPrefixOnly() {
        assertEquals("p", GcpPubSubIds.normalizeProjectId("projects/p"));
    }
}

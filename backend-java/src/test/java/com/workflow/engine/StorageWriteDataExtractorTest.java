package com.workflow.engine;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

class StorageWriteDataExtractorTest {

    @Test
    void extractsDataKeyWhenWrappedWithSource() {
        Object out = StorageWriteDataExtractor.extract(Map.of("data", "hello", "source", "s3"));
        assertEquals("hello", out);
    }

    @Test
    void returnsNullWhenEmpty() {
        assertNull(StorageWriteDataExtractor.extract(Map.of()));
        assertNull(StorageWriteDataExtractor.extract(Map.of("data", "")));
    }
}

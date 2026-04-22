package com.workflow.engine;

import com.google.adk.events.Event;
import com.google.genai.types.Content;
import com.google.genai.types.Part;

import java.util.ArrayList;
import java.util.List;

/**
 * Collects assistant (model-role) text from an ADK {@link Event} stream — mirrors Python
 * {@code extract_assistant_text_from_adk_events}.
 */
public final class AdkEventTextExtractor {

    private AdkEventTextExtractor() {}

    public static String extractAssistantText(List<Event> events) {
        if (events == null || events.isEmpty()) {
            return "";
        }
        List<String> chunks = new ArrayList<>();
        for (Event ev : events) {
            if (ev.content().isEmpty()) {
                continue;
            }
            Content c = ev.content().get();
            if (c.role().isPresent() && !"model".equals(c.role().get())) {
                continue;
            }
            if (c.parts().isEmpty()) {
                continue;
            }
            for (Part p : c.parts().get()) {
                p.text().ifPresent(chunks::add);
            }
        }
        return String.join("\n", chunks).trim();
    }
}

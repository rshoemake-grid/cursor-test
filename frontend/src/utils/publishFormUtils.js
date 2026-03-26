/**
 * Publish form utilities
 * DRY: Shared logic for publish forms across WorkflowList, MarketplaceDialog, PublishModal
 */ /**
 * Parse comma-separated tags string into trimmed non-empty array
 */ export function parseTags(tags) {
    return tags.split(',').map((t)=>t.trim()).filter(Boolean);
}
/**
 * Default values for publish forms
 */ export function getDefaultPublishForm() {
    return {
        category: 'automation',
        tags: '',
        difficulty: 'beginner',
        estimated_time: ''
    };
}

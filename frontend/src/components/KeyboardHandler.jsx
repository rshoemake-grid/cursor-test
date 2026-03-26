/**
 * Keyboard Handler Component
 * Handles keyboard shortcuts for workflow operations
 * Must be rendered inside ReactFlowProvider
 */ // Domain-based imports - Phase 7
import { useKeyboardShortcuts } from '../hooks/ui';
export function KeyboardHandler({ selectedNodeId, setSelectedNodeId, notifyModified, clipboardNode, onCopy, onCut, onPaste }) {
    useKeyboardShortcuts({
        selectedNodeId,
        setSelectedNodeId,
        notifyModified,
        clipboardNode,
        onCopy,
        onCut,
        onPaste
    });
    return null;
}

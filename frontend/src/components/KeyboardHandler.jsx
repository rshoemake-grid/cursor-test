import { useKeyboardShortcuts } from "../hooks/ui";
function KeyboardHandler({
  selectedNodeId,
  setSelectedNodeId,
  notifyModified,
  clipboardNode,
  onCopy,
  onCut,
  onPaste
}) {
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
export {
  KeyboardHandler
};

import PropTypes from "prop-types";
import { nullableString } from "../utils/propTypes";
import { useKeyboardShortcuts } from "../hooks/ui";
function KeyboardHandler({ selection, keyboard }) {
  const { selectedNodeId, setSelectedNodeId, notifyModified } = selection;
  const { clipboardHasContent, onCopy, onCut, onPaste } = keyboard;
  useKeyboardShortcuts({
    selectedNodeId,
    setSelectedNodeId,
    notifyModified,
    clipboardHasContent,
    onCopy,
    onCut,
    onPaste,
  });
  return null;
}

KeyboardHandler.propTypes = {
  selection: PropTypes.shape({
    selectedNodeId: nullableString,
    setSelectedNodeId: PropTypes.func,
    notifyModified: PropTypes.func,
  }).isRequired,
  keyboard: PropTypes.shape({
    clipboardHasContent: PropTypes.bool,
    onCopy: PropTypes.func,
    onCut: PropTypes.func,
    onPaste: PropTypes.func,
  }).isRequired,
};

export { KeyboardHandler };

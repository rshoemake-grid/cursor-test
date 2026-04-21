import { render } from "@testing-library/react";
import { KeyboardHandler } from "./KeyboardHandler";
import { useKeyboardShortcuts } from "../hooks/ui";
jest.mock("../hooks/ui", () => ({
  useKeyboardShortcuts: jest.fn(),
  useClipboard: jest.fn(),
  useContextMenu: jest.fn(),
  useCanvasEvents: jest.fn(),
}));
const mockUseKeyboardShortcuts = useKeyboardShortcuts;
describe("KeyboardHandler", () => {
  const mockProps = {
    selection: {
      selectedNodeId: "node-1",
      setSelectedNodeId: jest.fn(),
      notifyModified: jest.fn(),
    },
    keyboard: {
      clipboardHasContent: false,
      onCopy: jest.fn(),
      onCut: jest.fn(),
      onPaste: jest.fn(),
    },
  };
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseKeyboardShortcuts.mockReturnValue(void 0);
  });
  it("should render without crashing", () => {
    const { container } = render(<KeyboardHandler {...mockProps} />);
    expect(container.firstChild).toBeNull();
  });
  it("should call useKeyboardShortcuts with correct props", () => {
    render(<KeyboardHandler {...mockProps} />);
    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith({
      selectedNodeId: mockProps.selection.selectedNodeId,
      setSelectedNodeId: mockProps.selection.setSelectedNodeId,
      notifyModified: mockProps.selection.notifyModified,
      clipboardHasContent: mockProps.keyboard.clipboardHasContent,
      onCopy: mockProps.keyboard.onCopy,
      onCut: mockProps.keyboard.onCut,
      onPaste: mockProps.keyboard.onPaste,
    });
  });
  it("should pass clipboardHasContent to hook", () => {
    render(
      <KeyboardHandler
        {...mockProps}
        keyboard={{ ...mockProps.keyboard, clipboardHasContent: true }}
      />,
    );
    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith(
      expect.objectContaining({
        clipboardHasContent: true,
      }),
    );
  });
  it("should handle null selectedNodeId", () => {
    render(
      <KeyboardHandler
        {...mockProps}
        selection={{ ...mockProps.selection, selectedNodeId: null }}
      />,
    );
    expect(mockUseKeyboardShortcuts).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedNodeId: null,
      }),
    );
  });
});

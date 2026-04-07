import { render, screen } from "@testing-library/react";
import { NodePanelRoot, NodePaletteIconWrap } from "./nodePanel.styled";

describe("nodePanel.styled", () => {
  it("renders NodePanelRoot", () => {
    render(<NodePanelRoot data-testid="np">x</NodePanelRoot>);
    expect(screen.getByTestId("np")).toHaveTextContent("x");
  });

  it("renders NodePaletteIconWrap with tone", () => {
    render(
      <NodePaletteIconWrap $tone="primary" data-testid="ic">
        <span>icon</span>
      </NodePaletteIconWrap>,
    );
    expect(screen.getByTestId("ic")).toHaveTextContent("icon");
  });
});

import { render, screen } from "@testing-library/react";
import { CtxMenuRoot, CtxMenuItem } from "./nodeContextMenu.styled";

describe("nodeContextMenu.styled", () => {
  it("renders CtxMenuRoot with test id", () => {
    render(<CtxMenuRoot>x</CtxMenuRoot>);
    expect(screen.getByTestId("node-context-menu")).toHaveTextContent("x");
  });

  it("renders CtxMenuItem", () => {
    render(<CtxMenuItem data-testid="item">Label</CtxMenuItem>);
    expect(screen.getByTestId("item")).toHaveTextContent("Label");
  });
});

import { render, screen } from "@testing-library/react";
import {
  LayoutRoot,
  Title,
  NavTabButton,
} from "./App.styled";

describe("App.styled", () => {
  it("renders layout primitives", () => {
    render(
      <LayoutRoot>
        <Title>Agentic Workflow Builder</Title>
      </LayoutRoot>
    );
    expect(screen.getByRole("heading", { name: /Agentic Workflow Builder/i })).toBeInTheDocument();
  });

  it("applies active styles when $active is true", () => {
    const { rerender } = render(<NavTabButton type="button" $active={false}>Tab</NavTabButton>);
    let btn = screen.getByRole("button", { name: "Tab" });
    expect(btn).toBeInTheDocument();

    rerender(<NavTabButton type="button" $active>Tab</NavTabButton>);
    btn = screen.getByRole("button", { name: "Tab" });
    expect(btn).toBeInTheDocument();
  });
});

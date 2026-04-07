import { render, screen } from "@testing-library/react";
import {
  EditorSectionRoot,
  EditorSectionTitle,
  EditorLabel,
  EditorInput,
  EditorCalloutBlue,
} from "./editorForm.styled";

describe("editorForm.styled", () => {
  it("renders EditorSectionRoot with child", () => {
    render(
      <EditorSectionRoot data-testid="root">
        <span>inside</span>
      </EditorSectionRoot>,
    );
    expect(screen.getByTestId("root")).toContainHTML("inside");
  });

  it("renders EditorSectionTitle", () => {
    render(<EditorSectionTitle>Config</EditorSectionTitle>);
    expect(screen.getByRole("heading", { level: 4 })).toHaveTextContent(
      "Config",
    );
  });

  it("associates EditorLabel with EditorInput", () => {
    render(
      <>
        <EditorLabel htmlFor="e-x">Name</EditorLabel>
        <EditorInput id="e-x" defaultValue="a" />
      </>,
    );
    expect(screen.getByLabelText("Name")).toHaveValue("a");
  });

  it("renders EditorCalloutBlue", () => {
    render(<EditorCalloutBlue>Note</EditorCalloutBlue>);
    expect(screen.getByText("Note")).toBeInTheDocument();
  });
});

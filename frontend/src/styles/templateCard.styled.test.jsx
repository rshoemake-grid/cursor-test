import { render, screen } from "@testing-library/react";
import {
  TemplateGridLayout,
  TemplateCardRoot,
  TemplateCardFooterHint,
} from "./templateCard.styled";

describe("templateCard.styled", () => {
  it("renders TemplateGridLayout", () => {
    render(
      <TemplateGridLayout data-testid="grid">
        <div>cell</div>
      </TemplateGridLayout>,
    );
    expect(screen.getByTestId("grid")).toContainHTML("cell");
  });

  it("renders TemplateCardFooterHint selected state", () => {
    render(
      <TemplateCardFooterHint $selected={true}>Picked</TemplateCardFooterHint>,
    );
    expect(screen.getByText("Picked")).toBeInTheDocument();
  });

  it("TemplateCardRoot is marked for marketplace background-click detection", () => {
    render(
      <TemplateCardRoot data-testid="root" $selected={false}>
        x
      </TemplateCardRoot>,
    );
    expect(screen.getByTestId("root")).toHaveAttribute(
      "data-marketplace-card",
      "true",
    );
  });
});

import { render, screen } from "@testing-library/react";
import { TemplateFiltersBar, TemplateSearchInput } from "./templateFilters.styled";

describe("templateFilters.styled", () => {
  it("renders TemplateFiltersBar", () => {
    render(
      <TemplateFiltersBar data-testid="bar">
        <span>inside</span>
      </TemplateFiltersBar>,
    );
    expect(screen.getByTestId("bar")).toContainHTML("inside");
  });

  it("renders TemplateSearchInput", () => {
    render(<TemplateSearchInput aria-label="Search" />);
    expect(screen.getByLabelText("Search")).toBeInTheDocument();
  });
});

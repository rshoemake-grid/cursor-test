import { render, screen } from "@testing-library/react";
import {
  PaginationRoot,
  SearchBarRoot,
  ToastRoot,
} from "./uiComponents.styled";

describe("uiComponents.styled", () => {
  it("renders PaginationRoot", () => {
    render(
      <PaginationRoot data-testid="pg">
        <span>nav</span>
      </PaginationRoot>,
    );
    expect(screen.getByTestId("pg")).toContainHTML("nav");
  });

  it("renders SearchBarRoot", () => {
    render(
      <SearchBarRoot data-testid="sb">
        <input aria-label="q" />
      </SearchBarRoot>,
    );
    expect(screen.getByLabelText("q")).toBeInTheDocument();
  });

  it("renders ToastRoot with type", () => {
    render(
      <ToastRoot $type="info" role="alert" data-testid="t">
        hello
      </ToastRoot>,
    );
    expect(screen.getByTestId("t")).toHaveTextContent("hello");
  });
});

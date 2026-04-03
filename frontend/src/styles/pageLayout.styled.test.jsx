import { render, screen } from "@testing-library/react";
import {
  PageShellColumn,
  PageTitle,
  CenteredScreenPanel,
} from "./pageLayout.styled";

describe("pageLayout.styled", () => {
  it("renders PageShellColumn with child", () => {
    render(
      <PageShellColumn data-testid="shell">
        <span>inside</span>
      </PageShellColumn>,
    );
    expect(screen.getByTestId("shell")).toContainHTML("inside");
  });

  it("renders PageTitle text", () => {
    render(<PageTitle>Hello</PageTitle>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Hello",
    );
  });

  it("renders CenteredScreenPanel", () => {
    render(
      <CenteredScreenPanel data-testid="center">
        <div>content</div>
      </CenteredScreenPanel>,
    );
    expect(screen.getByTestId("center")).toContainHTML("content");
  });
});

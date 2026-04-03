import { render, screen } from "@testing-library/react";
import {
  ErrorFallbackShell,
  ErrorCard,
  ErrorHeading,
} from "./ErrorBoundary.styled";

describe("ErrorBoundary.styled", () => {
  it("renders shell and card with heading", () => {
    render(
      <ErrorFallbackShell data-testid="shell">
        <ErrorCard>
          <ErrorHeading>Title</ErrorHeading>
        </ErrorCard>
      </ErrorFallbackShell>,
    );
    expect(screen.getByTestId("shell")).toContainHTML("Title");
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Title",
    );
  });
});

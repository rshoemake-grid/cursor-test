import { render, screen } from "@testing-library/react";
import { PublishModalOverlay, PublishModalTitle } from "./publishModal.styled";

describe("publishModal.styled", () => {
  it("renders overlay and title", () => {
    render(
      <PublishModalOverlay data-testid="ov">
        <PublishModalTitle>Publish</PublishModalTitle>
      </PublishModalOverlay>,
    );
    expect(screen.getByTestId("ov")).toHaveTextContent("Publish");
  });
});

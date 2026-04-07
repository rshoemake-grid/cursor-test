import { render, screen } from "@testing-library/react";
import {
  EmptyStateCentered,
  EmptyStateParagraph,
  PanelEmptyCard,
  ConsoleEmptyState,
  MarketplaceLoadingSpinner,
} from "./contentBlocks.styled";

describe("contentBlocks.styled", () => {
  it("renders EmptyStateCentered with paragraph", () => {
    render(
      <EmptyStateCentered data-testid="empty">
        <EmptyStateParagraph>Nothing here</EmptyStateParagraph>
      </EmptyStateCentered>,
    );
    expect(screen.getByTestId("empty")).toContainHTML("Nothing here");
  });

  it("renders PanelEmptyCard", () => {
    render(
      <PanelEmptyCard data-testid="panel">
        <span>empty panel</span>
      </PanelEmptyCard>,
    );
    expect(screen.getByTestId("panel")).toContainHTML("empty panel");
  });

  it("renders ConsoleEmptyState", () => {
    render(<ConsoleEmptyState>Message</ConsoleEmptyState>);
    expect(screen.getByText("Message")).toBeInTheDocument();
  });

  it("renders MarketplaceLoadingSpinner", () => {
    const { container } = render(<MarketplaceLoadingSpinner data-testid="spin" />);
    expect(container.querySelector('[data-testid="spin"]')).toBeInTheDocument();
  });
});

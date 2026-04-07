import { render, screen } from "@testing-library/react";
import { MpTabButton, MpActionBtnPrimary } from "./marketplaceComponents.styled";

describe("marketplaceComponents.styled", () => {
  it("renders MpTabButton with data-active", () => {
    render(
      <MpTabButton $active={true} data-testid="tab">
        Tab
      </MpTabButton>,
    );
    expect(screen.getByTestId("tab")).toHaveAttribute("data-active", "true");
  });

  it("renders MpActionBtnPrimary", () => {
    render(<MpActionBtnPrimary data-testid="btn">Go</MpActionBtnPrimary>);
    expect(screen.getByTestId("btn")).toHaveTextContent("Go");
  });
});

import { render, screen } from "@testing-library/react";
import { MPDBackdrop, MPDTabBtn } from "./marketplaceDialog.styled";

describe("marketplaceDialog.styled", () => {
  it("renders backdrop with test id", () => {
    render(<MPDBackdrop />);
    expect(screen.getByTestId("marketplace-dialog-backdrop")).toBeInTheDocument();
  });

  it("renders tab with data-active", () => {
    render(
      <MPDTabBtn $active={true} data-testid="tab">
        A
      </MPDTabBtn>,
    );
    expect(screen.getByTestId("tab")).toHaveAttribute("data-active", "true");
  });
});

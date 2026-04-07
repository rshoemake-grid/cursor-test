import { render, screen } from "@testing-library/react";
import { AutoSyncIndicator } from "./AutoSyncIndicator";
describe("AutoSyncIndicator", () => {
  it("should render auto-sync indicator", () => {
    render(<AutoSyncIndicator />);
    expect(screen.getByText(/Auto-sync enabled/)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Settings are automatically saved when you make changes/,
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Settings are automatically synced to the backend server when you make changes/,
      ),
    ).toBeInTheDocument();
  });
  it("should render status dot", () => {
    render(<AutoSyncIndicator />);
    expect(screen.getByTestId("auto-sync-dot")).toBeInTheDocument();
  });
  it("should render section wrapper", () => {
    render(<AutoSyncIndicator />);
    expect(screen.getByTestId("auto-sync-section")).toBeInTheDocument();
  });
});

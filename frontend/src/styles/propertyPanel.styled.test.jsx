import { render, screen } from "@testing-library/react";
import { PropertyPanelSaveBtn, PropertyPanelTitle } from "./propertyPanel.styled";

describe("propertyPanel.styled", () => {
  it("renders PropertyPanelSaveBtn with status", () => {
    render(
      <PropertyPanelSaveBtn $status="saved" data-testid="s">
        OK
      </PropertyPanelSaveBtn>,
    );
    expect(screen.getByTestId("s")).toHaveTextContent("OK");
  });

  it("renders PropertyPanelTitle compact", () => {
    render(<PropertyPanelTitle $compact>T</PropertyPanelTitle>);
    expect(screen.getByText("T")).toBeInTheDocument();
  });
});

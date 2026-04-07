import { render, screen } from "@testing-library/react";
import { InputConfigTip, InputConfigAddButton } from "./inputConfiguration.styled";

describe("inputConfiguration.styled", () => {
  it("renders InputConfigTip", () => {
    render(<InputConfigTip>Hint text</InputConfigTip>);
    expect(screen.getByText("Hint text")).toBeInTheDocument();
  });

  it("renders InputConfigAddButton", () => {
    render(<InputConfigAddButton type="button">Add</InputConfigAddButton>);
    expect(screen.getByRole("button", { name: "Add" })).toBeInTheDocument();
  });
});

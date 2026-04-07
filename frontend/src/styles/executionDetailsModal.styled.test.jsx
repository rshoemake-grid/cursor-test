import { render, screen } from "@testing-library/react";
import {
  ExecModalBackdrop,
  ExecModalStatusIconWrap,
} from "./executionDetailsModal.styled";
import { CheckCircle } from "lucide-react";

describe("executionDetailsModal.styled", () => {
  it("renders backdrop with test id", () => {
    render(<ExecModalBackdrop />);
    expect(
      screen.getByTestId("execution-details-modal-backdrop"),
    ).toBeInTheDocument();
  });

  it("renders status icon wrap with tone", () => {
    render(
      <ExecModalStatusIconWrap $tone="green" data-testid="icon">
        <CheckCircle />
      </ExecModalStatusIconWrap>,
    );
    expect(screen.getByTestId("icon").querySelector("svg")).toBeTruthy();
  });
});

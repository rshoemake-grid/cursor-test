import { render, screen } from "@testing-library/react";
import {
  ModalBackdrop,
  ModalTitle,
  DialogPrimaryButton,
} from "./modalDialog.styled";

describe("modalDialog.styled", () => {
  it("renders ModalBackdrop with child", () => {
    render(
      <ModalBackdrop data-testid="bd">
        <span>inside</span>
      </ModalBackdrop>,
    );
    expect(screen.getByTestId("bd")).toContainHTML("inside");
  });

  it("renders ModalTitle", () => {
    render(<ModalTitle>Hello</ModalTitle>);
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Hello",
    );
  });

  it("renders DialogPrimaryButton", () => {
    render(<DialogPrimaryButton type="button">OK</DialogPrimaryButton>);
    expect(screen.getByRole("button", { name: "OK" })).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import {
  AuthGradientShell,
  AuthCard,
  AuthHeading1,
  AuthPrimaryButton,
} from "./authPages.styled";

describe("authPages.styled", () => {
  it("renders AuthGradientShell with child", () => {
    render(
      <AuthGradientShell data-testid="shell">
        <span>inner</span>
      </AuthGradientShell>,
    );
    expect(screen.getByTestId("shell")).toContainHTML("inner");
  });

  it("renders AuthCard with child", () => {
    render(
      <AuthCard data-testid="card">
        <div>card-body</div>
      </AuthCard>,
    );
    expect(screen.getByTestId("card")).toContainHTML("card-body");
  });

  it("renders AuthHeading1", () => {
    render(<AuthHeading1>Title</AuthHeading1>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Title",
    );
  });

  it("renders AuthPrimaryButton", () => {
    render(<AuthPrimaryButton type="button">Submit</AuthPrimaryButton>);
    expect(
      screen.getByRole("button", {
        name: "Submit",
      }),
    ).toBeInTheDocument();
  });
});

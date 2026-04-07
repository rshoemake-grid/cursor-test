import { render, screen } from "@testing-library/react";
import { FormFieldRoot, FormFieldTextInput } from "./formField.styled";

describe("formField.styled", () => {
  it("renders FormFieldTextInput", () => {
    render(<FormFieldTextInput data-testid="inp" defaultValue="a" readOnly />);
    expect(screen.getByTestId("inp")).toHaveDisplayValue("a");
  });

  it("renders FormFieldRoot", () => {
    render(<FormFieldRoot data-testid="root">c</FormFieldRoot>);
    expect(screen.getByTestId("root")).toHaveTextContent("c");
  });
});

import { render, screen } from "@testing-library/react";
import { TabBarRoot, TabBarTabBtn } from "./tabBar.styled";

describe("tabBar.styled", () => {
  it("renders TabBarTabBtn with data-active", () => {
    render(
      <TabBarTabBtn $active={false} data-testid="t">
        A
      </TabBarTabBtn>,
    );
    expect(screen.getByTestId("t")).toHaveAttribute("data-active", "false");
  });

  it("renders TabBarRoot", () => {
    render(<TabBarRoot data-testid="root">x</TabBarRoot>);
    expect(screen.getByTestId("root")).toHaveTextContent("x");
  });
});

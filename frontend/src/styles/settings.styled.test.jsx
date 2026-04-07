import { render, screen } from "@testing-library/react";
import {
  SettingsCard,
  SettingsPageTitle,
  SettingsTabNavButton,
} from "./settings.styled";

describe("settings.styled", () => {
  it("renders SettingsCard with child", () => {
    render(
      <SettingsCard data-testid="card">
        <span>inside</span>
      </SettingsCard>,
    );
    expect(screen.getByTestId("card")).toContainHTML("inside");
  });

  it("renders SettingsPageTitle", () => {
    render(<SettingsPageTitle>Settings</SettingsPageTitle>);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Settings",
    );
  });

  it("renders SettingsTabNavButton with aria-pressed", () => {
    render(
      <SettingsTabNavButton type="button" $active={true} aria-pressed={true}>
        Tab
      </SettingsTabNavButton>,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });
});

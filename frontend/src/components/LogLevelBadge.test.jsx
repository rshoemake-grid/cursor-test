import { render, screen } from "@testing-library/react";
import LogLevelBadge from "./LogLevelBadge";
import * as logLevelModule from "../utils/logLevel";

describe("LogLevelBadge", () => {
  it("renders normalized level text for INFO", () => {
    render(<LogLevelBadge level="INFO" />);
    expect(screen.getByText("INFO")).toBeInTheDocument();
    expect(screen.getByText("INFO")).toHaveAttribute("data-log-tone", "info");
  });

  it("maps ERROR to error tone", () => {
    render(<LogLevelBadge level="ERROR" />);
    expect(screen.getByText("ERROR")).toHaveAttribute("data-log-tone", "error");
  });

  it("maps invalid level to INFO display with info tone", () => {
    render(<LogLevelBadge level="not-a-level" />);
    expect(screen.getByText("INFO")).toBeInTheDocument();
    expect(screen.getByText("INFO")).toHaveAttribute("data-log-tone", "info");
  });

  it("sets data-show-background when showBackground is true", () => {
    render(<LogLevelBadge level="WARNING" showBackground={true} />);
    expect(screen.getByText("WARNING")).toHaveAttribute(
      "data-show-background",
      "true",
    );
  });

  it("sets data-show-background false when showBackground is false", () => {
    render(<LogLevelBadge level="WARNING" showBackground={false} />);
    expect(screen.getByText("WARNING")).toHaveAttribute(
      "data-show-background",
      "false",
    );
  });

  it("forwards custom className", () => {
    render(<LogLevelBadge level="INFO" className="custom-class" />);
    expect(screen.getByText("INFO")).toHaveClass("custom-class");
  });

  it("calls getLogLevelTone via rendered data attributes for integration", () => {
    const spy = jest.spyOn(logLevelModule, "getLogLevelTone");
    render(<LogLevelBadge level="DEBUG" />);
    expect(spy).toHaveBeenCalled();
    expect(screen.getByText("DEBUG")).toHaveAttribute("data-log-tone", "debug");
    spy.mockRestore();
  });
});

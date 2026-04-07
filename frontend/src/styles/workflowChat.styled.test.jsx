import { render, screen } from "@testing-library/react";
import { ChatRoot, ChatBubble, ChatBubbleText } from "./workflowChat.styled";

describe("workflowChat.styled", () => {
  it("renders ChatRoot", () => {
    render(
      <ChatRoot data-testid="root">
        <span>x</span>
      </ChatRoot>,
    );
    expect(screen.getByTestId("root")).toContainHTML("x");
  });

  it("renders ChatBubble with text", () => {
    render(
      <ChatBubble $variant="assistant">
        <ChatBubbleText>Hi</ChatBubbleText>
      </ChatBubble>,
    );
    expect(screen.getByText("Hi")).toBeInTheDocument();
  });
});

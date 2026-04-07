import { render, screen } from "@testing-library/react";
import StartNode from "./StartNode";
import { ReactFlowProvider } from "@xyflow/react";
const renderWithProvider = (component) => {
  return render(<ReactFlowProvider>{component}</ReactFlowProvider>);
};
describe("StartNode", () => {
  it("should render start node", () => {
    renderWithProvider(<StartNode selected={false} data={{}} id="start-1" />);
    expect(screen.getByText("Start")).toBeInTheDocument();
  });
  it("should show selected state", () => {
    renderWithProvider(
      <StartNode selected={true} data={{}} id="start-1" />,
    );
    expect(screen.getByTestId("start-node")).toHaveAttribute(
      "data-visual-state",
      "selected",
    );
  });
  it("should show unselected state", () => {
    renderWithProvider(
      <StartNode selected={false} data={{}} id="start-1" />,
    );
    expect(screen.getByTestId("start-node")).toHaveAttribute(
      "data-visual-state",
      "default",
    );
  });
});

import { render, screen } from "@testing-library/react";
import EndNode from "./EndNode";
import { ReactFlowProvider } from "@xyflow/react";
const renderWithProvider = (component) => {
  return render(<ReactFlowProvider>{component}</ReactFlowProvider>);
};
describe("EndNode", () => {
  it("should render end node", () => {
    renderWithProvider(<EndNode selected={false} data={{}} id="end-1" />);
    expect(screen.getByText("End")).toBeInTheDocument();
  });
  it("should show selected state", () => {
    renderWithProvider(
      <EndNode selected={true} data={{}} id="end-1" />,
    );
    expect(screen.getByTestId("end-node")).toHaveAttribute(
      "data-visual-state",
      "selected",
    );
  });
  it("should show unselected state", () => {
    renderWithProvider(
      <EndNode selected={false} data={{}} id="end-1" />,
    );
    expect(screen.getByTestId("end-node")).toHaveAttribute(
      "data-visual-state",
      "default",
    );
  });
});

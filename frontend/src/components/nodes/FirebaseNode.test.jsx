import { render, screen } from "@testing-library/react";
import FirebaseNode from "./FirebaseNode";
import { ReactFlowProvider } from "@xyflow/react";
const renderWithProvider = (component) => {
  return render(<ReactFlowProvider>{component}</ReactFlowProvider>);
};
describe("FirebaseNode", () => {
  it("should render firebase node", () => {
    const nodeData = {
      label: "My Firebase",
    };
    renderWithProvider(
      <FirebaseNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText("My Firebase")).toBeInTheDocument();
  });
  it("should render with default label", () => {
    const nodeData = {
      label: "",
    };
    renderWithProvider(
      <FirebaseNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText("Firebase")).toBeInTheDocument();
  });
  it("should render firebase service", () => {
    const nodeData = {
      label: "My Firebase",
      input_config: {
        firebase_service: "firestore",
      },
    };
    renderWithProvider(
      <FirebaseNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText(/Service: firestore/)).toBeInTheDocument();
  });
  it("should render project ID", () => {
    const nodeData = {
      label: "My Firebase",
      input_config: {
        project_id: "my-project",
      },
    };
    renderWithProvider(
      <FirebaseNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText(/Project: my-project/)).toBeInTheDocument();
  });
  it("should render mode", () => {
    const nodeData = {
      label: "My Firebase",
      input_config: {
        mode: "write",
      },
    };
    renderWithProvider(
      <FirebaseNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText(/Mode: Write/)).toBeInTheDocument();
  });
  it("should show selected state", () => {
    const nodeData = {
      label: "My Firebase",
    };
    const { container } = renderWithProvider(
      <FirebaseNode data={nodeData} selected={true} id="node-1" />,
    );
    expect(screen.getByTestId("firebase-node")).toHaveAttribute(
      "data-visual-state",
      "selected",
    );
  });
  it("should show error state", () => {
    const nodeData = {
      label: "My Firebase",
      executionStatus: "failed",
    };
    renderWithProvider(
      <FirebaseNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByTestId("firebase-node")).toHaveAttribute(
      "data-visual-state",
      "error",
    );
  });
});

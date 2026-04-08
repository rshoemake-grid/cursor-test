import { render, screen } from "@testing-library/react";
import GCPBucketNode from "./GCPBucketNode";
import { ReactFlowProvider } from "@xyflow/react";
const renderWithProvider = (component) => {
  return render(<ReactFlowProvider>{component}</ReactFlowProvider>);
};
describe("GCPBucketNode", () => {
  it("should render GCP bucket node", () => {
    const nodeData = {
      label: "My Bucket",
    };
    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText("My Bucket")).toBeInTheDocument();
  });
  it("should render with default label", () => {
    const nodeData = {
      label: "",
    };
    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText("GCP Bucket")).toBeInTheDocument();
  });
  it("should not show input_config details on the card", () => {
    const nodeData = {
      label: "My Bucket",
      input_config: {
        project_id: "my-gcp-project",
        bucket_name: "my-bucket",
        object_path: "path/to/file.txt",
        mode: "write",
      },
    };
    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.queryByText(/Project:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Bucket:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/File:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Mode:/)).not.toBeInTheDocument();
  });
  it("should show selected state", () => {
    const nodeData = {
      label: "My Bucket",
    };
    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={true} id="node-1" />,
    );
    expect(screen.getByTestId("gcp-bucket-node")).toHaveAttribute(
      "data-visual-state",
      "selected",
    );
  });
  it("should show error state", () => {
    const nodeData = {
      label: "My Bucket",
      executionStatus: "failed",
    };
    renderWithProvider(
      <GCPBucketNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByTestId("gcp-bucket-node")).toHaveAttribute(
      "data-visual-state",
      "error",
    );
  });
});

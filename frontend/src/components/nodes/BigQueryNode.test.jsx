import { render, screen } from "@testing-library/react";
import BigQueryNode from "./BigQueryNode";
import { ReactFlowProvider } from "@xyflow/react";
const renderWithProvider = (component) => {
  return render(<ReactFlowProvider>{component}</ReactFlowProvider>);
};
describe("BigQueryNode", () => {
  it("should render BigQuery node", () => {
    const nodeData = {
      label: "My BigQuery",
    };
    renderWithProvider(
      <BigQueryNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText("My BigQuery")).toBeInTheDocument();
  });
  it("should render with default label", () => {
    const nodeData = {
      label: "",
    };
    renderWithProvider(
      <BigQueryNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText("BigQuery")).toBeInTheDocument();
  });
  it("should render project ID", () => {
    const nodeData = {
      label: "My BigQuery",
      input_config: {
        project_id: "my-project",
      },
    };
    renderWithProvider(
      <BigQueryNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText(/Project: my-project/)).toBeInTheDocument();
  });
  it("should render dataset", () => {
    const nodeData = {
      label: "My BigQuery",
      input_config: {
        dataset: "my_dataset",
      },
    };
    renderWithProvider(
      <BigQueryNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText(/Dataset: my_dataset/)).toBeInTheDocument();
  });
  it("should render table", () => {
    const nodeData = {
      label: "My BigQuery",
      input_config: {
        table: "my_table",
      },
    };
    renderWithProvider(
      <BigQueryNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText(/Table: my_table/)).toBeInTheDocument();
  });
  it("should render mode", () => {
    const nodeData = {
      label: "My BigQuery",
      input_config: {
        mode: "read",
      },
    };
    renderWithProvider(
      <BigQueryNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByText(/Mode: Read/)).toBeInTheDocument();
  });
  it("should show selected state", () => {
    const nodeData = {
      label: "My BigQuery",
    };
    renderWithProvider(
      <BigQueryNode data={nodeData} selected={true} id="node-1" />,
    );
    expect(screen.getByTestId("bigquery-node")).toHaveAttribute(
      "data-visual-state",
      "selected",
    );
  });
  it("should show error state", () => {
    const nodeData = {
      label: "My BigQuery",
      executionStatus: "failed",
    };
    renderWithProvider(
      <BigQueryNode data={nodeData} selected={false} id="node-1" />,
    );
    expect(screen.getByTestId("bigquery-node")).toHaveAttribute(
      "data-visual-state",
      "error",
    );
  });
});

import { jsx } from "react/jsx-runtime";
import { render, screen } from "@testing-library/react";
import BigQueryNode from "./BigQueryNode";
import { ReactFlowProvider } from "@xyflow/react";
const renderWithProvider = (component) => {
  return render(
    /* @__PURE__ */ jsx(ReactFlowProvider, { children: component })
  );
};
describe("BigQueryNode", () => {
  it("should render BigQuery node", () => {
    const nodeData = {
      label: "My BigQuery"
    };
    renderWithProvider(
      /* @__PURE__ */ jsx(BigQueryNode, { data: nodeData, selected: false, id: "node-1" })
    );
    expect(screen.getByText("My BigQuery")).toBeInTheDocument();
  });
  it("should render with default label", () => {
    const nodeData = {
      label: ""
    };
    renderWithProvider(
      /* @__PURE__ */ jsx(BigQueryNode, { data: nodeData, selected: false, id: "node-1" })
    );
    expect(screen.getByText("BigQuery")).toBeInTheDocument();
  });
  it("should render project ID", () => {
    const nodeData = {
      label: "My BigQuery",
      input_config: {
        project_id: "my-project"
      }
    };
    renderWithProvider(
      /* @__PURE__ */ jsx(BigQueryNode, { data: nodeData, selected: false, id: "node-1" })
    );
    expect(screen.getByText(/Project: my-project/)).toBeInTheDocument();
  });
  it("should render dataset", () => {
    const nodeData = {
      label: "My BigQuery",
      input_config: {
        dataset: "my_dataset"
      }
    };
    renderWithProvider(
      /* @__PURE__ */ jsx(BigQueryNode, { data: nodeData, selected: false, id: "node-1" })
    );
    expect(screen.getByText(/Dataset: my_dataset/)).toBeInTheDocument();
  });
  it("should render table", () => {
    const nodeData = {
      label: "My BigQuery",
      input_config: {
        table: "my_table"
      }
    };
    renderWithProvider(
      /* @__PURE__ */ jsx(BigQueryNode, { data: nodeData, selected: false, id: "node-1" })
    );
    expect(screen.getByText(/Table: my_table/)).toBeInTheDocument();
  });
  it("should render mode", () => {
    const nodeData = {
      label: "My BigQuery",
      input_config: {
        mode: "read"
      }
    };
    renderWithProvider(
      /* @__PURE__ */ jsx(BigQueryNode, { data: nodeData, selected: false, id: "node-1" })
    );
    expect(screen.getByText(/Mode: Read/)).toBeInTheDocument();
  });
  it("should show selected state", () => {
    const nodeData = {
      label: "My BigQuery"
    };
    const { container } = renderWithProvider(
      /* @__PURE__ */ jsx(BigQueryNode, { data: nodeData, selected: true, id: "node-1" })
    );
    const nodeElement = container.querySelector(".border-blue-500");
    expect(nodeElement).toBeInTheDocument();
  });
  it("should show error state", () => {
    const nodeData = {
      label: "My BigQuery",
      executionStatus: "failed"
    };
    const { container } = renderWithProvider(
      /* @__PURE__ */ jsx(BigQueryNode, { data: nodeData, selected: false, id: "node-1" })
    );
    const nodeElement = container.querySelector(".border-red-500");
    expect(nodeElement).toBeInTheDocument();
  });
});

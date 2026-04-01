import { jsx } from "react/jsx-runtime";
import { render, screen, fireEvent } from "@testing-library/react";
import ExecutionInputDialog from "./ExecutionInputDialog";
describe("ExecutionInputDialog", () => {
  const mockOnClose = jest.fn();
  const mockOnSubmit = jest.fn();
  const mockNodes = [
    {
      id: "start-1",
      type: "start",
      name: "Start Node",
      position: { x: 0, y: 0 },
      inputs: []
    }
  ];
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should not render when isOpen is false", () => {
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: false,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: mockNodes
        }
      )
    );
    expect(screen.queryByText("Execute Workflow")).not.toBeInTheDocument();
  });
  it("should render when isOpen is true", () => {
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: mockNodes
        }
      )
    );
    expect(screen.getByText("Execute Workflow")).toBeInTheDocument();
  });
  it("should display workflow name when provided", () => {
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: mockNodes,
          workflowName: "Test Workflow"
        }
      )
    );
    expect(screen.getByText("Execute: Test Workflow")).toBeInTheDocument();
  });
  it("should show message when no input nodes", () => {
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: mockNodes
        }
      )
    );
    expect(screen.getByText(/This workflow doesn't require any inputs/)).toBeInTheDocument();
  });
  it("should render input fields for nodes with input_config", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text",
              required: true,
              placeholder: "Enter value"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    expect(screen.getByText("Input 1")).toBeInTheDocument();
    const inputs = screen.getAllByRole("textbox");
    expect(inputs.length).toBeGreaterThan(0);
  });
  it("should handle text input changes", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const inputs = screen.getAllByRole("textbox");
    const input = inputs[0];
    fireEvent.change(input, { target: { value: "test value" } });
    expect(input.value).toBe("test value");
  });
  it("should handle number input changes", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "count",
              label: "Count",
              type: "number"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const label = screen.getByText("Count");
    const numberInput = label.nextElementSibling;
    expect(numberInput).toBeDefined();
    expect(numberInput.type).toBe("number");
    fireEvent.change(numberInput, { target: { value: "42" } });
    expect(numberInput.value).toBe("42");
  });
  it("should handle textarea input changes", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "description",
              label: "Description",
              type: "textarea"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const textarea = screen.getByRole("textbox");
    fireEvent.change(textarea, { target: { value: "test description" } });
    expect(textarea.value).toBe("test description");
  });
  it("should initialize inputs with default values", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text",
              default_value: "default"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const input = screen.getByDisplayValue("default");
    expect(input.value).toBe("default");
  });
  it("should show required indicator for required inputs", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text",
              required: true
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    expect(screen.getByText("*")).toBeInTheDocument();
  });
  it("should show input description when provided", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text",
              description: "This is a description"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });
  it("should call onClose when close button is clicked", () => {
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: mockNodes
        }
      )
    );
    const closeButton = screen.getByLabelText("Close dialog");
    fireEvent.click(closeButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  it("should call onClose when cancel button is clicked", () => {
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: mockNodes
        }
      )
    );
    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  it("should call onSubmit with inputs when form is submitted", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const inputs = screen.getAllByRole("textbox");
    const input = inputs[0];
    fireEvent.change(input, { target: { value: "test value" } });
    const submitButton = screen.getByText("Execute");
    fireEvent.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalledWith({ input1: "test value" });
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  it("should call onSubmit with empty inputs when no inputs provided", () => {
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: mockNodes
        }
      )
    );
    const submitButton = screen.getByText("Execute");
    fireEvent.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalledWith({});
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
  it("should handle multiple input nodes", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node 1",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text"
            }
          ]
        }
      },
      {
        id: "start-2",
        type: "start",
        name: "Start Node 2",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input2",
              label: "Input 2",
              type: "text"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    expect(screen.getByText("Start Node 1")).toBeInTheDocument();
    expect(screen.getByText("Start Node 2")).toBeInTheDocument();
    expect(screen.getByText("Input 1")).toBeInTheDocument();
    expect(screen.getByText("Input 2")).toBeInTheDocument();
  });
  it("should reset inputs when dialog closes and reopens", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text",
              default_value: "default"
            }
          ]
        }
      }
    ];
    const { rerender } = render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const input = screen.getByDisplayValue("default");
    fireEvent.change(input, { target: { value: "changed value" } });
    expect(input.value).toBe("changed value");
    rerender(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: false,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    rerender(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const inputAfterReopen = screen.getByDisplayValue("default");
    expect(inputAfterReopen.value).toBe("default");
  });
  it("should handle textarea input type", () => {
    const nodesWithTextarea = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "textarea1",
              label: "Textarea Input",
              type: "textarea"
            }
          ]
        }
      }
    ];
    const { container } = render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithTextarea
        }
      )
    );
    const textarea = container.querySelector("textarea");
    expect(textarea).toBeInTheDocument();
    expect(textarea.tagName).toBe("TEXTAREA");
    expect(textarea.rows).toBe(4);
  });
  it("should handle number input type", () => {
    const nodesWithNumber = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "number1",
              label: "Number Input",
              type: "number"
            }
          ]
        }
      }
    ];
    const { container } = render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithNumber
        }
      )
    );
    const numberInput = container.querySelector('input[type="number"]');
    expect(numberInput).toBeInTheDocument();
    expect(numberInput.type).toBe("number");
    fireEvent.change(numberInput, { target: { value: "42" } });
    const submitButton = screen.getByText("Execute");
    fireEvent.click(submitButton);
    expect(mockOnSubmit).toHaveBeenCalledWith({ number1: 42 });
  });
  it("should display required field indicator", () => {
    const nodesWithRequired = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "required1",
              label: "Required Input",
              type: "text",
              required: true
            }
          ]
        }
      }
    ];
    const { container } = render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithRequired
        }
      )
    );
    expect(screen.getByText("*")).toBeInTheDocument();
    const input = container.querySelector("input[required]");
    expect(input).toBeInTheDocument();
    expect(input.required).toBe(true);
  });
  it("should display input description", () => {
    const nodesWithDescription = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text",
              description: "This is a description"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithDescription
        }
      )
    );
    expect(screen.getByText("This is a description")).toBeInTheDocument();
  });
  it("should handle node without name", () => {
    const nodesWithoutName = [
      {
        id: "start-1",
        type: "start",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithoutName
        }
      )
    );
    expect(screen.getByText("Inputs")).toBeInTheDocument();
  });
  it("should handle input without label", () => {
    const nodesWithoutLabel = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              type: "text"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithoutLabel
        }
      )
    );
    expect(screen.getByText("input1")).toBeInTheDocument();
  });
  it("should handle input with placeholder", () => {
    const nodesWithPlaceholder = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text",
              placeholder: "Enter value"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithPlaceholder
        }
      )
    );
    const input = screen.getByPlaceholderText("Enter value");
    expect(input).toBeInTheDocument();
  });
  it("should handle node with empty inputs array", () => {
    const nodesWithEmptyInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: []
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithEmptyInputs
        }
      )
    );
    expect(screen.getByText("Execute")).toBeInTheDocument();
  });
  it("should handle node without input_config", () => {
    const nodesWithoutConfig = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: []
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithoutConfig
        }
      )
    );
    expect(screen.getByText(/This workflow doesn't require any inputs/)).toBeInTheDocument();
  });
  it("should handle input_config without inputs property", () => {
    const nodesWithoutInputsProperty = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {}
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithoutInputsProperty
        }
      )
    );
    expect(screen.getByText("Execute")).toBeInTheDocument();
  });
  it("should handle input without default_value", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text"
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const inputs = screen.getAllByRole("textbox");
    const input = inputs[0];
    expect(input.value).toBe("");
  });
  it("should handle input with default_value as null", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "input1",
              label: "Input 1",
              type: "text",
              default_value: null
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const inputs = screen.getAllByRole("textbox");
    const input = inputs[0];
    expect(input.value).toBe("");
  });
  it("should handle input with default_value as 0", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "count",
              label: "Count",
              type: "number",
              default_value: 0
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const numberInput = document.querySelector('input[type="number"]');
    expect(numberInput).toBeInTheDocument();
    expect(numberInput.value).toBe("");
  });
  it("should handle input with default_value as false", () => {
    const nodesWithInputs = [
      {
        id: "start-1",
        type: "start",
        name: "Start Node",
        position: { x: 0, y: 0 },
        inputs: [],
        input_config: {
          inputs: [
            {
              name: "enabled",
              label: "Enabled",
              type: "text",
              default_value: false
            }
          ]
        }
      }
    ];
    render(
      /* @__PURE__ */ jsx(
        ExecutionInputDialog,
        {
          isOpen: true,
          onClose: mockOnClose,
          onSubmit: mockOnSubmit,
          nodes: nodesWithInputs
        }
      )
    );
    const inputs = screen.getAllByRole("textbox");
    const input = inputs[0];
    expect(input.value).toBe("");
  });
});

import { render, screen, fireEvent } from "@testing-library/react";
import { AddProviderForm } from "./AddProviderForm";
describe("AddProviderForm", () => {
  const mockOnShowAddProvider = jest.fn();
  const mockOnSelectedTemplateChange = jest.fn();
  const mockOnAddProvider = jest.fn();
  const defaultProps = {
    showAddProvider: false,
    onShowAddProvider: mockOnShowAddProvider,
    selectedTemplate: "openai",
    onSelectedTemplateChange: mockOnSelectedTemplateChange,
    onAddProvider: mockOnAddProvider,
  };
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe("when showAddProvider is false", () => {
    it("should render add provider button", () => {
      render(<AddProviderForm {...defaultProps} />);
      expect(screen.getByTestId("add-provider-reveal")).toBeInTheDocument();
      expect(screen.getByText("Add LLM Provider")).toBeInTheDocument();
    });
    it("should call onShowAddProvider(true) when button is clicked", () => {
      render(<AddProviderForm {...defaultProps} />);
      const button = screen.getByText("Add LLM Provider");
      fireEvent.click(button);
      expect(mockOnShowAddProvider).toHaveBeenCalledWith(true);
      expect(mockOnShowAddProvider).toHaveBeenCalledTimes(1);
    });
    it("should expose reveal control as a button", () => {
      render(<AddProviderForm {...defaultProps} />);
      const button = screen.getByTestId("add-provider-reveal");
      expect(button.tagName).toBe("BUTTON");
    });
  });
  describe("when showAddProvider is true", () => {
    it("should render add provider form", () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />);
      expect(screen.getByText("Add New Provider")).toBeInTheDocument();
      expect(screen.getByLabelText("Select Provider Type")).toBeInTheDocument();
      expect(screen.getByText("Add Provider")).toBeInTheDocument();
      expect(screen.getByText("Cancel")).toBeInTheDocument();
    });
    it("should render all provider type options", () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />);
      const select = screen.getByLabelText("Select Provider Type");
      expect(select.options[0].text).toBe("OpenAI (GPT-4, GPT-3.5, etc.)");
      expect(select.options[1].text).toBe("Anthropic (Claude)");
      expect(select.options[2].text).toBe("Google Gemini");
      expect(select.options[3].text).toBe("Custom Provider");
    });
    it("should display selected template value", () => {
      render(
        <AddProviderForm
          {...defaultProps}
          showAddProvider={true}
          selectedTemplate="anthropic"
        />,
      );
      const select = screen.getByLabelText("Select Provider Type");
      expect(select.value).toBe("anthropic");
    });
    it("should call onSelectedTemplateChange when template is changed", () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />);
      const select = screen.getByLabelText("Select Provider Type");
      fireEvent.change(select, {
        target: {
          value: "gemini",
        },
      });
      expect(mockOnSelectedTemplateChange).toHaveBeenCalledWith("gemini");
      expect(mockOnSelectedTemplateChange).toHaveBeenCalledTimes(1);
    });
    it("should call onAddProvider when add button is clicked", () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />);
      const addButton = screen.getByText("Add Provider");
      fireEvent.click(addButton);
      expect(mockOnAddProvider).toHaveBeenCalledTimes(1);
    });
    it("should call onShowAddProvider(false) when cancel button is clicked", () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />);
      const cancelButton = screen.getByText("Cancel");
      fireEvent.click(cancelButton);
      expect(mockOnShowAddProvider).toHaveBeenCalledWith(false);
      expect(mockOnShowAddProvider).toHaveBeenCalledTimes(1);
    });
    it("should render elevated panel container", () => {
      render(<AddProviderForm {...defaultProps} showAddProvider={true} />);
      expect(screen.getByTestId("add-provider-panel")).toBeInTheDocument();
    });
  });
});

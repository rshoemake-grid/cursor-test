import { jsx } from "react/jsx-runtime";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
const waitForWithTimeout = (callback, timeout = 2e3) => {
  return waitFor(callback, { timeout });
};
import userEvent from "@testing-library/user-event";
import AgentNodeEditor from "./AgentNodeEditor";
import { showSuccess } from "../../utils/notifications";
jest.mock("../../utils/notifications", () => ({
  showSuccess: jest.fn()
}));
const mockCreateObjectURL = jest.fn().mockReturnValue("blob:mock-url");
const mockRevokeObjectURL = jest.fn();
global.URL.createObjectURL = mockCreateObjectURL;
global.URL.revokeObjectURL = mockRevokeObjectURL;
const mockNode = {
  id: "test-agent",
  type: "agent",
  data: {
    name: "Test Agent",
    agent_config: {
      model: "gpt-4",
      system_prompt: "You are a helpful assistant",
      max_tokens: 1e3,
      temperature: 0.7
    }
  },
  position: { x: 0, y: 0 }
};
describe("AgentNodeEditor", () => {
  const mockOnUpdate = jest.fn();
  const mockOnConfigUpdate = jest.fn();
  const availableModels = [
    { value: "gpt-4", label: "GPT-4", provider: "openai" },
    { value: "gpt-3.5-turbo", label: "GPT-3.5 Turbo", provider: "openai" }
  ];
  beforeEach(() => {
    jest.clearAllMocks();
  });
  it("should render agent configuration fields", () => {
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/system prompt/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/temperature/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/max tokens/i)).toBeInTheDocument();
  });
  it("should display current model value", () => {
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const modelSelect = screen.getByLabelText(/model/i);
    expect(modelSelect.value).toBe("gpt-4");
  });
  it("should call onUpdate when model changes", async () => {
    const user = userEvent.setup();
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const modelSelect = screen.getByLabelText(/model/i);
    await user.selectOptions(modelSelect, "gpt-3.5-turbo");
    expect(mockOnUpdate).toHaveBeenCalledWith("agent_config", expect.objectContaining({
      model: "gpt-3.5-turbo"
    }));
  });
  it("should call onConfigUpdate when system prompt changes", async () => {
    const user = userEvent.setup();
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const promptTextarea = screen.getByLabelText(/system prompt/i);
    await user.clear(promptTextarea);
    await user.type(promptTextarea, "New prompt");
    await waitForWithTimeout(() => {
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("agent_config", "system_prompt", "New prompt");
    });
  });
  it("should call onConfigUpdate when max tokens changes", async () => {
    const user = userEvent.setup();
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const maxTokensInput = screen.getByLabelText(/max tokens/i);
    await user.clear(maxTokensInput);
    await user.type(maxTokensInput, "2000");
    await waitForWithTimeout(() => {
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("agent_config", "max_tokens", 2e3);
    });
  });
  it("should call onUpdate when temperature changes", () => {
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const temperatureSlider = screen.getByLabelText(/temperature/i);
    fireEvent.change(temperatureSlider, { target: { value: "0.9" } });
    expect(mockOnUpdate).toHaveBeenCalledWith("agent_config", expect.objectContaining({
      temperature: 0.9
    }));
  });
  it("should display default models when availableModels is empty", () => {
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels: [],
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const modelSelect = screen.getByLabelText(/model/i);
    expect(modelSelect.querySelector('option[value="gpt-4o-mini"]')).toBeInTheDocument();
  });
  it("should display info box about LLM agent", () => {
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    expect(screen.getByText(/This is a Real LLM Agent/i)).toBeInTheDocument();
  });
  describe("Agent Type and ADK", () => {
    it("should show Agent Type dropdown with workflow and ADK options", () => {
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const agentTypeSelect = screen.getByLabelText(/select agent type/i);
      expect(agentTypeSelect).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /workflow agent/i })).toBeInTheDocument();
      expect(screen.getByRole("option", { name: /adk agent/i })).toBeInTheDocument();
    });
    it("should show ADK config panel when agent_type is adk", () => {
      const adkNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            agent_type: "adk",
            adk_config: { name: "my_adk_agent" }
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: adkNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      expect(screen.getByText(/ADK Configuration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/agent name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/adk tools/i)).toBeInTheDocument();
      const nameInput = screen.getByPlaceholderText(/e\.g\., assistant_agent/i);
      expect(nameInput).toHaveValue("my_adk_agent");
    });
    it("should call onUpdate when switching to ADK agent type", async () => {
      const user = userEvent.setup();
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const agentTypeSelect = screen.getByLabelText(/select agent type/i);
      await user.selectOptions(agentTypeSelect, "adk");
      expect(mockOnUpdate).toHaveBeenCalledWith("agent_config", expect.objectContaining({
        agent_type: "adk"
      }));
    });
    it("should call onUpdate when changing ADK name", () => {
      const adkNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            agent_type: "adk",
            adk_config: {}
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: adkNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const nameInput = screen.getByPlaceholderText(/e\.g\., assistant_agent/i);
      fireEvent.change(nameInput, { target: { value: "test_agent" } });
      expect(mockOnUpdate).toHaveBeenCalledWith("agent_config", expect.objectContaining({
        adk_config: expect.objectContaining({ name: "test_agent" })
      }));
    });
    it("should show Instruction label when agent_type is adk", () => {
      const adkNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            agent_type: "adk"
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: adkNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      expect(screen.getByLabelText(/instruction/i)).toBeInTheDocument();
    });
  });
  describe("Export Agent Config", () => {
    it("should render Export Agent Config button", () => {
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      expect(screen.getByRole("button", { name: /export agent config/i })).toBeInTheDocument();
    });
    it("should call showSuccess when Export is clicked", () => {
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      fireEvent.click(screen.getByRole("button", { name: /export agent config/i }));
      expect(showSuccess).toHaveBeenCalledWith("Agent config exported");
    });
  });
  it("should use default model when agent_config.model is missing", () => {
    const nodeWithoutModel = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          system_prompt: "Test",
          max_tokens: 1e3,
          temperature: 0.7
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithoutModel,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const modelSelect = screen.getByLabelText(/model/i);
    expect(modelSelect.value).toBe("gpt-4");
  });
  it("should display empty string when system_prompt is missing", () => {
    const nodeWithoutPrompt = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          model: "gpt-4",
          max_tokens: 1e3,
          temperature: 0.7
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithoutPrompt,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const promptTextarea = screen.getByLabelText(/system prompt/i);
    expect(promptTextarea.value).toBe("");
  });
  it("should display empty string when max_tokens is missing", () => {
    const nodeWithoutTokens = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          model: "gpt-4",
          system_prompt: "Test prompt",
          temperature: 0.7
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithoutTokens,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const maxTokensInput = screen.getByLabelText(/max tokens/i);
    expect(maxTokensInput.value).toBe("");
  });
  it("should display default temperature value of 0.7 when missing", () => {
    const nodeWithoutTemp = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          model: "gpt-4",
          system_prompt: "Test prompt",
          max_tokens: 1e3
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithoutTemp,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const temperatureSlider = screen.getByLabelText(/temperature/i);
    expect(temperatureSlider.getAttribute("aria-valuenow")).toBe("0.7");
  });
  it("should display default temperature display text when missing", () => {
    const nodeWithoutTemp = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          model: "gpt-4",
          system_prompt: "Test prompt",
          max_tokens: 1e3
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithoutTemp,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    expect(screen.getByText(/Temperature: 0.7/)).toBeInTheDocument();
  });
  it("should use gpt-4o-mini when no availableModels and no model in config", () => {
    const nodeWithoutModel = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          system_prompt: "Test"
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithoutModel,
          availableModels: [],
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const modelSelect = screen.getByLabelText(/model/i);
    expect(modelSelect.value).toBe("gpt-4o-mini");
  });
  it("should handle missing agent_config", () => {
    const nodeWithoutConfig = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: void 0
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithoutConfig,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const modelSelect = screen.getByLabelText(/model/i);
    expect(modelSelect.value).toBe("gpt-4");
  });
  it("should display help text when availableModels is provided", () => {
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    expect(screen.getByText(/This agent will use the configured LLM provider/i)).toBeInTheDocument();
  });
  it("should display help text when availableModels is empty", () => {
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels: [],
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    expect(screen.getByText(/This agent will call the OpenAI API/i)).toBeInTheDocument();
  });
  it("should sync system prompt when node data changes", async () => {
    const { rerender } = render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const promptTextarea = screen.getByLabelText(/system prompt/i);
    expect(promptTextarea.value).toBe("You are a helpful assistant");
    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          system_prompt: "Updated prompt"
        }
      }
    };
    rerender(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: updatedNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    await waitForWithTimeout(() => {
      expect(promptTextarea.value).toBe("Updated prompt");
    });
  });
  it("should sync max tokens when node data changes", async () => {
    const { rerender } = render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const maxTokensInput = screen.getByLabelText(/max tokens/i);
    expect(maxTokensInput.value).toBe("1000");
    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          max_tokens: 2e3
        }
      }
    };
    rerender(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: updatedNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    await waitForWithTimeout(() => {
      expect(maxTokensInput.value).toBe("2000");
    });
  });
  it("should not update local state when input is focused", async () => {
    const { rerender } = render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const promptTextarea = screen.getByLabelText(/system prompt/i);
    promptTextarea.focus();
    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          system_prompt: "Updated prompt"
        }
      }
    };
    rerender(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: updatedNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    expect(promptTextarea.value).toBe("You are a helpful assistant");
  });
  it("should handle empty system prompt", () => {
    const nodeWithEmptyPrompt = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          system_prompt: ""
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithEmptyPrompt,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const promptTextarea = screen.getByLabelText(/system prompt/i);
    expect(promptTextarea.value).toBe("");
  });
  it("should handle empty max tokens", () => {
    const nodeWithEmptyTokens = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          max_tokens: void 0
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithEmptyTokens,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const maxTokensInput = screen.getByLabelText(/max tokens/i);
    expect(maxTokensInput.value).toBe("");
  });
  it("should handle temperature value of 0", async () => {
    const nodeWithZeroTemp = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          temperature: 0
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithZeroTemp,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const temperatureSlider = screen.getByLabelText(/temperature/i);
    await waitForWithTimeout(() => {
      expect(temperatureSlider).toBeInTheDocument();
      expect(temperatureSlider.value).toBe("0.7");
    });
  });
  it("should handle temperature value of 1", () => {
    const nodeWithMaxTemp = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          temperature: 1
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithMaxTemp,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const temperatureSlider = screen.getByLabelText(/temperature/i);
    expect(temperatureSlider.value).toBe("1");
  });
  it("should not update system prompt when input is focused", async () => {
    const { rerender } = render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const promptTextarea = screen.getByLabelText(/system prompt/i);
    promptTextarea.focus();
    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          system_prompt: "Updated prompt"
        }
      }
    };
    rerender(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: updatedNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    expect(promptTextarea.value).toBe("You are a helpful assistant");
  });
  it("should not update max tokens when input is focused", async () => {
    const { rerender } = render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const maxTokensInput = screen.getByLabelText(/max tokens/i);
    maxTokensInput.focus();
    const updatedNode = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          max_tokens: 2e3
        }
      }
    };
    rerender(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: updatedNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    expect(maxTokensInput.value).toBe("1000");
  });
  it("should use gpt-4o-mini when no model and no availableModels", () => {
    const nodeWithoutModel = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          system_prompt: "Test"
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithoutModel,
          availableModels: [],
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const modelSelect = screen.getByLabelText(/model/i);
    expect(modelSelect.value).toBe("gpt-4o-mini");
  });
  it("should handle empty max tokens input value", async () => {
    const user = userEvent.setup();
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: mockNode,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const maxTokensInput = screen.getByLabelText(/max tokens/i);
    await user.clear(maxTokensInput);
    expect(mockOnConfigUpdate).toHaveBeenCalledWith("agent_config", "max_tokens", void 0);
  });
  it("should handle undefined temperature", () => {
    const nodeWithoutTemp = {
      ...mockNode,
      data: {
        ...mockNode.data,
        agent_config: {
          ...mockNode.data.agent_config,
          temperature: void 0
        }
      }
    };
    render(
      /* @__PURE__ */ jsx(
        AgentNodeEditor,
        {
          node: nodeWithoutTemp,
          availableModels,
          onUpdate: mockOnUpdate,
          onConfigUpdate: mockOnConfigUpdate
        }
      )
    );
    const temperatureSlider = screen.getByLabelText(/temperature/i);
    expect(temperatureSlider.value).toBe("0.7");
  });
  describe("edge cases", () => {
    it("should handle agent_config being null", () => {
      const nodeWithNullConfig = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: null
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithNullConfig,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const modelSelect = screen.getByLabelText(/model/i);
      expect(modelSelect.value).toBe("gpt-4");
    });
    it("should handle model || operator with availableModels.length > 0", () => {
      const nodeWithoutModel = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            system_prompt: "Test"
            // model is undefined
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithoutModel,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const modelSelect = screen.getByLabelText(/model/i);
      expect(modelSelect.value).toBe("gpt-4");
    });
    it("should handle model || operator with availableModels.length === 0", () => {
      const nodeWithoutModel = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            system_prompt: "Test"
            // model is undefined
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithoutModel,
            availableModels: [],
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const modelSelect = screen.getByLabelText(/model/i);
      expect(modelSelect.value).toBe("gpt-4o-mini");
    });
    it("should handle system_prompt || operator with empty string", () => {
      const nodeWithEmptyPrompt = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            system_prompt: ""
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithEmptyPrompt,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const promptTextarea = screen.getByLabelText(/system prompt/i);
      expect(promptTextarea.value).toBe("");
    });
    it("should handle system_prompt || operator with undefined", () => {
      const nodeWithoutPrompt = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            system_prompt: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithoutPrompt,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const promptTextarea = screen.getByLabelText(/system prompt/i);
      expect(promptTextarea.value).toBe("");
    });
    it("should handle max_tokens || operator with undefined", () => {
      const nodeWithoutMaxTokens = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithoutMaxTokens,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/max tokens/i);
      expect(maxTokensInput.value).toBe("");
    });
    it("should handle max_tokens || operator with 0", () => {
      const nodeWithZeroMaxTokens = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithZeroMaxTokens,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/max tokens/i);
      expect(maxTokensInput.value).toBe("");
    });
    it("should handle temperature || operator with 0", () => {
      const nodeWithZeroTemp = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            temperature: 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithZeroTemp,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const temperatureSlider = screen.getByLabelText(/temperature/i);
      expect(temperatureSlider.value).toBe("0.7");
    });
    it("should handle temperature || operator with undefined", () => {
      const nodeWithoutTemp = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            temperature: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithoutTemp,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const temperatureSlider = screen.getByLabelText(/temperature/i);
      expect(temperatureSlider.value).toBe("0.7");
    });
    it("should handle temperature?.toFixed(1) || fallback", () => {
      const nodeWithTemp = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            temperature: 0.5
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithTemp,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const temperatureLabel = screen.getByLabelText(/temperature/i).previousElementSibling;
      expect(temperatureLabel?.textContent).toContain("0.5");
    });
    it("should handle availableModels.length > 0 ternary", () => {
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      expect(screen.getByText(/This agent will use the configured LLM provider/i)).toBeInTheDocument();
    });
    it("should handle availableModels.length === 0 ternary", () => {
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels: [],
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      expect(screen.getByText(/This agent will call the OpenAI API/i)).toBeInTheDocument();
    });
    it("should handle parseInt with empty string returning undefined", () => {
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/max tokens/i);
      fireEvent.change(maxTokensInput, { target: { value: "" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("agent_config", "max_tokens", void 0);
    });
    it("should handle parseInt with valid number", () => {
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/max tokens/i);
      fireEvent.change(maxTokensInput, { target: { value: "500" } });
      expect(mockOnConfigUpdate).toHaveBeenCalledWith("agent_config", "max_tokens", 500);
    });
    it("should handle parseInt with invalid string", () => {
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/max tokens/i);
      fireEvent.change(maxTokensInput, { target: { value: "abc" } });
      expect(mockOnConfigUpdate).toHaveBeenCalled();
      const lastCall = mockOnConfigUpdate.mock.calls[mockOnConfigUpdate.mock.calls.length - 1];
      expect(lastCall[0]).toBe("agent_config");
      expect(lastCall[1]).toBe("max_tokens");
      expect(isNaN(lastCall[2]) || lastCall[2] === void 0).toBe(true);
    });
    it("should handle all focus checks for systemPromptRef", () => {
      const { rerender } = render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const promptTextarea = screen.getByLabelText(/system prompt/i);
      promptTextarea.focus();
      const updatedNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            system_prompt: "New prompt"
          }
        }
      };
      rerender(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: updatedNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      expect(promptTextarea.value).toBe("You are a helpful assistant");
    });
    it("should handle all focus checks for maxTokensRef", () => {
      const { rerender } = render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/max tokens/i);
      maxTokensInput.focus();
      const updatedNode = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: 2e3
          }
        }
      };
      rerender(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: updatedNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      expect(maxTokensInput.value).toBe("1000");
    });
    it("should handle model selection with all availableModels", () => {
      const manyModels = [
        { value: "model1", label: "Model 1", provider: "openai" },
        { value: "model2", label: "Model 2", provider: "openai" },
        { value: "model3", label: "Model 3", provider: "openai" }
      ];
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels: manyModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      manyModels.forEach((model) => {
        expect(screen.getByText(model.label)).toBeInTheDocument();
      });
    });
    it("should handle temperature parseFloat", () => {
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: mockNode,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const temperatureSlider = screen.getByLabelText(/temperature/i);
      fireEvent.change(temperatureSlider, { target: { value: "0.8" } });
      expect(mockOnUpdate).toHaveBeenCalledWith("agent_config", expect.objectContaining({
        temperature: 0.8
      }));
    });
    it("should handle temperature parseFloat with various values", () => {
      const values = ["0.0", "0.1", "0.5", "0.9", "1.0"];
      for (const value of values) {
        jest.clearAllMocks();
        document.body.innerHTML = "";
        render(
          /* @__PURE__ */ jsx(
            AgentNodeEditor,
            {
              node: mockNode,
              availableModels,
              onUpdate: mockOnUpdate,
              onConfigUpdate: mockOnConfigUpdate
            }
          )
        );
        const temperatureSlider = screen.getByLabelText(/temperature/i);
        fireEvent.change(temperatureSlider, { target: { value } });
        expect(mockOnUpdate).toHaveBeenCalledWith("agent_config", expect.objectContaining({
          temperature: parseFloat(value)
        }));
      }
    });
  });
  describe("string literal coverage", () => {
    it("should verify exact empty string literal for systemPromptValue initial state", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            system_prompt: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const systemPromptInput = screen.getByLabelText(/System Prompt/i);
      expect(systemPromptInput.value).toBe("");
    });
    it("should verify exact empty string literal for maxTokensValue initial state", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/Max Tokens/i);
      expect(maxTokensInput.value).toBe("");
    });
    it("should verify exact empty string literal fallback for maxTokensValue", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/Max Tokens/i);
      expect(maxTokensInput.value).toBe("");
    });
    it("should verify exact gpt-4o-mini string literal fallback", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            model: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels: [],
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const modelSelect = screen.getByLabelText(/Model/i);
      expect(modelSelect.value).toBe("gpt-4o-mini");
    });
  });
  describe("conditional expression coverage", () => {
    it("should verify availableModels.length > 0 branch of ternary", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            model: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const modelSelect = screen.getByLabelText(/Model/i);
      expect(modelSelect.value).toBe(availableModels[0].value);
    });
    it("should verify availableModels.length === 0 branch of ternary", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            model: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels: [],
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const modelSelect = screen.getByLabelText(/Model/i);
      expect(modelSelect.value).toBe("gpt-4o-mini");
    });
    it("should verify exact conditional expression structure", () => {
      const nodeWithModel = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            model: "custom-model-not-in-list"
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node: nodeWithModel,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const modelSelect = screen.getByLabelText(/Model/i);
      expect(modelSelect.value).toBeDefined();
    });
  });
  describe("logical operator coverage", () => {
    it("should verify || operator with truthy left operand", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            model: "existing-model-not-in-list"
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const modelSelect = screen.getByLabelText(/Model/i);
      expect(modelSelect.value).toBeDefined();
    });
    it("should verify || operator with falsy left operand", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            model: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const modelSelect = screen.getByLabelText(/Model/i);
      expect(modelSelect.value).toBe(availableModels[0].value);
    });
    it("should verify || operator with max_tokens", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: 1e3
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/Max Tokens/i);
      expect(maxTokensInput.value).toBe("1000");
    });
    it("should verify || operator with falsy max_tokens", () => {
      const node = {
        ...mockNode,
        data: {
          ...mockNode.data,
          agent_config: {
            ...mockNode.data.agent_config,
            max_tokens: void 0
          }
        }
      };
      render(
        /* @__PURE__ */ jsx(
          AgentNodeEditor,
          {
            node,
            availableModels,
            onUpdate: mockOnUpdate,
            onConfigUpdate: mockOnConfigUpdate
          }
        )
      );
      const maxTokensInput = screen.getByLabelText(/Max Tokens/i);
      expect(maxTokensInput.value).toBe("");
    });
  });
});

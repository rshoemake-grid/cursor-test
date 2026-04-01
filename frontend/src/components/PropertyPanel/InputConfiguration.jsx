import { jsx, jsxs } from "react/jsx-runtime";
import { Plus, Trash2 } from "lucide-react";
import { coalesceString } from "../../utils/nullCoalescing";
import { isNonEmptyArray, isNotEmpty } from "../../utils/nullChecks";
function InputConfiguration({
  inputs,
  showAddInput,
  onAddInput,
  onRemoveInput,
  onUpdateInput,
  onShowAddInput
}) {
  const safeInputs = isNonEmptyArray(inputs) ? inputs : [];
  return /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
    /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-3", children: [
      /* @__PURE__ */ jsx("label", { className: "block text-sm font-semibold text-gray-900", children: "Inputs" }),
      /* @__PURE__ */ jsxs(
        "button",
        {
          onClick: () => onShowAddInput(true),
          className: "text-xs px-2 py-1 bg-primary-100 text-primary-700 rounded hover:bg-primary-200 flex items-center gap-1",
          "aria-label": "Add input to node",
          "data-testid": "add-input-button",
          children: [
            /* @__PURE__ */ jsx(Plus, { className: "w-3 h-3" }),
            "Add Input"
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsx("div", { className: "space-y-2 mb-3", children: safeInputs.map((input, index) => /* @__PURE__ */ jsxs("div", { className: "bg-gray-50 p-3 rounded border border-gray-200", children: [
      /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between mb-2", children: [
        /* @__PURE__ */ jsx("span", { className: "text-xs font-medium text-gray-700", children: input.name }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => onRemoveInput(index),
            className: "text-red-600 hover:bg-red-50 p-1 rounded",
            "aria-label": `Remove input ${input.name}`,
            children: /* @__PURE__ */ jsx(Trash2, { className: "w-3 h-3" })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "text-xs space-y-1", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Source Node:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: coalesceString(input.source_node, "(workflow variable)"),
              onChange: (e) => {
                const value = e.target.value;
                onUpdateInput(
                  index,
                  "source_node",
                  isNotEmpty(value) ? value : void 0
                );
              },
              placeholder: "node_id or leave blank",
              className: "w-full mt-1 px-2 py-1 text-xs border rounded"
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("span", { className: "text-gray-500", children: "Source Field:" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: isNotEmpty(input.source_field) ? input.source_field : "output",
              onChange: (e) => onUpdateInput(index, "source_field", e.target.value),
              placeholder: "output",
              className: "w-full mt-1 px-2 py-1 text-xs border rounded"
            }
          )
        ] })
      ] })
    ] }, index)) }),
    showAddInput && /* @__PURE__ */ jsx(
      "div",
      {
        className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50",
        role: "dialog",
        "aria-modal": "true",
        "aria-labelledby": "add-input-title",
        children: /* @__PURE__ */ jsxs("div", { className: "bg-white rounded-lg p-4 w-96", children: [
          /* @__PURE__ */ jsx("h4", { id: "add-input-title", className: "font-semibold mb-3", "data-testid": "add-input-modal-title", children: "Add Input" }),
          /* @__PURE__ */ jsxs(
            "form",
            {
              onSubmit: (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onAddInput(
                  formData.get("inputName"),
                  formData.get("sourceNode"),
                  formData.get("sourceField")
                );
              },
              children: [
                /* @__PURE__ */ jsxs("div", { className: "space-y-3", children: [
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Input Name *" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        name: "inputName",
                        type: "text",
                        required: true,
                        placeholder: "e.g., topic, text, data",
                        className: "w-full px-2 py-1 text-sm border rounded"
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Name this agent will use to access the data" })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Source Node ID (optional)" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        name: "sourceNode",
                        type: "text",
                        placeholder: "Leave blank for workflow input",
                        className: "w-full px-2 py-1 text-sm border rounded"
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Get data from another node's output. Leave blank to get from workflow input variables." })
                  ] }),
                  /* @__PURE__ */ jsxs("div", { children: [
                    /* @__PURE__ */ jsx("label", { className: "block text-xs font-medium text-gray-700 mb-1", children: "Source Field" }),
                    /* @__PURE__ */ jsx(
                      "input",
                      {
                        name: "sourceField",
                        type: "text",
                        defaultValue: "output",
                        placeholder: "output",
                        className: "w-full px-2 py-1 text-sm border rounded"
                      }
                    ),
                    /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Which field to get from the source (usually 'output')" })
                  ] })
                ] }),
                /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2 mt-4", children: [
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "button",
                      onClick: () => onShowAddInput(false),
                      className: "px-3 py-1 text-sm text-gray-700 hover:bg-gray-100 rounded",
                      "aria-label": "Cancel adding input",
                      children: "Cancel"
                    }
                  ),
                  /* @__PURE__ */ jsx(
                    "button",
                    {
                      type: "submit",
                      className: "px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700",
                      "aria-label": "Add input to node",
                      "data-testid": "add-input-submit-button",
                      children: "Add Input"
                    }
                  )
                ] })
              ]
            }
          )
        ] })
      }
    ),
    /* @__PURE__ */ jsx("div", { className: "text-xs text-gray-500 bg-blue-50 p-2 rounded", children: "\u{1F4A1} Inputs connect this node to data from previous nodes or workflow variables" })
  ] });
}
export {
  InputConfiguration
};

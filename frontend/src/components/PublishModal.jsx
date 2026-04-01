import { jsx, jsxs } from "react/jsx-runtime";
import { X } from "lucide-react";
import { TEMPLATE_CATEGORIES, TEMPLATE_DIFFICULTIES, formatCategory, formatDifficulty } from "../config/templateConstants";
function PublishModal({
  isOpen,
  form,
  isPublishing,
  onClose,
  onFormChange,
  onSubmit
}) {
  if (!isOpen) return null;
  return /* @__PURE__ */ jsx("div", { className: "fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40", children: /* @__PURE__ */ jsxs(
    "form",
    {
      onSubmit: (e) => {
        e.preventDefault();
        onSubmit(e);
      },
      className: "bg-white rounded-xl shadow-lg max-w-md w-full p-6 space-y-4",
      children: [
        /* @__PURE__ */ jsxs("div", { className: "flex items-center justify-between", children: [
          /* @__PURE__ */ jsx("h3", { className: "text-lg font-semibold text-gray-900", children: "Publish to Marketplace" }),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "text-gray-500 hover:text-gray-700",
              children: /* @__PURE__ */ jsx(X, { className: "w-5 h-5" })
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Workflow Name" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.name,
              onChange: (e) => onFormChange("name", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              required: true
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Description (optional)" }),
          /* @__PURE__ */ jsx(
            "textarea",
            {
              value: form.description,
              onChange: (e) => onFormChange("description", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              rows: 3
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Category" }),
          /* @__PURE__ */ jsx(
            "select",
            {
              value: form.category,
              onChange: (e) => onFormChange("category", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              children: TEMPLATE_CATEGORIES.map((category) => /* @__PURE__ */ jsx("option", { value: category, children: formatCategory(category) }, category))
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex gap-4", children: [
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Difficulty" }),
            /* @__PURE__ */ jsx(
              "select",
              {
                value: form.difficulty,
                onChange: (e) => onFormChange("difficulty", e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                children: TEMPLATE_DIFFICULTIES.map((diff) => /* @__PURE__ */ jsx("option", { value: diff, children: formatDifficulty(diff) }, diff))
              }
            )
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "flex-1", children: [
            /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Estimated Time" }),
            /* @__PURE__ */ jsx(
              "input",
              {
                type: "text",
                value: form.estimated_time,
                onChange: (e) => onFormChange("estimated_time", e.target.value),
                className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
                placeholder: "e.g. 30 minutes"
              }
            )
          ] })
        ] }),
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Tags (comma separated)" }),
          /* @__PURE__ */ jsx(
            "input",
            {
              type: "text",
              value: form.tags,
              onChange: (e) => onFormChange("tags", e.target.value),
              className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
              placeholder: "automation, ai, ... "
            }
          )
        ] }),
        /* @__PURE__ */ jsxs("div", { className: "flex justify-end gap-2", children: [
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "button",
              onClick: onClose,
              className: "px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50",
              children: "Cancel"
            }
          ),
          /* @__PURE__ */ jsx(
            "button",
            {
              type: "submit",
              disabled: isPublishing,
              className: "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-60 flex items-center gap-2",
              children: isPublishing ? "Publishing..." : "Publish"
            }
          )
        ] })
      ]
    }
  ) });
}
export {
  PublishModal
};

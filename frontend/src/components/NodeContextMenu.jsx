import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { Trash2, Copy, Scissors, Clipboard, Plus, Upload } from "lucide-react";
import { useReactFlow } from "@xyflow/react";
function ContextMenu({
  nodeId,
  edgeId,
  node,
  x,
  y,
  onClose,
  onDelete,
  onCopy,
  onCut,
  onPaste,
  onAddToAgentNodes,
  onAddToToolNodes,
  onSendToMarketplace,
  canPaste = false
}) {
  const { deleteElements } = useReactFlow();
  const handleDelete = () => {
    if (nodeId) {
      deleteElements({ nodes: [{ id: nodeId }] });
    } else if (edgeId) {
      deleteElements({ edges: [{ id: edgeId }] });
    }
    if (onDelete) {
      onDelete();
    }
    onClose();
  };
  const handleCopy = () => {
    if (node && onCopy) {
      onCopy(node);
    }
    onClose();
  };
  const handleCut = () => {
    if (node && onCut) {
      onCut(node);
    }
    onClose();
  };
  const handlePaste = () => {
    if (onPaste) {
      onPaste();
    }
    onClose();
  };
  const handleAddToAgentNodes = () => {
    if (node && onAddToAgentNodes) {
      onAddToAgentNodes(node);
    }
    onClose();
  };
  const handleAddToToolNodes = () => {
    if (node && onAddToToolNodes) {
      onAddToToolNodes(node);
    }
    onClose();
  };
  const handleSendToMarketplace = () => {
    if (node && onSendToMarketplace) {
      onSendToMarketplace(node);
    }
    onClose();
  };
  const isAgentNode = node?.type === "agent";
  const isToolNode = node?.type === "tool";
  const label = nodeId ? "Delete Node" : "Delete Connection";
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: "fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[180px]",
      style: {
        left: `${x}px`,
        top: `${y}px`
      },
      onClick: (e) => e.stopPropagation(),
      children: [
        nodeId && /* @__PURE__ */ jsxs(Fragment, { children: [
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleCopy,
              className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors",
              children: [
                /* @__PURE__ */ jsx(Copy, { className: "w-4 h-4" }),
                "Copy"
              ]
            }
          ),
          /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handleCut,
              className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors",
              children: [
                /* @__PURE__ */ jsx(Scissors, { className: "w-4 h-4" }),
                "Cut"
              ]
            }
          ),
          canPaste && /* @__PURE__ */ jsxs(
            "button",
            {
              onClick: handlePaste,
              className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors",
              children: [
                /* @__PURE__ */ jsx(Clipboard, { className: "w-4 h-4" }),
                "Paste"
              ]
            }
          ),
          isAgentNode && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleAddToAgentNodes,
                className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-t border-gray-200 mt-1 pt-2",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                  "Add to Agent Nodes"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleSendToMarketplace,
                className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
                  "Send to Marketplace"
                ]
              }
            )
          ] }),
          isToolNode && /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleAddToToolNodes,
                className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors border-t border-gray-200 mt-1 pt-2",
                children: [
                  /* @__PURE__ */ jsx(Plus, { className: "w-4 h-4" }),
                  "Add to Tool Nodes"
                ]
              }
            ),
            /* @__PURE__ */ jsxs(
              "button",
              {
                onClick: handleSendToMarketplace,
                className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition-colors",
                children: [
                  /* @__PURE__ */ jsx(Upload, { className: "w-4 h-4" }),
                  "Send to Marketplace"
                ]
              }
            )
          ] }),
          /* @__PURE__ */ jsx("div", { className: "border-t border-gray-200 my-1" })
        ] }),
        /* @__PURE__ */ jsxs(
          "button",
          {
            onClick: handleDelete,
            className: "w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors",
            children: [
              /* @__PURE__ */ jsx(Trash2, { className: "w-4 h-4" }),
              label
            ]
          }
        )
      ]
    }
  );
}
export {
  ContextMenu as default
};

import { jsx, jsxs } from "react/jsx-runtime";
import GCPBucketEditor from "./input/GCPBucketEditor";
import AWSS3Editor from "./input/AWSS3Editor";
import GCPPubSubEditor from "./input/GCPPubSubEditor";
import LocalFileSystemEditor from "./input/LocalFileSystemEditor";
import { NODE_TYPE_DISPLAY_NAMES } from "./input/inputEditorConstants";
function InputNodeEditor({
  node,
  onConfigUpdate
}) {
  switch (node.type) {
    case "gcp_bucket": {
      const typedNode = node;
      return /* @__PURE__ */ jsx(GCPBucketEditor, { node: typedNode, onConfigUpdate });
    }
    case "aws_s3": {
      const typedNode = node;
      return /* @__PURE__ */ jsx(AWSS3Editor, { node: typedNode, onConfigUpdate });
    }
    case "gcp_pubsub": {
      const typedNode = node;
      return /* @__PURE__ */ jsx(GCPPubSubEditor, { node: typedNode, onConfigUpdate });
    }
    case "local_filesystem": {
      const typedNode = node;
      return /* @__PURE__ */ jsx(LocalFileSystemEditor, { node: typedNode, onConfigUpdate });
    }
    case "database":
    case "firebase":
    case "bigquery": {
      const displayName = node.type === "database" ? NODE_TYPE_DISPLAY_NAMES.DATABASE : node.type === "firebase" ? NODE_TYPE_DISPLAY_NAMES.FIREBASE : NODE_TYPE_DISPLAY_NAMES.BIGQUERY;
      return /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
        /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-900 mb-3", children: displayName }),
        /* @__PURE__ */ jsxs("p", { className: "text-xs text-gray-500", children: [
          "Configuration for ",
          node.type,
          " nodes is handled in PropertyPanel."
        ] })
      ] });
    }
    default:
      return null;
  }
}
export {
  InputNodeEditor as default
};

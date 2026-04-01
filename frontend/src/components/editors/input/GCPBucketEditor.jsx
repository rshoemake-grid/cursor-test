import { jsx, jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import { useInputFieldSync, useInputFieldSyncSimple } from "../../../hooks/utils/useInputFieldSync";
import { INPUT_MODE, EMPTY_STRING } from "../../../hooks/utils/inputDefaults";
import { createTextInputHandler, createSelectHandler } from "../../../hooks/utils/inputEditorHelpers";
import { CONFIG_FIELD } from "./inputEditorConstants";
function GCPBucketEditor({
  node,
  onConfigUpdate
}) {
  const inputConfig = node.data.input_config || {};
  const bucketNameRef = useRef(null);
  const objectPathRef = useRef(null);
  const gcpCredentialsRef = useRef(null);
  const [bucketNameValue, setBucketNameValue] = useInputFieldSync(
    bucketNameRef,
    inputConfig.bucket_name,
    EMPTY_STRING
  );
  const [objectPathValue, setObjectPathValue] = useInputFieldSync(
    objectPathRef,
    inputConfig.object_path,
    EMPTY_STRING
  );
  const [gcpCredentialsValue, setGcpCredentialsValue] = useInputFieldSync(
    gcpCredentialsRef,
    inputConfig.credentials,
    EMPTY_STRING
  );
  const [modeValue, setModeValue] = useInputFieldSyncSimple(
    inputConfig.mode,
    INPUT_MODE.READ
  );
  return /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
    /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-900 mb-3", children: "GCP Bucket Configuration" }),
    /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "gcp-bucket-mode", className: "block text-sm font-medium text-gray-700 mb-1", children: "Mode" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "gcp-bucket-mode",
          value: modeValue,
          onChange: createSelectHandler(setModeValue, onConfigUpdate, CONFIG_FIELD, "mode"),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "Select bucket operation mode",
          children: [
            /* @__PURE__ */ jsx("option", { value: INPUT_MODE.READ, children: "Read from bucket" }),
            /* @__PURE__ */ jsx("option", { value: INPUT_MODE.WRITE, children: "Write to bucket" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Read: Fetch data from bucket. Write: Save data to bucket." })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "gcp-bucket-name", className: "block text-sm font-medium text-gray-700 mb-1", children: "Bucket Name" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "gcp-bucket-name",
          ref: bucketNameRef,
          type: "text",
          value: bucketNameValue,
          onChange: createTextInputHandler(setBucketNameValue, onConfigUpdate, CONFIG_FIELD, "bucket_name"),
          placeholder: "my-bucket-name",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "GCP bucket name"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "gcp-object-path", className: "block text-sm font-medium text-gray-700 mb-1", children: "Object Path" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "gcp-object-path",
          ref: objectPathRef,
          type: "text",
          value: objectPathValue,
          onChange: createTextInputHandler(setObjectPathValue, onConfigUpdate, CONFIG_FIELD, "object_path"),
          placeholder: "path/to/file.txt or leave blank for all objects",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "Object path in bucket"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "gcp-credentials", className: "block text-sm font-medium text-gray-700 mb-1", children: "GCP Credentials (JSON)" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          id: "gcp-credentials",
          ref: gcpCredentialsRef,
          value: gcpCredentialsValue,
          onChange: createTextInputHandler(setGcpCredentialsValue, onConfigUpdate, CONFIG_FIELD, "credentials"),
          rows: 3,
          placeholder: "Paste GCP service account JSON credentials",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-primary-500",
          "aria-label": "GCP service account credentials"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Service account JSON credentials for GCP access" })
    ] })
  ] });
}
export {
  GCPBucketEditor as default
};

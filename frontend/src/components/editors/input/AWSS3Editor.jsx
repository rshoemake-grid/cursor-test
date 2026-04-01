import { jsx, jsxs } from "react/jsx-runtime";
import { useRef } from "react";
import { useInputFieldSync, useInputFieldSyncSimple } from "../../../hooks/utils/useInputFieldSync";
import { INPUT_MODE, INPUT_REGION, EMPTY_STRING } from "../../../hooks/utils/inputDefaults";
import { createTextInputHandler, createSelectHandler } from "../../../hooks/utils/inputEditorHelpers";
import { CONFIG_FIELD } from "./inputEditorConstants";
function AWSS3Editor({
  node,
  onConfigUpdate
}) {
  const inputConfig = node.data.input_config || {};
  const bucketNameRef = useRef(null);
  const objectKeyRef = useRef(null);
  const accessKeyIdRef = useRef(null);
  const secretKeyRef = useRef(null);
  const regionRef = useRef(null);
  const [bucketNameValue, setBucketNameValue] = useInputFieldSync(
    bucketNameRef,
    inputConfig.bucket_name,
    EMPTY_STRING
  );
  const [objectKeyValue, setObjectKeyValue] = useInputFieldSync(
    objectKeyRef,
    inputConfig.object_key,
    EMPTY_STRING
  );
  const [accessKeyIdValue, setAccessKeyIdValue] = useInputFieldSync(
    accessKeyIdRef,
    inputConfig.access_key_id,
    EMPTY_STRING
  );
  const [secretKeyValue, setSecretKeyValue] = useInputFieldSync(
    secretKeyRef,
    inputConfig.secret_access_key,
    EMPTY_STRING
  );
  const [regionValue, setRegionValue] = useInputFieldSync(
    regionRef,
    inputConfig.region,
    INPUT_REGION.DEFAULT
  );
  const [modeValue, setModeValue] = useInputFieldSyncSimple(
    inputConfig.mode,
    INPUT_MODE.READ
  );
  return /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
    /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-900 mb-3", children: "AWS S3 Configuration" }),
    /* @__PURE__ */ jsxs("div", { className: "mb-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "aws-s3-mode", className: "block text-sm font-medium text-gray-700 mb-1", children: "Mode" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "aws-s3-mode",
          value: modeValue,
          onChange: createSelectHandler(setModeValue, onConfigUpdate, CONFIG_FIELD, "mode"),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "Select S3 operation mode",
          children: [
            /* @__PURE__ */ jsx("option", { value: INPUT_MODE.READ, children: "Read from bucket" }),
            /* @__PURE__ */ jsx("option", { value: INPUT_MODE.WRITE, children: "Write to bucket" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Read: Fetch data from bucket. Write: Save data to bucket." })
    ] }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "aws-bucket-name", className: "block text-sm font-medium text-gray-700 mb-1", children: "Bucket Name" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "aws-bucket-name",
          ref: bucketNameRef,
          type: "text",
          value: bucketNameValue,
          onChange: createTextInputHandler(setBucketNameValue, onConfigUpdate, CONFIG_FIELD, "bucket_name"),
          placeholder: "my-bucket-name",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "AWS S3 bucket name"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "aws-object-key", className: "block text-sm font-medium text-gray-700 mb-1", children: "Object Key" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "aws-object-key",
          ref: objectKeyRef,
          type: "text",
          value: objectKeyValue,
          onChange: createTextInputHandler(setObjectKeyValue, onConfigUpdate, CONFIG_FIELD, "object_key"),
          placeholder: "path/to/file.txt or leave blank for all objects",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "S3 object key"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "aws-access-key-id", className: "block text-sm font-medium text-gray-700 mb-1", children: "AWS Access Key ID" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "aws-access-key-id",
          ref: accessKeyIdRef,
          type: "text",
          value: accessKeyIdValue,
          onChange: createTextInputHandler(setAccessKeyIdValue, onConfigUpdate, CONFIG_FIELD, "access_key_id"),
          placeholder: "AKIAIOSFODNN7EXAMPLE",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "AWS access key ID"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "aws-secret-key", className: "block text-sm font-medium text-gray-700 mb-1", children: "AWS Secret Access Key" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "aws-secret-key",
          ref: secretKeyRef,
          type: "password",
          value: secretKeyValue,
          onChange: createTextInputHandler(setSecretKeyValue, onConfigUpdate, CONFIG_FIELD, "secret_access_key"),
          placeholder: "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "AWS secret access key"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "aws-region", className: "block text-sm font-medium text-gray-700 mb-1", children: "AWS Region" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "aws-region",
          ref: regionRef,
          type: "text",
          value: regionValue,
          onChange: createTextInputHandler(setRegionValue, onConfigUpdate, CONFIG_FIELD, "region"),
          placeholder: INPUT_REGION.DEFAULT,
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          "aria-label": "AWS region"
        }
      )
    ] })
  ] });
}
export {
  AWSS3Editor as default
};

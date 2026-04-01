import { Fragment, jsx, jsxs } from "react/jsx-runtime";
function BigQueryNodeEditor({
  node,
  onConfigUpdate
}) {
  const inputConfig = node.data.input_config || {};
  return /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
    /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-900 mb-3", children: "BigQuery Configuration" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "bigquery-project-id", className: "block text-sm font-medium text-gray-700 mb-1", children: "Project ID" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "bigquery-project-id",
          type: "text",
          value: inputConfig.project_id || "",
          onChange: (e) => onConfigUpdate("input_config", "project_id", e.target.value),
          placeholder: "my-gcp-project",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Your Google Cloud project ID" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "bigquery-mode", className: "block text-sm font-medium text-gray-700 mb-1", children: "Connection Mode" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "bigquery-mode",
          value: inputConfig.mode || "read",
          onChange: (e) => onConfigUpdate("input_config", "mode", e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          children: [
            /* @__PURE__ */ jsx("option", { value: "read", children: "Read (Query)" }),
            /* @__PURE__ */ jsx("option", { value: "write", children: "Write (Insert/Update)" })
          ]
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "bigquery-dataset", className: "block text-sm font-medium text-gray-700 mb-1", children: "Dataset" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "bigquery-dataset",
          type: "text",
          value: inputConfig.dataset || "",
          onChange: (e) => onConfigUpdate("input_config", "dataset", e.target.value),
          placeholder: "my_dataset",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "BigQuery dataset name" })
    ] }),
    inputConfig.mode === "read" && /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "bigquery-query", className: "block text-sm font-medium text-gray-700 mb-1", children: "SQL Query" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          id: "bigquery-query",
          value: inputConfig.query || "",
          onChange: (e) => onConfigUpdate("input_config", "query", e.target.value),
          placeholder: "SELECT * FROM `project.dataset.table` LIMIT 100",
          rows: 6,
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Standard SQL query to execute" })
    ] }),
    inputConfig.mode === "write" && /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "bigquery-table", className: "block text-sm font-medium text-gray-700 mb-1", children: "Table" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            id: "bigquery-table",
            type: "text",
            value: inputConfig.table || "",
            onChange: (e) => onConfigUpdate("input_config", "table", e.target.value),
            placeholder: "my_table",
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Target table for insert/update operations" })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
        /* @__PURE__ */ jsx("label", { htmlFor: "bigquery-write-disposition", className: "block text-sm font-medium text-gray-700 mb-1", children: "Write Disposition" }),
        /* @__PURE__ */ jsxs(
          "select",
          {
            id: "bigquery-write-disposition",
            value: inputConfig.write_disposition || "append",
            onChange: (e) => onConfigUpdate("input_config", "write_disposition", e.target.value),
            className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
            children: [
              /* @__PURE__ */ jsx("option", { value: "append", children: "Append" }),
              /* @__PURE__ */ jsx("option", { value: "truncate", children: "Truncate and Write" }),
              /* @__PURE__ */ jsx("option", { value: "merge", children: "Merge (Upsert)" })
            ]
          }
        ),
        /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "How to handle existing data in the table" })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "bigquery-location", className: "block text-sm font-medium text-gray-700 mb-1", children: "Location (optional)" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "bigquery-location",
          type: "text",
          value: inputConfig.location || "",
          onChange: (e) => onConfigUpdate("input_config", "location", e.target.value),
          placeholder: "US or EU",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "BigQuery dataset location (US, EU, etc.). Leave blank for default." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "bigquery-credentials", className: "block text-sm font-medium text-gray-700 mb-1", children: "Service Account Credentials (JSON)" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          id: "bigquery-credentials",
          value: inputConfig.credentials || "",
          onChange: (e) => onConfigUpdate("input_config", "credentials", e.target.value),
          placeholder: '{"type": "service_account", ...}',
          rows: 4,
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Google Cloud service account JSON credentials. Leave blank to use default credentials." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-900 font-medium mb-1", children: "\u{1F4CA} BigQuery Node" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-700", children: "Query and write data to Google BigQuery data warehouse. Supports standard SQL queries and data loading." })
    ] })
  ] });
}
export {
  BigQueryNodeEditor as default
};

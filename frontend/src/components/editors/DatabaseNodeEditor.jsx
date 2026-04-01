import { jsx, jsxs } from "react/jsx-runtime";
function DatabaseNodeEditor({
  node,
  onConfigUpdate
}) {
  const inputConfig = node.data.input_config || {};
  return /* @__PURE__ */ jsxs("div", { className: "border-t pt-4", children: [
    /* @__PURE__ */ jsx("h4", { className: "text-sm font-semibold text-gray-900 mb-3", children: "Database Configuration" }),
    /* @__PURE__ */ jsxs("div", { children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-type", className: "block text-sm font-medium text-gray-700 mb-1", children: "Database Type" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "database-type",
          value: inputConfig.database_type || "postgresql",
          onChange: (e) => onConfigUpdate("input_config", "database_type", e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          children: [
            /* @__PURE__ */ jsx("option", { value: "postgresql", children: "PostgreSQL" }),
            /* @__PURE__ */ jsx("option", { value: "mysql", children: "MySQL" }),
            /* @__PURE__ */ jsx("option", { value: "sqlite", children: "SQLite" }),
            /* @__PURE__ */ jsx("option", { value: "mongodb", children: "MongoDB" }),
            /* @__PURE__ */ jsx("option", { value: "mssql", children: "Microsoft SQL Server" }),
            /* @__PURE__ */ jsx("option", { value: "oracle", children: "Oracle" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Type of database to connect to" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-mode", className: "block text-sm font-medium text-gray-700 mb-1", children: "Connection Mode" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "database-mode",
          value: inputConfig.mode || "read",
          onChange: (e) => onConfigUpdate("input_config", "mode", e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          children: [
            /* @__PURE__ */ jsx("option", { value: "read", children: "Read" }),
            /* @__PURE__ */ jsx("option", { value: "write", children: "Write" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Whether to read from or write to the database" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-connection-string", className: "block text-sm font-medium text-gray-700 mb-1", children: "Connection String (optional)" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          id: "database-connection-string",
          value: inputConfig.connection_string || "",
          onChange: (e) => onConfigUpdate("input_config", "connection_string", e.target.value),
          placeholder: "postgresql://user:password@host:port/database",
          rows: 2,
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Full connection string. If provided, individual connection fields are ignored." })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "border-t border-gray-200 pt-3 mt-3", children: /* @__PURE__ */ jsx("p", { className: "text-xs font-semibold text-gray-700 mb-2", children: "Or specify individual fields:" }) }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-host", className: "block text-sm font-medium text-gray-700 mb-1", children: "Host" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "database-host",
          type: "text",
          value: inputConfig.host || "",
          onChange: (e) => onConfigUpdate("input_config", "host", e.target.value),
          placeholder: "localhost",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-port", className: "block text-sm font-medium text-gray-700 mb-1", children: "Port" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "database-port",
          type: "number",
          value: inputConfig.port || "",
          onChange: (e) => onConfigUpdate("input_config", "port", e.target.value ? parseInt(e.target.value) : void 0),
          placeholder: "5432",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-name", className: "block text-sm font-medium text-gray-700 mb-1", children: "Database Name" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "database-name",
          type: "text",
          value: inputConfig.database_name || "",
          onChange: (e) => onConfigUpdate("input_config", "database_name", e.target.value),
          placeholder: "mydatabase",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-username", className: "block text-sm font-medium text-gray-700 mb-1", children: "Username" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "database-username",
          type: "text",
          value: inputConfig.username || "",
          onChange: (e) => onConfigUpdate("input_config", "username", e.target.value),
          placeholder: "dbuser",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        }
      )
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-password", className: "block text-sm font-medium text-gray-700 mb-1", children: "Password" }),
      /* @__PURE__ */ jsx(
        "input",
        {
          id: "database-password",
          type: "password",
          value: inputConfig.password || "",
          onChange: (e) => onConfigUpdate("input_config", "password", e.target.value),
          placeholder: "\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022",
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Password will be stored securely" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-query", className: "block text-sm font-medium text-gray-700 mb-1", children: "Query / SQL Statement" }),
      /* @__PURE__ */ jsx(
        "textarea",
        {
          id: "database-query",
          value: inputConfig.query || "",
          onChange: (e) => onConfigUpdate("input_config", "query", e.target.value),
          placeholder: "SELECT * FROM users WHERE id = ?",
          rows: 4,
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 font-mono text-sm"
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "SQL query to execute. Use ? for parameterized queries." })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "mt-3", children: [
      /* @__PURE__ */ jsx("label", { htmlFor: "database-ssl-mode", className: "block text-sm font-medium text-gray-700 mb-1", children: "SSL Mode" }),
      /* @__PURE__ */ jsxs(
        "select",
        {
          id: "database-ssl-mode",
          value: inputConfig.ssl_mode || "prefer",
          onChange: (e) => onConfigUpdate("input_config", "ssl_mode", e.target.value),
          className: "w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500",
          children: [
            /* @__PURE__ */ jsx("option", { value: "disable", children: "Disable" }),
            /* @__PURE__ */ jsx("option", { value: "allow", children: "Allow" }),
            /* @__PURE__ */ jsx("option", { value: "prefer", children: "Prefer" }),
            /* @__PURE__ */ jsx("option", { value: "require", children: "Require" }),
            /* @__PURE__ */ jsx("option", { value: "verify-ca", children: "Verify CA" }),
            /* @__PURE__ */ jsx("option", { value: "verify-full", children: "Verify Full" })
          ]
        }
      ),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-gray-500 mt-1", children: "SSL/TLS connection mode" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "bg-blue-50 border border-blue-200 rounded-lg p-3 mt-3", children: [
      /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-900 font-medium mb-1", children: "\u{1F4BE} Database Node" }),
      /* @__PURE__ */ jsx("p", { className: "text-xs text-blue-700", children: "This node connects to a database and executes SQL queries. Use parameterized queries (?) for security." })
    ] })
  ] });
}
export {
  DatabaseNodeEditor as default
};

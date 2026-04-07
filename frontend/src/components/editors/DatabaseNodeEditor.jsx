import {
  EditorSectionRoot,
  EditorSectionTitle,
  EditorFieldGroup,
  EditorLabel,
  EditorSelect,
  EditorInput,
  EditorTextarea,
  EditorHint,
  EditorSubsectionDivider,
  EditorSubsectionDividerTitle,
  EditorCalloutBlue,
  EditorCalloutBlueTitle,
  EditorCalloutBlueBody,
} from "../../styles/editorForm.styled";
function DatabaseNodeEditor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
  return (
    <EditorSectionRoot>
      <EditorSectionTitle>Database Configuration</EditorSectionTitle>
      <EditorFieldGroup>
        <EditorLabel htmlFor="database-type">Database Type</EditorLabel>
        <EditorSelect
          id="database-type"
          value={inputConfig.database_type || "postgresql"}
          onChange={(e) =>
            onConfigUpdate("input_config", "database_type", e.target.value)
          }
        >
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="sqlite">SQLite</option>
          <option value="mongodb">MongoDB</option>
          <option value="mssql">Microsoft SQL Server</option>
          <option value="oracle">Oracle</option>
        </EditorSelect>
        <EditorHint>Type of database to connect to</EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="database-mode">Connection Mode</EditorLabel>
        <EditorSelect
          id="database-mode"
          value={inputConfig.mode || "read"}
          onChange={(e) =>
            onConfigUpdate("input_config", "mode", e.target.value)
          }
        >
          <option value="read">Read</option>
          <option value="write">Write</option>
        </EditorSelect>
        <EditorHint>Whether to read from or write to the database</EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="database-connection-string">
          Connection String (optional)
        </EditorLabel>
        <EditorTextarea
          id="database-connection-string"
          value={inputConfig.connection_string || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "connection_string", e.target.value)
          }
          placeholder="postgresql://user:password@host:port/database"
          rows={2}
          $mono="sm"
        />
        <EditorHint>
          Full connection string. If provided, individual connection fields are
          ignored.
        </EditorHint>
      </EditorFieldGroup>
      <EditorSubsectionDivider>
        <EditorSubsectionDividerTitle>
          Or specify individual fields:
        </EditorSubsectionDividerTitle>
      </EditorSubsectionDivider>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="database-host">Host</EditorLabel>
        <EditorInput
          id="database-host"
          type="text"
          value={inputConfig.host || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "host", e.target.value)
          }
          placeholder="localhost"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="database-port">Port</EditorLabel>
        <EditorInput
          id="database-port"
          type="number"
          value={inputConfig.port || ""}
          onChange={(e) =>
            onConfigUpdate(
              "input_config",
              "port",
              e.target.value ? parseInt(e.target.value) : void 0,
            )
          }
          placeholder="5432"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="database-name">Database Name</EditorLabel>
        <EditorInput
          id="database-name"
          type="text"
          value={inputConfig.database_name || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "database_name", e.target.value)
          }
          placeholder="mydatabase"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="database-username">Username</EditorLabel>
        <EditorInput
          id="database-username"
          type="text"
          value={inputConfig.username || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "username", e.target.value)
          }
          placeholder="dbuser"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="database-password">Password</EditorLabel>
        <EditorInput
          id="database-password"
          type="password"
          value={inputConfig.password || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "password", e.target.value)
          }
          placeholder={"\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"}
        />
        <EditorHint>Password will be stored securely</EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="database-query">Query / SQL Statement</EditorLabel>
        <EditorTextarea
          id="database-query"
          value={inputConfig.query || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "query", e.target.value)
          }
          placeholder="SELECT * FROM users WHERE id = ?"
          rows={4}
          $mono="sm"
        />
        <EditorHint>
          SQL query to execute. Use ? for parameterized queries.
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="database-ssl-mode">SSL Mode</EditorLabel>
        <EditorSelect
          id="database-ssl-mode"
          value={inputConfig.ssl_mode || "prefer"}
          onChange={(e) =>
            onConfigUpdate("input_config", "ssl_mode", e.target.value)
          }
        >
          <option value="disable">Disable</option>
          <option value="allow">Allow</option>
          <option value="prefer">Prefer</option>
          <option value="require">Require</option>
          <option value="verify-ca">Verify CA</option>
          <option value="verify-full">Verify Full</option>
        </EditorSelect>
        <EditorHint>SSL/TLS connection mode</EditorHint>
      </EditorFieldGroup>
      <EditorCalloutBlue $mt="sm">
        <EditorCalloutBlueTitle>💾 Database Node</EditorCalloutBlueTitle>
        <EditorCalloutBlueBody>
          This node connects to a database and executes SQL queries. Use
          parameterized queries (?) for security.
        </EditorCalloutBlueBody>
      </EditorCalloutBlue>
    </EditorSectionRoot>
  );
}
export { DatabaseNodeEditor as default };

import PropTypes from "prop-types";
import {
  EditorSectionRoot,
  EditorSectionTitle,
  EditorFieldGroup,
  EditorLabel,
  EditorSelect,
  EditorInput,
  EditorTextarea,
  EditorHint,
  EditorCalloutBlue,
  EditorCalloutBlueTitle,
  EditorCalloutBlueBody,
} from "../../styles/editorForm.styled";
function BigQueryNodeEditor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
  return (
    <EditorSectionRoot>
      <EditorSectionTitle>BigQuery Configuration</EditorSectionTitle>
      <EditorFieldGroup>
        <EditorLabel htmlFor="bigquery-project-id">Project ID</EditorLabel>
        <EditorInput
          id="bigquery-project-id"
          type="text"
          value={inputConfig.project_id || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "project_id", e.target.value)
          }
          placeholder="my-gcp-project"
        />
        <EditorHint>Your Google Cloud project ID</EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="bigquery-mode">Connection Mode</EditorLabel>
        <EditorSelect
          id="bigquery-mode"
          value={inputConfig.mode || "read"}
          onChange={(e) =>
            onConfigUpdate("input_config", "mode", e.target.value)
          }
        >
          <option value="read">Read (Query)</option>
          <option value="write">Write (Insert/Update)</option>
        </EditorSelect>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="bigquery-dataset">Dataset</EditorLabel>
        <EditorInput
          id="bigquery-dataset"
          type="text"
          value={inputConfig.dataset || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "dataset", e.target.value)
          }
          placeholder="my_dataset"
        />
        <EditorHint>BigQuery dataset name</EditorHint>
      </EditorFieldGroup>
      {inputConfig.mode === "read" && (
        <EditorFieldGroup $mt="sm">
          <EditorLabel htmlFor="bigquery-query">SQL Query</EditorLabel>
          <EditorTextarea
            id="bigquery-query"
            value={inputConfig.query || ""}
            onChange={(e) =>
              onConfigUpdate("input_config", "query", e.target.value)
            }
            placeholder="SELECT * FROM `project.dataset.table` LIMIT 100"
            rows={6}
            $mono="sm"
          />
          <EditorHint>Standard SQL query to execute</EditorHint>
        </EditorFieldGroup>
      )}
      {inputConfig.mode === "write" && (
        <>
          <EditorFieldGroup $mt="sm">
            <EditorLabel htmlFor="bigquery-table">Table</EditorLabel>
            <EditorInput
              id="bigquery-table"
              type="text"
              value={inputConfig.table || ""}
              onChange={(e) =>
                onConfigUpdate("input_config", "table", e.target.value)
              }
              placeholder="my_table"
            />
            <EditorHint>Target table for insert/update operations</EditorHint>
          </EditorFieldGroup>
          <EditorFieldGroup $mt="sm">
            <EditorLabel htmlFor="bigquery-write-disposition">
              Write Disposition
            </EditorLabel>
            <EditorSelect
              id="bigquery-write-disposition"
              value={inputConfig.write_disposition || "append"}
              onChange={(e) =>
                onConfigUpdate(
                  "input_config",
                  "write_disposition",
                  e.target.value,
                )
              }
            >
              <option value="append">Append</option>
              <option value="truncate">Truncate and Write</option>
              <option value="merge">Merge (Upsert)</option>
            </EditorSelect>
            <EditorHint>How to handle existing data in the table</EditorHint>
          </EditorFieldGroup>
        </>
      )}
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="bigquery-location">Location (optional)</EditorLabel>
        <EditorInput
          id="bigquery-location"
          type="text"
          value={inputConfig.location || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "location", e.target.value)
          }
          placeholder="US or EU"
        />
        <EditorHint>
          BigQuery dataset location (US, EU, etc.). Leave blank for default.
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="bigquery-credentials">
          Service Account Credentials (JSON)
        </EditorLabel>
        <EditorTextarea
          id="bigquery-credentials"
          value={inputConfig.credentials || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "credentials", e.target.value)
          }
          placeholder={'{"type": "service_account", ...}'}
          rows={4}
          $mono="sm"
        />
        <EditorHint>
          Google Cloud service account JSON credentials. Leave blank to use
          default credentials.
        </EditorHint>
      </EditorFieldGroup>
      <EditorCalloutBlue $mt="sm">
        <EditorCalloutBlueTitle>📊 BigQuery Node</EditorCalloutBlueTitle>
        <EditorCalloutBlueBody>
          Query and write data to Google BigQuery data warehouse. Supports
          standard SQL queries and data loading.
        </EditorCalloutBlueBody>
      </EditorCalloutBlue>
    </EditorSectionRoot>
  );
}
BigQueryNodeEditor.propTypes = {
  node: PropTypes.object.isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
};

export { BigQueryNodeEditor as default };

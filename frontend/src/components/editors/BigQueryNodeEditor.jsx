import { useState, useCallback } from "react";
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
  EditorSecondaryFullButton,
} from "../../styles/editorForm.styled";
import {
  BigQueryDatasetPickerDialog,
  BigQueryTablePickerDialog,
  GcpProjectListPickerDialog,
} from "./input/storageObjectPickers";

const flexRowStyle = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "stretch",
};

function BigQueryNodeEditor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectPickerSession, setProjectPickerSession] = useState(0);
  const [datasetPickerOpen, setDatasetPickerOpen] = useState(false);
  const [datasetPickerSession, setDatasetPickerSession] = useState(0);
  const [tablePickerOpen, setTablePickerOpen] = useState(false);
  const [tablePickerSession, setTablePickerSession] = useState(0);

  const openProjectPicker = useCallback(() => {
    setProjectPickerSession((s) => s + 1);
    setProjectPickerOpen(true);
  }, []);
  const openDatasetPicker = useCallback(() => {
    setDatasetPickerSession((s) => s + 1);
    setDatasetPickerOpen(true);
  }, []);
  const openTablePicker = useCallback(() => {
    setTablePickerSession((s) => s + 1);
    setTablePickerOpen(true);
  }, []);

  return (
    <EditorSectionRoot>
      <EditorSectionTitle>BigQuery Configuration</EditorSectionTitle>
      <EditorFieldGroup>
        <EditorLabel htmlFor="bigquery-project-id">Project ID</EditorLabel>
        <div style={flexRowStyle}>
          <EditorInput
            id="bigquery-project-id"
            type="text"
            value={inputConfig.project_id || ""}
            onChange={(e) =>
              onConfigUpdate("input_config", "project_id", e.target.value)
            }
            placeholder="my-gcp-project"
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openProjectPicker}
            aria-label="Browse GCP projects"
            style={{
              width: "auto",
              flexShrink: 0,
              whiteSpace: "nowrap",
              alignSelf: "stretch",
            }}
          >
            Browse…
          </EditorSecondaryFullButton>
        </div>
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
        <div style={flexRowStyle}>
          <EditorInput
            id="bigquery-dataset"
            type="text"
            value={inputConfig.dataset || ""}
            onChange={(e) =>
              onConfigUpdate("input_config", "dataset", e.target.value)
            }
            placeholder="my_dataset"
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openDatasetPicker}
            aria-label="Browse BigQuery datasets"
            style={{
              width: "auto",
              flexShrink: 0,
              whiteSpace: "nowrap",
              alignSelf: "stretch",
            }}
          >
            Browse…
          </EditorSecondaryFullButton>
        </div>
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
            <div style={flexRowStyle}>
              <EditorInput
                id="bigquery-table"
                type="text"
                value={inputConfig.table || ""}
                onChange={(e) =>
                  onConfigUpdate("input_config", "table", e.target.value)
                }
                placeholder="my_table"
                style={{ flex: 1, minWidth: 0 }}
              />
              <EditorSecondaryFullButton
                type="button"
                onClick={openTablePicker}
                aria-label="Browse BigQuery tables"
                style={{
                  width: "auto",
                  flexShrink: 0,
                  whiteSpace: "nowrap",
                  alignSelf: "stretch",
                }}
              >
                Browse…
              </EditorSecondaryFullButton>
            </div>
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
      {projectPickerOpen ? (
        <GcpProjectListPickerDialog
          key={projectPickerSession}
          isOpen={projectPickerOpen}
          onClose={() => setProjectPickerOpen(false)}
          credentials={inputConfig.credentials}
          onSelectProject={(id) => {
            onConfigUpdate("input_config", "project_id", id);
            setProjectPickerOpen(false);
          }}
        />
      ) : null}
      {datasetPickerOpen ? (
        <BigQueryDatasetPickerDialog
          key={datasetPickerSession}
          isOpen={datasetPickerOpen}
          onClose={() => setDatasetPickerOpen(false)}
          credentials={inputConfig.credentials}
          projectId={inputConfig.project_id}
          onSelectDataset={(id) => {
            onConfigUpdate("input_config", "dataset", id);
            setDatasetPickerOpen(false);
          }}
        />
      ) : null}
      {tablePickerOpen ? (
        <BigQueryTablePickerDialog
          key={tablePickerSession}
          isOpen={tablePickerOpen}
          onClose={() => setTablePickerOpen(false)}
          credentials={inputConfig.credentials}
          projectId={inputConfig.project_id}
          datasetId={inputConfig.dataset}
          onSelectTable={(id) => {
            onConfigUpdate("input_config", "table", id);
            setTablePickerOpen(false);
          }}
        />
      ) : null}
    </EditorSectionRoot>
  );
}
BigQueryNodeEditor.propTypes = {
  node: PropTypes.object.isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
};

export { BigQueryNodeEditor as default };

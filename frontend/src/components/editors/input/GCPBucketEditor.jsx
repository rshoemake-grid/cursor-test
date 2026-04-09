import { useRef, useState, useCallback, useEffect } from "react";
import PropTypes from "prop-types";
import {
  useInputFieldSync,
  useInputFieldSyncSimple,
} from "../../../hooks/utils/useInputFieldSync";
import { INPUT_MODE, EMPTY_STRING } from "../../../hooks/utils/inputDefaults";
import {
  createTextInputHandler,
  createSelectHandler,
} from "../../../hooks/utils/inputEditorHelpers";
import { CONFIG_FIELD } from "./inputEditorConstants";
import {
  EditorSectionRoot,
  EditorSectionTitle,
  EditorFieldGroup,
  EditorLabel,
  EditorSelect,
  EditorInput,
  EditorTextarea,
  EditorHint,
  EditorInlineCode,
  EditorSecondaryFullButton,
} from "../../../styles/editorForm.styled";
import { api } from "../../../api/client";
import GcpBucketObjectPickerDialog, {
  GcpBucketListPickerDialog,
  GcpProjectListPickerDialog,
} from "./GcpBucketObjectPickerDialog";

function GCPBucketEditor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSession, setPickerSession] = useState(0);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [bucketPickerSession, setBucketPickerSession] = useState(0);
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectPickerSession, setProjectPickerSession] = useState(0);
  const projectIdRef = useRef(null);
  const bucketNameRef = useRef(null);
  const objectPathRef = useRef(null);
  const gcpCredentialsRef = useRef(null);
  const [projectIdValue, setProjectIdValue] = useInputFieldSync(
    projectIdRef,
    inputConfig.project_id,
    EMPTY_STRING,
  );
  const [bucketNameValue, setBucketNameValue] = useInputFieldSync(
    bucketNameRef,
    inputConfig.bucket_name,
    EMPTY_STRING,
  );
  const [objectPathValue, setObjectPathValue] = useInputFieldSync(
    objectPathRef,
    inputConfig.object_path,
    EMPTY_STRING,
  );
  const [gcpCredentialsValue, setGcpCredentialsValue] = useInputFieldSync(
    gcpCredentialsRef,
    inputConfig.credentials,
    EMPTY_STRING,
  );
  const [modeValue, setModeValue] = useInputFieldSyncSimple(
    inputConfig.mode,
    INPUT_MODE.READ,
  );

  useEffect(() => {
    const fromNode = (inputConfig.project_id || "").trim();
    const fromField = (projectIdValue || "").trim();
    if (fromNode || fromField) {
      return undefined;
    }
    const cred = gcpCredentialsValue || "";
    let cancelled = false;
    const handle = window.setTimeout(() => {
      void (async () => {
        try {
          const data = await api.getGcpDefaultProject({
            credentials: cred.trim() ? cred.trim() : undefined,
          });
          const pid = (data?.project_id || "").trim();
          if (cancelled || !pid) {
            return;
          }
          setProjectIdValue(pid);
          onConfigUpdate(CONFIG_FIELD, "project_id", pid);
        } catch {
          /* leave blank */
        }
      })();
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [
    node.id,
    inputConfig.project_id,
    projectIdValue,
    gcpCredentialsValue,
    onConfigUpdate,
    setProjectIdValue,
  ]);

  const openObjectPicker = useCallback(() => {
    setPickerSession((s) => s + 1);
    setPickerOpen(true);
  }, []);
  const openBucketPicker = useCallback(() => {
    setBucketPickerSession((s) => s + 1);
    setBucketPickerOpen(true);
  }, []);
  const openProjectPicker = useCallback(() => {
    setProjectPickerSession((s) => s + 1);
    setProjectPickerOpen(true);
  }, []);
  const handlePickedProject = useCallback(
    (id) => {
      setProjectIdValue(id);
      onConfigUpdate(CONFIG_FIELD, "project_id", id);
    },
    [onConfigUpdate, setProjectIdValue],
  );
  const handlePickedBucket = useCallback(
    (name) => {
      setBucketNameValue(name);
      onConfigUpdate(CONFIG_FIELD, "bucket_name", name);
    },
    [onConfigUpdate, setBucketNameValue],
  );
  const handlePickedObject = useCallback(
    (path) => {
      setObjectPathValue(path);
      onConfigUpdate(CONFIG_FIELD, "object_path", path);
    },
    [onConfigUpdate, setObjectPathValue],
  );
  return (
    <EditorSectionRoot>
      <EditorSectionTitle>GCP Bucket Configuration</EditorSectionTitle>
      <EditorFieldGroup $mb="sm">
        <EditorLabel htmlFor="gcp-bucket-mode">Mode</EditorLabel>
        <EditorSelect
          id="gcp-bucket-mode"
          value={modeValue}
          onChange={createSelectHandler(
            setModeValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "mode",
          )}
          aria-label="Select bucket operation mode"
        >
          <option value={INPUT_MODE.READ}>Read from bucket</option>
          <option value={INPUT_MODE.WRITE}>Write to bucket</option>
        </EditorSelect>
        <EditorHint>
          Read: Fetch data from bucket. Write: Save data to bucket.
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup>
        <EditorLabel htmlFor="gcp-project-id">GCP Project ID</EditorLabel>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "stretch",
          }}
        >
          <EditorInput
            id="gcp-project-id"
            ref={projectIdRef}
            type="text"
            value={projectIdValue}
            onChange={createTextInputHandler(
              setProjectIdValue,
              onConfigUpdate,
              CONFIG_FIELD,
              "project_id",
            )}
            placeholder="my-gcp-project-id"
            aria-label="GCP project ID"
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
        <EditorHint>
          Defaults to your current GCP project (service account JSON,{" "}
          <EditorInlineCode>GOOGLE_CLOUD_PROJECT</EditorInlineCode>, or Application Default
          Credentials). This value scopes bucket listing; browse buckets uses this project ID.
          Browse projects requires{" "}
          <EditorInlineCode>resourcemanager.projects.list</EditorInlineCode>.
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="gcp-bucket-name">Bucket Name</EditorLabel>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "stretch",
          }}
        >
          <EditorInput
            id="gcp-bucket-name"
            ref={bucketNameRef}
            type="text"
            value={bucketNameValue}
            onChange={createTextInputHandler(
              setBucketNameValue,
              onConfigUpdate,
              CONFIG_FIELD,
              "bucket_name",
            )}
            placeholder="my-bucket-name"
            aria-label="GCP bucket name"
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openBucketPicker}
            aria-label="Browse Google Cloud Storage buckets"
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
        <EditorHint>
          Browse lists buckets in the GCP project ID above. Object browse uses the bucket name
          here (service account JSON below, or ADC on the server).
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="gcp-object-path">Object Path</EditorLabel>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "stretch",
          }}
        >
          <EditorInput
            id="gcp-object-path"
            ref={objectPathRef}
            type="text"
            value={objectPathValue}
            onChange={createTextInputHandler(
              setObjectPathValue,
              onConfigUpdate,
              CONFIG_FIELD,
              "object_path",
            )}
            placeholder="path/to/file.txt or leave blank for all objects"
            aria-label="Object path in bucket"
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openObjectPicker}
            aria-label="Browse bucket for a file"
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
        <EditorHint>
          Lists objects in the bucket named above (same credentials and project as above, or ADC
          on the server).
        </EditorHint>
      </EditorFieldGroup>
      {projectPickerOpen ? (
        <GcpProjectListPickerDialog
          key={projectPickerSession}
          isOpen={projectPickerOpen}
          onClose={() => setProjectPickerOpen(false)}
          credentials={gcpCredentialsValue}
          onSelectProject={handlePickedProject}
        />
      ) : null}
      {bucketPickerOpen ? (
        <GcpBucketListPickerDialog
          key={bucketPickerSession}
          isOpen={bucketPickerOpen}
          onClose={() => setBucketPickerOpen(false)}
          credentials={gcpCredentialsValue}
          projectId={projectIdValue}
          onSelectBucket={handlePickedBucket}
        />
      ) : null}
      {pickerOpen ? (
        <GcpBucketObjectPickerDialog
          key={pickerSession}
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          bucketName={bucketNameValue}
          credentials={gcpCredentialsValue}
          projectId={projectIdValue}
          initialObjectPath={objectPathValue}
          onSelectObject={handlePickedObject}
        />
      ) : null}
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="gcp-credentials">GCP Credentials (JSON)</EditorLabel>
        <EditorTextarea
          id="gcp-credentials"
          ref={gcpCredentialsRef}
          value={gcpCredentialsValue}
          onChange={createTextInputHandler(
            setGcpCredentialsValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "credentials",
          )}
          rows={3}
          placeholder="Paste GCP service account JSON credentials"
          $mono="xs"
          aria-label="GCP service account credentials"
        />
        <EditorHint>
          Service account JSON for GCP access. If empty, the API uses Application Default
          Credentials; when the credentials file path is missing or ADC is not set, local
          dev can run <EditorInlineCode>gcloud auth application-default login</EditorInlineCode>{" "}
          (browser on the server) — see{" "}
          <EditorInlineCode>GCP_BROWSER_AUTH_ON_MISSING_ADC</EditorInlineCode> in{" "}
          <EditorInlineCode>.env.example</EditorInlineCode>.
        </EditorHint>
      </EditorFieldGroup>
    </EditorSectionRoot>
  );
}
GCPBucketEditor.propTypes = {
  node: PropTypes.object.isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
};

export { GCPBucketEditor as default };

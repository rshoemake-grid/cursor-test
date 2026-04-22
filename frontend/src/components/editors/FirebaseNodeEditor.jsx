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
  FirestoreRootCollectionPickerDialog,
  GcpBucketListPickerDialog,
  GcpBucketObjectPickerDialog,
} from "./input/storageObjectPickers";

const flexRowStyle = {
  display: "flex",
  gap: "0.5rem",
  alignItems: "stretch",
};

function FirebaseNodeEditor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
  const [firestorePickerOpen, setFirestorePickerOpen] = useState(false);
  const [firestorePickerSession, setFirestorePickerSession] = useState(0);
  const [storageBucketPickerOpen, setStorageBucketPickerOpen] = useState(false);
  const [storageBucketPickerSession, setStorageBucketPickerSession] = useState(0);
  const [storageObjectPickerOpen, setStorageObjectPickerOpen] = useState(false);
  const [storageObjectPickerSession, setStorageObjectPickerSession] = useState(0);

  const openFirestoreCollectionPicker = useCallback(() => {
    setFirestorePickerSession((s) => s + 1);
    setFirestorePickerOpen(true);
  }, []);
  const openStorageBucketPicker = useCallback(() => {
    setStorageBucketPickerSession((s) => s + 1);
    setStorageBucketPickerOpen(true);
  }, []);
  const openStorageObjectPicker = useCallback(() => {
    setStorageObjectPickerSession((s) => s + 1);
    setStorageObjectPickerOpen(true);
  }, []);

  return (
    <EditorSectionRoot>
      <EditorSectionTitle>Firebase Configuration</EditorSectionTitle>
      <EditorFieldGroup>
        <EditorLabel htmlFor="firebase-service">Firebase Service</EditorLabel>
        <EditorSelect
          id="firebase-service"
          value={inputConfig.firebase_service || "firestore"}
          onChange={(e) =>
            onConfigUpdate("input_config", "firebase_service", e.target.value)
          }
        >
          <option value="firestore">Firestore (NoSQL Database)</option>
          <option value="realtime_db">Realtime Database</option>
          <option value="storage">Firebase Storage</option>
          <option value="auth">Firebase Authentication</option>
        </EditorSelect>
        <EditorHint>Select which Firebase service to use</EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="firebase-project-id">Project ID</EditorLabel>
        <EditorInput
          id="firebase-project-id"
          type="text"
          value={inputConfig.project_id || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "project_id", e.target.value)
          }
          placeholder="my-firebase-project"
        />
        <EditorHint>
          Your Firebase project ID (also used as GCP project for Storage browse)
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="firebase-mode">Connection Mode</EditorLabel>
        <EditorSelect
          id="firebase-mode"
          value={inputConfig.mode || "read"}
          onChange={(e) =>
            onConfigUpdate("input_config", "mode", e.target.value)
          }
        >
          <option value="read">Read</option>
          <option value="write">Write</option>
        </EditorSelect>
      </EditorFieldGroup>
      {(inputConfig.firebase_service === "firestore" ||
        inputConfig.firebase_service === "realtime_db") && (
        <>
          <EditorFieldGroup $mt="sm">
            <EditorLabel htmlFor="firebase-collection-path">
              Collection / Path
            </EditorLabel>
            {inputConfig.firebase_service === "firestore" ? (
              <div style={flexRowStyle}>
                <EditorInput
                  id="firebase-collection-path"
                  type="text"
                  value={inputConfig.collection_path || ""}
                  onChange={(e) =>
                    onConfigUpdate(
                      "input_config",
                      "collection_path",
                      e.target.value,
                    )
                  }
                  placeholder="users or users/{userId}/posts"
                  style={{ flex: 1, minWidth: 0 }}
                />
                <EditorSecondaryFullButton
                  type="button"
                  onClick={openFirestoreCollectionPicker}
                  aria-label="Browse Firestore root collections"
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
            ) : (
              <EditorInput
                id="firebase-collection-path"
                type="text"
                value={inputConfig.collection_path || ""}
                onChange={(e) =>
                  onConfigUpdate(
                    "input_config",
                    "collection_path",
                    e.target.value,
                  )
                }
                placeholder="users or users/{userId}/posts"
              />
            )}
            <EditorHint>
              {inputConfig.firebase_service === "firestore"
                ? "Firestore collection path. Browse fills a root collection; add sub-paths manually if needed."
                : "Firestore collection path or Realtime DB path"}
            </EditorHint>
          </EditorFieldGroup>
          {inputConfig.mode === "read" && (
            <EditorFieldGroup $mt="sm">
              <EditorLabel htmlFor="firebase-query-filter">
                Query Filter (optional)
              </EditorLabel>
              <EditorTextarea
                id="firebase-query-filter"
                value={inputConfig.query_filter || ""}
                onChange={(e) =>
                  onConfigUpdate("input_config", "query_filter", e.target.value)
                }
                placeholder={'{"field": "value"} or JSON query'}
                rows={3}
                $mono="sm"
              />
              <EditorHint>JSON filter for querying documents</EditorHint>
            </EditorFieldGroup>
          )}
        </>
      )}
      {inputConfig.firebase_service === "storage" && (
        <>
          <EditorFieldGroup $mt="sm">
            <EditorLabel htmlFor="firebase-bucket-name">Bucket Name</EditorLabel>
            <div style={flexRowStyle}>
              <EditorInput
                id="firebase-bucket-name"
                type="text"
                value={inputConfig.bucket_name || ""}
                onChange={(e) =>
                  onConfigUpdate("input_config", "bucket_name", e.target.value)
                }
                placeholder="my-firebase-storage.appspot.com"
                style={{ flex: 1, minWidth: 0 }}
              />
              <EditorSecondaryFullButton
                type="button"
                onClick={openStorageBucketPicker}
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
              Firebase Storage uses GCS; browse lists buckets in the project above.
            </EditorHint>
          </EditorFieldGroup>
          <EditorFieldGroup $mt="sm">
            <EditorLabel htmlFor="firebase-file-path">File Path</EditorLabel>
            <div style={flexRowStyle}>
              <EditorInput
                id="firebase-file-path"
                type="text"
                value={inputConfig.file_path || ""}
                onChange={(e) =>
                  onConfigUpdate("input_config", "file_path", e.target.value)
                }
                placeholder="images/photo.jpg"
                style={{ flex: 1, minWidth: 0 }}
              />
              <EditorSecondaryFullButton
                type="button"
                onClick={openStorageObjectPicker}
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
          </EditorFieldGroup>
        </>
      )}
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="firebase-credentials">
          Service Account Credentials (JSON)
        </EditorLabel>
        <EditorTextarea
          id="firebase-credentials"
          value={inputConfig.credentials || ""}
          onChange={(e) =>
            onConfigUpdate("input_config", "credentials", e.target.value)
          }
          placeholder={'{"type": "service_account", ...}'}
          rows={4}
          $mono="sm"
        />
        <EditorHint>
          Firebase service account JSON credentials. Leave blank to use default
          credentials.
        </EditorHint>
      </EditorFieldGroup>
      <EditorCalloutBlue $mt="sm">
        <EditorCalloutBlueTitle>🔥 Firebase Node</EditorCalloutBlueTitle>
        <EditorCalloutBlueBody>
          Connect to Firebase services. Supports Firestore, Realtime Database,
          Storage, and Authentication.
        </EditorCalloutBlueBody>
      </EditorCalloutBlue>
      {firestorePickerOpen ? (
        <FirestoreRootCollectionPickerDialog
          key={firestorePickerSession}
          isOpen={firestorePickerOpen}
          onClose={() => setFirestorePickerOpen(false)}
          credentials={inputConfig.credentials}
          projectId={inputConfig.project_id}
          onSelectCollection={(id) => {
            onConfigUpdate("input_config", "collection_path", id);
            setFirestorePickerOpen(false);
          }}
        />
      ) : null}
      {storageBucketPickerOpen ? (
        <GcpBucketListPickerDialog
          key={storageBucketPickerSession}
          isOpen={storageBucketPickerOpen}
          onClose={() => setStorageBucketPickerOpen(false)}
          credentials={inputConfig.credentials}
          projectId={inputConfig.project_id}
          onSelectBucket={(name) => {
            onConfigUpdate("input_config", "bucket_name", name);
            setStorageBucketPickerOpen(false);
          }}
        />
      ) : null}
      {storageObjectPickerOpen ? (
        <GcpBucketObjectPickerDialog
          key={storageObjectPickerSession}
          isOpen={storageObjectPickerOpen}
          onClose={() => setStorageObjectPickerOpen(false)}
          bucketName={inputConfig.bucket_name}
          credentials={inputConfig.credentials}
          projectId={inputConfig.project_id}
          initialObjectPath={inputConfig.file_path}
          onSelectObject={(path) => {
            onConfigUpdate("input_config", "file_path", path);
            setStorageObjectPickerOpen(false);
          }}
        />
      ) : null}
    </EditorSectionRoot>
  );
}
FirebaseNodeEditor.propTypes = {
  node: PropTypes.object.isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
};

export { FirebaseNodeEditor as default };

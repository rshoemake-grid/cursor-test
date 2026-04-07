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
function FirebaseNodeEditor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
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
        <EditorHint>Your Firebase project ID</EditorHint>
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
            <EditorHint>
              Firestore collection path or Realtime DB path
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
            <EditorInput
              id="firebase-bucket-name"
              type="text"
              value={inputConfig.bucket_name || ""}
              onChange={(e) =>
                onConfigUpdate("input_config", "bucket_name", e.target.value)
              }
              placeholder="my-firebase-storage.appspot.com"
            />
          </EditorFieldGroup>
          <EditorFieldGroup $mt="sm">
            <EditorLabel htmlFor="firebase-file-path">File Path</EditorLabel>
            <EditorInput
              id="firebase-file-path"
              type="text"
              value={inputConfig.file_path || ""}
              onChange={(e) =>
                onConfigUpdate("input_config", "file_path", e.target.value)
              }
              placeholder="images/photo.jpg"
            />
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
    </EditorSectionRoot>
  );
}
export { FirebaseNodeEditor as default };

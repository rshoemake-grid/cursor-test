import { useRef } from "react";
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
} from "../../../styles/editorForm.styled";
function GCPPubSubEditor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
  const projectIdRef = useRef(null);
  const topicNameRef = useRef(null);
  const subscriptionNameRef = useRef(null);
  const gcpCredentialsRef = useRef(null);
  const [projectIdValue, setProjectIdValue] = useInputFieldSync(
    projectIdRef,
    inputConfig.project_id,
    EMPTY_STRING,
  );
  const [topicNameValue, setTopicNameValue] = useInputFieldSync(
    topicNameRef,
    inputConfig.topic_name,
    EMPTY_STRING,
  );
  const [subscriptionNameValue, setSubscriptionNameValue] = useInputFieldSync(
    subscriptionNameRef,
    inputConfig.subscription_name,
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
  return (
    <EditorSectionRoot>
      <EditorSectionTitle>GCP Pub/Sub Configuration</EditorSectionTitle>
      <EditorFieldGroup $mb="sm">
        <EditorLabel htmlFor="pubsub-mode">Mode</EditorLabel>
        <EditorSelect
          id="pubsub-mode"
          value={modeValue}
          onChange={createSelectHandler(
            setModeValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "mode",
          )}
          aria-label="Select Pub/Sub operation mode"
        >
          <option value={INPUT_MODE.READ}>Subscribe (read messages)</option>
          <option value={INPUT_MODE.WRITE}>Publish (write messages)</option>
        </EditorSelect>
        <EditorHint>
          Subscribe: Receive messages from topic. Publish: Send messages to
          topic.
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup>
        <EditorLabel htmlFor="pubsub-project-id">Project ID</EditorLabel>
        <EditorInput
          id="pubsub-project-id"
          ref={projectIdRef}
          type="text"
          value={projectIdValue}
          onChange={createTextInputHandler(
            setProjectIdValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "project_id",
          )}
          placeholder="my-gcp-project"
          aria-label="GCP project ID"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="pubsub-topic-name">Topic Name</EditorLabel>
        <EditorInput
          id="pubsub-topic-name"
          ref={topicNameRef}
          type="text"
          value={topicNameValue}
          onChange={createTextInputHandler(
            setTopicNameValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "topic_name",
          )}
          placeholder="my-topic"
          aria-label="Pub/Sub topic name"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="pubsub-subscription-name">
          Subscription Name
        </EditorLabel>
        <EditorInput
          id="pubsub-subscription-name"
          ref={subscriptionNameRef}
          type="text"
          value={subscriptionNameValue}
          onChange={createTextInputHandler(
            setSubscriptionNameValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "subscription_name",
          )}
          placeholder="my-subscription"
          aria-label="Pub/Sub subscription name"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="pubsub-credentials">GCP Credentials (JSON)</EditorLabel>
        <EditorTextarea
          id="pubsub-credentials"
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
          Leave empty to use Application Default Credentials on the API server; local dev may
          use <EditorInlineCode>gcloud auth application-default login</EditorInlineCode> when the
          credentials file is missing — see{" "}
          <EditorInlineCode>GCP_BROWSER_AUTH_ON_MISSING_ADC</EditorInlineCode> in{" "}
          <EditorInlineCode>.env.example</EditorInlineCode>.
        </EditorHint>
      </EditorFieldGroup>
    </EditorSectionRoot>
  );
}
export { GCPPubSubEditor as default };

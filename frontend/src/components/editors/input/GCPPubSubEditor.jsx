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
import {
  GcpProjectListPickerDialog,
  GcpPubsubSubscriptionPickerDialog,
  GcpPubsubTopicPickerDialog,
} from "./GcpBucketObjectPickerDialog";

function GCPPubSubEditor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
  const [projectPickerOpen, setProjectPickerOpen] = useState(false);
  const [projectPickerSession, setProjectPickerSession] = useState(0);
  const [topicPickerOpen, setTopicPickerOpen] = useState(false);
  const [topicPickerSession, setTopicPickerSession] = useState(0);
  const [subscriptionPickerOpen, setSubscriptionPickerOpen] = useState(false);
  const [subscriptionPickerSession, setSubscriptionPickerSession] = useState(0);
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
  const openTopicPicker = useCallback(() => {
    setTopicPickerSession((s) => s + 1);
    setTopicPickerOpen(true);
  }, []);
  const handlePickedTopic = useCallback(
    (name) => {
      setTopicNameValue(name);
      onConfigUpdate(CONFIG_FIELD, "topic_name", name);
    },
    [onConfigUpdate, setTopicNameValue],
  );
  const openSubscriptionPicker = useCallback(() => {
    setSubscriptionPickerSession((s) => s + 1);
    setSubscriptionPickerOpen(true);
  }, []);
  const handlePickedSubscription = useCallback(
    (name) => {
      setSubscriptionNameValue(name);
      onConfigUpdate(CONFIG_FIELD, "subscription_name", name);
    },
    [onConfigUpdate, setSubscriptionNameValue],
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
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "stretch",
          }}
        >
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
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openProjectPicker}
            aria-label="Browse GCP projects for Pub/Sub"
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
          Credentials). Browse lists projects via Resource Manager; your principal needs{" "}
          <EditorInlineCode>resourcemanager.projects.list</EditorInlineCode>.
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
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="pubsub-topic-name">Topic Name</EditorLabel>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "stretch",
          }}
        >
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
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openTopicPicker}
            aria-label="Browse Pub/Sub topics"
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
          Required for publish. For subscribe, optional but useful: set the topic first, then
          browse subscriptions to list only subscriptions attached to that topic.
        </EditorHint>
      </EditorFieldGroup>
      {topicPickerOpen ? (
        <GcpPubsubTopicPickerDialog
          key={topicPickerSession}
          isOpen={topicPickerOpen}
          onClose={() => setTopicPickerOpen(false)}
          credentials={gcpCredentialsValue}
          projectId={projectIdValue}
          onSelectTopic={handlePickedTopic}
        />
      ) : null}
      {modeValue === INPUT_MODE.READ ? (
        <EditorFieldGroup $mt="sm">
          <EditorLabel htmlFor="pubsub-subscription-name">
            Subscription Name
          </EditorLabel>
          <div
            style={{
              display: "flex",
              gap: "0.5rem",
              alignItems: "stretch",
            }}
          >
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
              style={{ flex: 1, minWidth: 0 }}
            />
            <EditorSecondaryFullButton
              type="button"
              onClick={openSubscriptionPicker}
              aria-label="Browse Pub/Sub subscriptions"
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
            Subscribe mode pulls from this subscription. Browse lists existing subscriptions
            (optionally filtered by the topic name above), or type an ID if you already know it.
          </EditorHint>
        </EditorFieldGroup>
      ) : null}
      {subscriptionPickerOpen ? (
        <GcpPubsubSubscriptionPickerDialog
          key={subscriptionPickerSession}
          isOpen={subscriptionPickerOpen}
          onClose={() => setSubscriptionPickerOpen(false)}
          credentials={gcpCredentialsValue}
          projectId={projectIdValue}
          topicName={topicNameValue}
          onSelectSubscription={handlePickedSubscription}
        />
      ) : null}
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
GCPPubSubEditor.propTypes = {
  node: PropTypes.object.isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
};

export { GCPPubSubEditor as default };

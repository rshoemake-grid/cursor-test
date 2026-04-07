import { useRef } from "react";
import {
  useInputFieldSync,
  useInputFieldSyncSimple,
} from "../../../hooks/utils/useInputFieldSync";
import {
  INPUT_MODE,
  INPUT_REGION,
  EMPTY_STRING,
} from "../../../hooks/utils/inputDefaults";
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
  EditorHint,
} from "../../../styles/editorForm.styled";
function AWSS3Editor({ node, onConfigUpdate }) {
  const inputConfig = node.data.input_config || {};
  const bucketNameRef = useRef(null);
  const objectKeyRef = useRef(null);
  const accessKeyIdRef = useRef(null);
  const secretKeyRef = useRef(null);
  const regionRef = useRef(null);
  const [bucketNameValue, setBucketNameValue] = useInputFieldSync(
    bucketNameRef,
    inputConfig.bucket_name,
    EMPTY_STRING,
  );
  const [objectKeyValue, setObjectKeyValue] = useInputFieldSync(
    objectKeyRef,
    inputConfig.object_key,
    EMPTY_STRING,
  );
  const [accessKeyIdValue, setAccessKeyIdValue] = useInputFieldSync(
    accessKeyIdRef,
    inputConfig.access_key_id,
    EMPTY_STRING,
  );
  const [secretKeyValue, setSecretKeyValue] = useInputFieldSync(
    secretKeyRef,
    inputConfig.secret_access_key,
    EMPTY_STRING,
  );
  const [regionValue, setRegionValue] = useInputFieldSync(
    regionRef,
    inputConfig.region,
    INPUT_REGION.DEFAULT,
  );
  const [modeValue, setModeValue] = useInputFieldSyncSimple(
    inputConfig.mode,
    INPUT_MODE.READ,
  );
  return (
    <EditorSectionRoot>
      <EditorSectionTitle>AWS S3 Configuration</EditorSectionTitle>
      <EditorFieldGroup $mb="sm">
        <EditorLabel htmlFor="aws-s3-mode">Mode</EditorLabel>
        <EditorSelect
          id="aws-s3-mode"
          value={modeValue}
          onChange={createSelectHandler(
            setModeValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "mode",
          )}
          aria-label="Select S3 operation mode"
        >
          <option value={INPUT_MODE.READ}>Read from bucket</option>
          <option value={INPUT_MODE.WRITE}>Write to bucket</option>
        </EditorSelect>
        <EditorHint>
          Read: Fetch data from bucket. Write: Save data to bucket.
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup>
        <EditorLabel htmlFor="aws-bucket-name">Bucket Name</EditorLabel>
        <EditorInput
          id="aws-bucket-name"
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
          aria-label="AWS S3 bucket name"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="aws-object-key">Object Key</EditorLabel>
        <EditorInput
          id="aws-object-key"
          ref={objectKeyRef}
          type="text"
          value={objectKeyValue}
          onChange={createTextInputHandler(
            setObjectKeyValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "object_key",
          )}
          placeholder="path/to/file.txt or leave blank for all objects"
          aria-label="S3 object key"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="aws-access-key-id">AWS Access Key ID</EditorLabel>
        <EditorInput
          id="aws-access-key-id"
          ref={accessKeyIdRef}
          type="text"
          value={accessKeyIdValue}
          onChange={createTextInputHandler(
            setAccessKeyIdValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "access_key_id",
          )}
          placeholder="AKIAIOSFODNN7EXAMPLE"
          aria-label="AWS access key ID"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="aws-secret-key">AWS Secret Access Key</EditorLabel>
        <EditorInput
          id="aws-secret-key"
          ref={secretKeyRef}
          type="password"
          value={secretKeyValue}
          onChange={createTextInputHandler(
            setSecretKeyValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "secret_access_key",
          )}
          placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
          aria-label="AWS secret access key"
        />
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="aws-region">AWS Region</EditorLabel>
        <EditorInput
          id="aws-region"
          ref={regionRef}
          type="text"
          value={regionValue}
          onChange={createTextInputHandler(
            setRegionValue,
            onConfigUpdate,
            CONFIG_FIELD,
            "region",
          )}
          placeholder={INPUT_REGION.DEFAULT}
          aria-label="AWS region"
        />
      </EditorFieldGroup>
    </EditorSectionRoot>
  );
}
export { AWSS3Editor as default };

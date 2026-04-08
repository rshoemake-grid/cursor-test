import { useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
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
  EditorSecondaryFullButton,
} from "../../../styles/editorForm.styled";
import {
  AwsRegionListPickerDialog,
  S3BucketListPickerDialog,
  S3BucketObjectPickerDialog,
} from "./storageObjectPickers";

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
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSession, setPickerSession] = useState(0);
  const [bucketPickerOpen, setBucketPickerOpen] = useState(false);
  const [bucketPickerSession, setBucketPickerSession] = useState(0);
  const [regionPickerOpen, setRegionPickerOpen] = useState(false);
  const [regionPickerSession, setRegionPickerSession] = useState(0);
  const openObjectPicker = useCallback(() => {
    setPickerSession((s) => s + 1);
    setPickerOpen(true);
  }, []);
  const openBucketPicker = useCallback(() => {
    setBucketPickerSession((s) => s + 1);
    setBucketPickerOpen(true);
  }, []);
  const openRegionPicker = useCallback(() => {
    setRegionPickerSession((s) => s + 1);
    setRegionPickerOpen(true);
  }, []);
  const handlePickedRegion = useCallback(
    (r) => {
      setRegionValue(r);
      onConfigUpdate(CONFIG_FIELD, "region", r);
    },
    [onConfigUpdate, setRegionValue],
  );
  const handlePickedBucket = useCallback(
    (name) => {
      setBucketNameValue(name);
      onConfigUpdate(CONFIG_FIELD, "bucket_name", name);
    },
    [onConfigUpdate, setBucketNameValue],
  );
  const handlePickedKey = useCallback(
    (key) => {
      setObjectKeyValue(key);
      onConfigUpdate(CONFIG_FIELD, "object_key", key);
    },
    [onConfigUpdate, setObjectKeyValue],
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
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "stretch",
          }}
        >
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
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openBucketPicker}
            aria-label="Browse AWS S3 buckets"
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
          Browse lists buckets for your AWS account (access keys below when set, or the default
          credential chain on the server).
        </EditorHint>
      </EditorFieldGroup>
      <EditorFieldGroup $mt="sm">
        <EditorLabel htmlFor="aws-object-key">Object Key</EditorLabel>
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "stretch",
          }}
        >
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
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openObjectPicker}
            aria-label="Browse S3 bucket for an object key"
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
          Browse sends a signed-in request to list keys (same credentials as below, or
          default AWS credential chain on the server).
        </EditorHint>
      </EditorFieldGroup>
      {bucketPickerOpen ? (
        <S3BucketListPickerDialog
          key={bucketPickerSession}
          isOpen={bucketPickerOpen}
          onClose={() => setBucketPickerOpen(false)}
          accessKeyId={accessKeyIdValue}
          secretAccessKey={secretKeyValue}
          region={regionValue}
          onSelectBucket={handlePickedBucket}
        />
      ) : null}
      {pickerOpen ? (
        <S3BucketObjectPickerDialog
          key={pickerSession}
          isOpen={pickerOpen}
          onClose={() => setPickerOpen(false)}
          bucketName={bucketNameValue}
          objectKey={objectKeyValue}
          accessKeyId={accessKeyIdValue}
          secretAccessKey={secretKeyValue}
          region={regionValue}
          onSelectObject={handlePickedKey}
        />
      ) : null}
      {regionPickerOpen ? (
        <AwsRegionListPickerDialog
          key={regionPickerSession}
          isOpen={regionPickerOpen}
          onClose={() => setRegionPickerOpen(false)}
          accessKeyId={accessKeyIdValue}
          secretAccessKey={secretKeyValue}
          onSelectRegion={handlePickedRegion}
        />
      ) : null}
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
        <div
          style={{
            display: "flex",
            gap: "0.5rem",
            alignItems: "stretch",
          }}
        >
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
            style={{ flex: 1, minWidth: 0 }}
          />
          <EditorSecondaryFullButton
            type="button"
            onClick={openRegionPicker}
            aria-label="Browse AWS regions"
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
          Region for S3 and EC2 calls. Browse uses EC2 DescribeRegions (keys below when set, or
          default AWS credentials on the server).
        </EditorHint>
      </EditorFieldGroup>
    </EditorSectionRoot>
  );
}
AWSS3Editor.propTypes = {
  node: PropTypes.object.isRequired,
  onConfigUpdate: PropTypes.func.isRequired,
};

export { AWSS3Editor as default };

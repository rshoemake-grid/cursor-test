import { useCallback } from "react";
import PropTypes from "prop-types";
import { api } from "../../../api/client";
import StorageBrowserDialog from "./StorageBrowserDialog";
import {
  browsePrefixFromObjectKey,
  browseDirectoryFromFilePath,
} from "../../../utils/storageBrowserPaths";

function GcpBucketObjectPickerDialog({
  isOpen,
  onClose,
  bucketName,
  credentials,
  initialObjectPath,
  onSelectObject,
}) {
  const bucket = (bucketName || "").trim();
  const prereqError = bucket ? "" : "Enter a bucket name first.";
  const fetchPage = useCallback(
    async (prefix) => {
      const data = await api.listGcpBucketObjects({
        bucket_name: bucket,
        prefix,
        credentials: credentials?.trim() ? credentials : undefined,
        delimiter: "/",
      });
      return {
        prefixes: data.prefixes || [],
        objects: data.objects || [],
      };
    },
    [bucket, credentials],
  );
  return (
    <StorageBrowserDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Select object in bucket"
      resourceSubtitle={bucket || "(no bucket)"}
      titleId="gcp-picker-title"
      variant="keyPrefix"
      initialLocation={browsePrefixFromObjectKey(initialObjectPath)}
      prereqError={prereqError}
      fetchPage={fetchPage}
      onSelectFile={onSelectObject}
    />
  );
}

GcpBucketObjectPickerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bucketName: PropTypes.string,
  credentials: PropTypes.string,
  initialObjectPath: PropTypes.string,
  onSelectObject: PropTypes.func.isRequired,
};

function S3BucketObjectPickerDialog({
  isOpen,
  onClose,
  bucketName,
  objectKey: initialObjectKey,
  accessKeyId,
  secretAccessKey,
  region,
  onSelectObject,
}) {
  const bucket = (bucketName || "").trim();
  const prereqError = bucket ? "" : "Enter a bucket name first.";
  const fetchPage = useCallback(
    async (prefix) => {
      const data = await api.listS3BucketObjects({
        bucket_name: bucket,
        prefix,
        access_key_id: accessKeyId?.trim() ? accessKeyId : undefined,
        secret_access_key: secretAccessKey?.trim() ? secretAccessKey : undefined,
        region: region?.trim() || undefined,
        delimiter: "/",
      });
      return {
        prefixes: data.prefixes || [],
        objects: data.objects || [],
      };
    },
    [bucket, accessKeyId, secretAccessKey, region],
  );
  return (
    <StorageBrowserDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Select object in S3 bucket"
      resourceSubtitle={bucket || "(no bucket)"}
      titleId="s3-picker-title"
      variant="keyPrefix"
      initialLocation={browsePrefixFromObjectKey(initialObjectKey)}
      prereqError={prereqError}
      fetchPage={fetchPage}
      onSelectFile={onSelectObject}
    />
  );
}

S3BucketObjectPickerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  bucketName: PropTypes.string,
  objectKey: PropTypes.string,
  accessKeyId: PropTypes.string,
  secretAccessKey: PropTypes.string,
  region: PropTypes.string,
  onSelectObject: PropTypes.func.isRequired,
};

function LocalFileObjectPickerDialog({
  isOpen,
  onClose,
  initialFilePath,
  onSelectFile,
}) {
  const fetchPage = useCallback(async (directory) => {
    const data = await api.listLocalDirectory({
      directory: directory || "",
    });
    return {
      prefixes: data.prefixes || [],
      objects: data.objects || [],
      canGoUp: data.can_go_up,
      currentDirectory: data.directory,
    };
  }, []);
  const subtitleHint = "Paths are on the server running the API.";
  return (
    <StorageBrowserDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Select file on server"
      resourceSubtitle={subtitleHint}
      titleId="local-picker-title"
      variant="localDirectory"
      initialLocation={browseDirectoryFromFilePath(initialFilePath)}
      fetchPage={fetchPage}
      onSelectFile={onSelectFile}
    />
  );
}

LocalFileObjectPickerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  initialFilePath: PropTypes.string,
  onSelectFile: PropTypes.func.isRequired,
};

export {
  GcpBucketObjectPickerDialog,
  S3BucketObjectPickerDialog,
  LocalFileObjectPickerDialog,
};

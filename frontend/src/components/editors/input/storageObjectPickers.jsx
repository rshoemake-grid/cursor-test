import { useCallback } from "react";
import PropTypes from "prop-types";
import { api } from "../../../api/client";
import StorageBrowserDialog from "./StorageBrowserDialog";
import {
  browsePrefixFromObjectKey,
  browseDirectoryFromFilePath,
} from "../../../utils/storageBrowserPaths";

function GcpBucketListPickerDialog({
  isOpen,
  onClose,
  credentials,
  projectId,
  onSelectBucket,
}) {
  const fetchBuckets = useCallback(async () => {
    const data = await api.listGcpBuckets({
      credentials: credentials?.trim() ? credentials : undefined,
      project_id: projectId?.trim() ? projectId.trim() : undefined,
    });
    const objects = data?.objects;
    return {
      prefixes: [],
      objects: Array.isArray(objects) ? objects : [],
    };
  }, [credentials, projectId]);
  return (
    <StorageBrowserDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Select GCS bucket"
      resourceSubtitle="Uses credentials below when set, or Application Default Credentials on the server."
      titleId="gcp-bucket-list-title"
      variant="bucketList"
      initialLocation=""
      prereqError=""
      fetchPage={fetchBuckets}
      onSelectFile={onSelectBucket}
      selectButtonLabel="Use selected bucket"
      emptyFolderMessage="No buckets found."
    />
  );
}

GcpBucketListPickerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  credentials: PropTypes.string,
  projectId: PropTypes.string,
  onSelectBucket: PropTypes.func.isRequired,
};

function GcpProjectListPickerDialog({
  isOpen,
  onClose,
  credentials,
  onSelectProject,
}) {
  const fetchProjects = useCallback(async () => {
    const data = await api.listGcpProjects({
      credentials: credentials?.trim() ? credentials : undefined,
    });
    const objects = data?.objects;
    return {
      prefixes: [],
      objects: Array.isArray(objects) ? objects : [],
    };
  }, [credentials]);
  return (
    <StorageBrowserDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Select GCP project"
      resourceSubtitle="Lists projects your credentials can see (service account JSON below, or ADC on the server). Requires Resource Manager project list permission."
      titleId="gcp-project-list-title"
      variant="bucketList"
      initialLocation=""
      prereqError=""
      fetchPage={fetchProjects}
      onSelectFile={onSelectProject}
      selectButtonLabel="Use selected project"
      emptyFolderMessage="No projects found."
    />
  );
}

GcpProjectListPickerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  credentials: PropTypes.string,
  onSelectProject: PropTypes.func.isRequired,
};

function AwsRegionListPickerDialog({
  isOpen,
  onClose,
  accessKeyId,
  secretAccessKey,
  onSelectRegion,
}) {
  const fetchRegions = useCallback(async () => {
    const data = await api.listAwsRegions({
      access_key_id: accessKeyId?.trim() ? accessKeyId : undefined,
      secret_access_key: secretAccessKey?.trim() ? secretAccessKey : undefined,
    });
    const objects = data?.objects;
    return {
      prefixes: [],
      objects: Array.isArray(objects) ? objects : [],
    };
  }, [accessKeyId, secretAccessKey]);
  return (
    <StorageBrowserDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Select AWS region"
      resourceSubtitle="Regions enabled for your account (EC2 DescribeRegions). Uses access keys below when set, or the default credential chain."
      titleId="aws-region-list-title"
      variant="bucketList"
      initialLocation=""
      prereqError=""
      fetchPage={fetchRegions}
      onSelectFile={onSelectRegion}
      selectButtonLabel="Use selected region"
      emptyFolderMessage="No regions returned."
    />
  );
}

AwsRegionListPickerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  accessKeyId: PropTypes.string,
  secretAccessKey: PropTypes.string,
  onSelectRegion: PropTypes.func.isRequired,
};

function S3BucketListPickerDialog({
  isOpen,
  onClose,
  accessKeyId,
  secretAccessKey,
  region,
  onSelectBucket,
}) {
  const fetchBuckets = useCallback(async () => {
    const data = await api.listS3Buckets({
      access_key_id: accessKeyId?.trim() ? accessKeyId : undefined,
      secret_access_key: secretAccessKey?.trim() ? secretAccessKey : undefined,
      region: region?.trim() || undefined,
    });
    const objects = data?.objects;
    return {
      prefixes: [],
      objects: Array.isArray(objects) ? objects : [],
    };
  }, [accessKeyId, secretAccessKey, region]);
  return (
    <StorageBrowserDialog
      isOpen={isOpen}
      onClose={onClose}
      title="Select S3 bucket"
      resourceSubtitle="Uses access keys below when set, or the default AWS credential chain on the server."
      titleId="s3-bucket-list-title"
      variant="bucketList"
      initialLocation=""
      prereqError=""
      fetchPage={fetchBuckets}
      onSelectFile={onSelectBucket}
      selectButtonLabel="Use selected bucket"
      emptyFolderMessage="No buckets found."
    />
  );
}

S3BucketListPickerDialog.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  accessKeyId: PropTypes.string,
  secretAccessKey: PropTypes.string,
  region: PropTypes.string,
  onSelectBucket: PropTypes.func.isRequired,
};

function GcpBucketObjectPickerDialog({
  isOpen,
  onClose,
  bucketName,
  credentials,
  projectId,
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
        project_id: projectId?.trim() ? projectId.trim() : undefined,
        delimiter: "/",
      });
      return {
        prefixes: data.prefixes || [],
        objects: data.objects || [],
      };
    },
    [bucket, credentials, projectId],
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
  projectId: PropTypes.string,
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
  AwsRegionListPickerDialog,
  GcpBucketListPickerDialog,
  GcpBucketObjectPickerDialog,
  GcpProjectListPickerDialog,
  S3BucketListPickerDialog,
  S3BucketObjectPickerDialog,
  LocalFileObjectPickerDialog,
};

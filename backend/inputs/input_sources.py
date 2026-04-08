"""
Input source handlers for reading from various data sources.
Supports GCP Buckets, AWS S3, GCP Pub/Sub, and Local File System.
"""
import json
import os
import base64
import mimetypes
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List, Tuple
from pathlib import Path
import glob

# Optional imports for cloud services
try:
    from google.cloud import storage
    from google.cloud import pubsub_v1
    from google.oauth2 import service_account
    GCP_AVAILABLE = True
except ImportError:
    GCP_AVAILABLE = False

try:
    import boto3
    AWS_AVAILABLE = True
except ImportError:
    AWS_AVAILABLE = False

from ..utils.logger import get_logger
from ..utils.path_utils import get_local_file_base_path, validate_path_within_base
from .gcp_auth import gcp_client_with_adc_retry

logger = get_logger(__name__)

# P3-4: Named constant for filename increment safety cap
MAX_FILENAME_INCREMENT_ATTEMPTS = 10000


def _serialize_for_write(data: Any, as_bytes: bool = False, indent: int = 2) -> tuple[Any, str]:
    """Serialize data for write. Returns (content, content_type). DRY across handlers."""
    if data is None:
        content, content_type = "", "text/plain"
    elif isinstance(data, (dict, list)):
        content = json.dumps(data, indent=indent if indent else None)
        content_type = "application/json"
    else:
        content = str(data)
        content_type = "text/plain"
    if as_bytes:
        content = content.encode("utf-8")
    return content, content_type


def _parse_gcp_credentials(credentials_json: Optional[str]):
    """Parse GCP credentials from JSON string. Returns credentials or None for default."""
    if not credentials_json:
        return None
    try:
        credentials_info = json.loads(credentials_json)
        from google.oauth2 import service_account
        return service_account.Credentials.from_service_account_info(credentials_info)
    except json.JSONDecodeError:
        raise ValueError("Invalid JSON credentials for GCP")


class InputSourceHandler:
    """Base class for input source handlers"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        """Read data from the input source"""
        raise NotImplementedError
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Write data to the input source"""
        raise NotImplementedError


class GCPBucketHandler(InputSourceHandler):
    """Handler for reading from Google Cloud Storage buckets"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        if not GCP_AVAILABLE:
            raise ImportError("google-cloud-storage not installed. Install with: pip install google-cloud-storage")
        
        bucket_name = config.get('bucket_name')
        object_path = config.get('object_path', '')
        credentials_json = config.get('credentials')
        
        if not bucket_name:
            raise ValueError("bucket_name is required for GCP Bucket input")
        
        credentials = _parse_gcp_credentials(credentials_json)

        def _storage_client():
            return (
                storage.Client(credentials=credentials)
                if credentials
                else storage.Client()
            )

        client = gcp_client_with_adc_retry(credentials_json, _storage_client)

        bucket = client.bucket(bucket_name)

        if object_path:
            # Read specific object
            blob = bucket.blob(object_path)
            if not blob.exists():
                raise FileNotFoundError(f"Object {object_path} not found in bucket {bucket_name}")
            
            content = blob.download_as_text()
            
            # Try to parse as JSON, otherwise return as text
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return content
        else:
            # P3-10: Limit list size to avoid memory issues with large buckets
            _MAX_BLOB_LIST = 10000
            blobs = bucket.list_blobs(max_results=_MAX_BLOB_LIST)
            return [blob.name for blob in blobs]
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Write data to GCP Bucket"""
        if not GCP_AVAILABLE:
            raise ImportError("google-cloud-storage not installed. Install with: pip install google-cloud-storage")
        
        bucket_name = config.get('bucket_name')
        object_path = config.get('object_path', '')
        credentials_json = config.get('credentials')
        
        if not bucket_name:
            raise ValueError("bucket_name is required for GCP Bucket write")
        if not object_path:
            raise ValueError("object_path is required for GCP Bucket write")

        credentials = _parse_gcp_credentials(credentials_json)

        def _storage_client():
            return (
                storage.Client(credentials=credentials)
                if credentials
                else storage.Client()
            )

        client = gcp_client_with_adc_retry(credentials_json, _storage_client)

        bucket = client.bucket(bucket_name)
        blob = bucket.blob(object_path)
        
        # Convert data to string (JSON if dict/list, otherwise string)
        if isinstance(data, (dict, list)):
            content = json.dumps(data, indent=2)
            blob.upload_from_string(content, content_type='application/json')
        else:
            blob.upload_from_string(str(data), content_type='text/plain')
        
        return {"status": "success", "bucket": bucket_name, "object": object_path}

    @staticmethod
    def list_objects(
        config: Dict[str, Any],
        prefix: str = "",
        delimiter: Optional[str] = "/",
        max_results: int = 2000,
    ) -> Tuple[List[str], List[Dict[str, Any]]]:
        """
        List folder prefixes and objects under ``prefix`` for bucket picker UIs.

        Returns:
            (prefixes, objects) where objects are dicts with name, display_name, size, updated.
        """
        if not GCP_AVAILABLE:
            raise ImportError("google-cloud-storage not installed. Install with: pip install google-cloud-storage")

        bucket_name = config.get("bucket_name")
        credentials_json = config.get("credentials")

        if not bucket_name:
            raise ValueError("bucket_name is required for GCP Bucket listing")

        credentials = _parse_gcp_credentials(credentials_json)

        def _storage_client():
            return (
                storage.Client(credentials=credentials)
                if credentials
                else storage.Client()
            )

        client = gcp_client_with_adc_retry(credentials_json, _storage_client)
        bucket = client.bucket(bucket_name)
        norm_prefix = prefix or ""
        list_kwargs: Dict[str, Any] = {"prefix": norm_prefix, "max_results": max_results}
        if delimiter:
            list_kwargs["delimiter"] = delimiter

        blobs_iter = bucket.list_blobs(**list_kwargs)
        objects_out: List[Dict[str, Any]] = []
        for blob in blobs_iter:
            display = blob.name[len(norm_prefix) :].lstrip("/") if norm_prefix else blob.name
            if not display:
                display = blob.name.rstrip("/").split("/")[-1] or blob.name
            updated_iso = None
            try:
                if blob.updated:
                    updated_iso = blob.updated.isoformat()
            except Exception:
                pass
            objects_out.append(
                {
                    "name": blob.name,
                    "display_name": display or blob.name,
                    "size": blob.size,
                    "updated": updated_iso,
                }
            )
        prefixes_out = sorted(getattr(blobs_iter, "prefixes", set()) or [])
        return prefixes_out, objects_out


class AWSS3Handler(InputSourceHandler):
    """Handler for reading from AWS S3 buckets"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        if not AWS_AVAILABLE:
            raise ImportError("boto3 not installed. Install with: pip install boto3")
        
        bucket_name = config.get('bucket_name')
        object_key = config.get('object_key', '')
        access_key_id = config.get('access_key_id')
        secret_access_key = config.get('secret_access_key')
        region = config.get('region', 'us-east-1')
        
        if not bucket_name:
            raise ValueError("bucket_name is required for AWS S3 input")
        
        # Initialize S3 client
        if access_key_id and secret_access_key:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                region_name=region
            )
        else:
            # Use default credentials (from environment or IAM role)
            s3_client = boto3.client('s3', region_name=region)
        
        if object_key:
            # Read specific object
            try:
                response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
                content = response['Body'].read().decode('utf-8')
                
                # Try to parse as JSON, otherwise return as text
                try:
                    return json.loads(content)
                except json.JSONDecodeError:
                    return content
            except Exception as e:
                # P3-9: Use ClientError; s3_client.exceptions.NoSuchKey may not exist on all clients
                try:
                    from botocore.exceptions import ClientError
                    if isinstance(e, ClientError) and e.response.get("Error", {}).get("Code") == "NoSuchKey":
                        raise FileNotFoundError(f"Object {object_key} not found in bucket {bucket_name}")
                except ImportError:
                    pass
                raise
        else:
            # List all objects in bucket
            response = s3_client.list_objects_v2(Bucket=bucket_name)
            if 'Contents' in response:
                return [obj['Key'] for obj in response['Contents']]
            return []
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Write data to AWS S3"""
        if not AWS_AVAILABLE:
            raise ImportError("boto3 not installed. Install with: pip install boto3")
        
        bucket_name = config.get('bucket_name')
        object_key = config.get('object_key', '')
        access_key_id = config.get('access_key_id')
        secret_access_key = config.get('secret_access_key')
        region = config.get('region', 'us-east-1')
        
        if not bucket_name:
            raise ValueError("bucket_name is required for AWS S3 write")
        if not object_key:
            raise ValueError("object_key is required for AWS S3 write")
        
        # Initialize S3 client
        if access_key_id and secret_access_key:
            s3_client = boto3.client(
                's3',
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                region_name=region
            )
        else:
            s3_client = boto3.client('s3', region_name=region)
        
        content, content_type = _serialize_for_write(data, as_bytes=True)
        s3_client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=content,
            ContentType=content_type
        )
        
        return {"status": "success", "bucket": bucket_name, "key": object_key}

    @staticmethod
    def list_objects(
        config: Dict[str, Any],
        prefix: str = "",
        delimiter: Optional[str] = "/",
        max_results: int = 2000,
    ) -> Tuple[List[str], List[Dict[str, Any]]]:
        """List S3 common prefixes and objects (same shape as GCP list_objects)."""
        if not AWS_AVAILABLE:
            raise ImportError("boto3 not installed. Install with: pip install boto3")

        bucket_name = config.get("bucket_name")
        access_key_id = config.get("access_key_id")
        secret_access_key = config.get("secret_access_key")
        region = config.get("region", "us-east-1")

        if not bucket_name:
            raise ValueError("bucket_name is required for AWS S3 listing")

        if access_key_id and secret_access_key:
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=access_key_id,
                aws_secret_access_key=secret_access_key,
                region_name=region,
            )
        else:
            s3_client = boto3.client("s3", region_name=region)

        norm_prefix = prefix or ""
        page_size = min(1000, max(1, max_results))
        paginator = s3_client.get_paginator("list_objects_v2")
        page_kwargs: Dict[str, Any] = {
            "Bucket": bucket_name,
            "Prefix": norm_prefix,
            "PaginationConfig": {"MaxItems": max_results, "PageSize": page_size},
        }
        if delimiter:
            page_kwargs["Delimiter"] = delimiter

        prefixes_set: set = set()
        objects_out: List[Dict[str, Any]] = []

        for page in paginator.paginate(**page_kwargs):
            for cp in page.get("CommonPrefixes") or []:
                pfx = cp.get("Prefix") or ""
                if pfx:
                    prefixes_set.add(pfx)
            for obj in page.get("Contents") or []:
                key = obj.get("Key") or ""
                if not key:
                    continue
                if delimiter and key.endswith("/"):
                    continue
                updated_iso = None
                try:
                    lm = obj.get("LastModified")
                    if lm is not None:
                        updated_iso = lm.isoformat()
                except Exception:
                    pass
                display = (
                    key[len(norm_prefix) :].lstrip("/") if norm_prefix else key
                )
                if not display:
                    display = key.rstrip("/").split("/")[-1] or key
                objects_out.append(
                    {
                        "name": key,
                        "display_name": display or key,
                        "size": obj.get("Size"),
                        "updated": updated_iso,
                    }
                )

        return sorted(prefixes_set), objects_out


class GCPPubSubHandler(InputSourceHandler):
    """Handler for reading from GCP Pub/Sub"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        if not GCP_AVAILABLE:
            raise ImportError("google-cloud-pubsub not installed. Install with: pip install google-cloud-pubsub")
        
        project_id = config.get('project_id')
        topic_name = config.get('topic_name')
        subscription_name = config.get('subscription_name')
        credentials_json = config.get('credentials')
        
        if not project_id or not subscription_name:
            raise ValueError("project_id and subscription_name are required for GCP Pub/Sub input")

        credentials = _parse_gcp_credentials(credentials_json)

        def _subscriber_client():
            return (
                pubsub_v1.SubscriberClient(credentials=credentials)
                if credentials
                else pubsub_v1.SubscriberClient()
            )

        subscriber = gcp_client_with_adc_retry(credentials_json, _subscriber_client)
        
        subscription_path = subscriber.subscription_path(project_id, subscription_name)
        
        # Pull messages (non-blocking, gets available messages)
        # For workflow execution, we'll pull a batch of messages
        messages = []
        try:
            response = subscriber.pull(
                request={"subscription": subscription_path, "max_messages": 10}
            )
            
            for received_message in response.received_messages:
                message_data = received_message.message.data.decode('utf-8')
                try:
                    messages.append(json.loads(message_data))
                except json.JSONDecodeError:
                    messages.append(message_data)
                
                # Acknowledge the message
                subscriber.acknowledge(
                    request={"subscription": subscription_path, "ack_ids": [received_message.ack_id]}
                )
        except Exception as e:
            # If no messages available, return empty list
            if "not found" in str(e).lower():
                return []
            raise
        
        return messages if len(messages) > 1 else (messages[0] if messages else None)
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Publish data to GCP Pub/Sub topic"""
        if not GCP_AVAILABLE:
            raise ImportError("google-cloud-pubsub not installed. Install with: pip install google-cloud-pubsub")
        
        project_id = config.get('project_id')
        topic_name = config.get('topic_name')
        credentials_json = config.get('credentials')
        
        if not project_id or not topic_name:
            raise ValueError("project_id and topic_name are required for GCP Pub/Sub publish")

        credentials = _parse_gcp_credentials(credentials_json)

        def _publisher_client():
            return (
                pubsub_v1.PublisherClient(credentials=credentials)
                if credentials
                else pubsub_v1.PublisherClient()
            )

        publisher = gcp_client_with_adc_retry(credentials_json, _publisher_client)
        
        topic_path = publisher.topic_path(project_id, topic_name)
        
        message_data, _ = _serialize_for_write(data, as_bytes=True, indent=0)
        # P2-12: Add timeout to avoid indefinite block (caller runs in executor)
        future = publisher.publish(topic_path, message_data)
        message_id = future.result(timeout=60)
        
        return {"status": "success", "topic": topic_name, "message_id": message_id}


from .local_file_read_modes import READ_MODE_STRATEGIES, read_full


class LocalFileSystemHandler(InputSourceHandler):
    """Handler for reading from local file system"""

    @staticmethod
    def list_directory(
        directory: str = "",
    ) -> Tuple[Path, List[str], List[Dict[str, Any]], bool, Path]:
        """
        List subdirectories and files for the storage browser UI.

        Returns:
            (current_dir, dir_prefixes_with_slash, file_objects, can_go_up, base_path)
        """
        base = get_local_file_base_path().resolve()
        raw = (directory or "").strip()
        if not raw:
            current = base
        else:
            current = Path(os.path.expanduser(raw)).resolve()
        validate_path_within_base(current)
        if not current.is_dir():
            raise ValueError(f"Not a directory: {current}")
        can_go_up = current.resolve() != base.resolve()

        prefixes_out: List[str] = []
        objects_out: List[Dict[str, Any]] = []
        try:
            children = sorted(
                current.iterdir(),
                key=lambda p: (not p.is_dir(), p.name.lower()),
            )
        except PermissionError as e:
            raise ValueError(f"Permission denied: {e}") from e

        for child in children:
            try:
                if child.is_dir():
                    prefixes_out.append(str(child.resolve()) + "/")
                elif child.is_file():
                    st = child.stat()
                    updated_iso = None
                    try:
                        t = datetime.fromtimestamp(st.st_mtime, tz=timezone.utc)
                        updated_iso = t.isoformat()
                    except (OSError, ValueError, OverflowError):
                        pass
                    rp = str(child.resolve())
                    objects_out.append(
                        {
                            "name": rp,
                            "display_name": child.name,
                            "size": st.st_size,
                            "updated": updated_iso,
                        }
                    )
            except (OSError, PermissionError):
                continue

        return current, prefixes_out, objects_out, can_go_up, base

    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        file_path = config.get('file_path')
        file_pattern = config.get('file_pattern', '')
        encoding = config.get('encoding', 'utf-8')

        if not file_path or file_path.strip() == '':
            raise ValueError("file_path is required for Local File System input. Please configure the file_path in the node's input_config or pass it as an execution input (e.g., {'file_path': '/path/to/file'}) before executing the workflow.")

        # Expand user path (~) and resolve absolute path
        file_path = os.path.expanduser(file_path)
        path = Path(file_path).resolve()

        # Path traversal protection - ensure path is within allowed base
        validate_path_within_base(path)

        # Check if file exists
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}. Please check that the file exists and the path is correct.")

        if path.is_file():
            read_mode = config.get('read_mode', 'full')
            strategy = READ_MODE_STRATEGIES.get(read_mode, read_full)
            return strategy(path, config, encoding)
        
        elif path.is_dir():
            # Read directory with optional pattern
            if file_pattern:
                # Handle pattern matching
                pattern = str(path / file_pattern)
                files = glob.glob(pattern, recursive=True)
                if not files:
                    # Try without the directory prefix if pattern already includes it
                    files = glob.glob(file_pattern, recursive=True)
            else:
                files = [str(p) for p in path.iterdir() if p.is_file()]
            
            if not files:
                raise FileNotFoundError(f"No files found in directory {file_path}" + (f" matching pattern '{file_pattern}'" if file_pattern else ""))
            
            # Read all matching files (validate each path to prevent traversal via malicious file_pattern)
            results = []
            base_dir = path.resolve()
            for file in files:
                file_path = Path(file).resolve()
                try:
                    file_path.relative_to(base_dir)
                except ValueError:
                    raise ValueError(
                        f"Path '{file_path}' is outside directory '{base_dir}'. "
                        "Invalid file_pattern may contain path traversal."
                    )
                try:
                    with open(file_path, 'r', encoding=encoding) as f:
                        content = f.read()
                        try:
                            results.append(json.loads(content))
                        except json.JSONDecodeError:
                            results.append(content)
                except Exception as e:
                    raise IOError(f"Error reading file {file}: {str(e)}")
            
            return results
        
        else:
            # Provide helpful error message
            if not path.exists():
                raise FileNotFoundError(
                    f"Path {file_path} does not exist. "
                    f"Resolved to: {path}. "
                    f"Please check that the path exists on the server where the workflow is executing."
                )
            else:
                raise ValueError(f"Path {file_path} exists but is neither a file nor a directory")
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Write data to local file system"""
        file_path = config.get('file_path')
        file_pattern = config.get('file_pattern', '')
        encoding = config.get('encoding', 'utf-8')
        overwrite = config.get('overwrite', True)  # Default to True for backward compatibility
        # Handle string "true"/"false" from JSON
        if isinstance(overwrite, str):
            overwrite = overwrite.lower() in ('true', '1', 'yes')
        # P3-3: Never log full config (may contain credentials)
        logger.debug(f"LocalFileSystemHandler.write: overwrite={overwrite} (type: {type(overwrite)}), config keys: {list(config.keys())}")
        
        if not file_path or file_path.strip() == '':
            raise ValueError("file_path is required for Local File System write. Please configure the file_path in the node's input_config or pass it as an execution input (e.g., {'file_path': '/path/to/file'}) before executing the workflow.")
        
        # Expand user path (~) and resolve absolute path
        file_path = os.path.expanduser(file_path)
        path = Path(file_path).resolve()

        # Path traversal protection
        validate_path_within_base(path)

        # If path is a directory and file_pattern is provided, combine them
        if path.is_dir() and file_pattern:
            path = (path / file_pattern).resolve()
            validate_path_within_base(path)
        elif path.is_dir():
            # If it's a directory without a pattern, use a default filename
            raise ValueError(f"file_path '{file_path}' is a directory. Please provide a file_pattern or use a full file path.")
        
        # If overwrite is False and file exists, increment the filename
        file_exists = path.exists()
        logger.debug(f"File path: {path}, exists: {file_exists}, overwrite: {overwrite}")
        if not overwrite and file_exists:
            # Split path into stem and suffix (e.g., "image.jpg" -> stem="image", suffix=".jpg")
            stem = path.stem
            suffix = path.suffix
            parent = path.parent
            
            # Try to find the next available number
            counter = 1
            while True:
                # Create new filename with counter (e.g., "image_1.jpg")
                new_name = f"{stem}_{counter}{suffix}"
                new_path = parent / new_name
                if not new_path.exists():
                    path = new_path
                    logger.debug(f"File exists, using incremented filename: {path}")
                    break
                counter += 1
                # Safety check to prevent infinite loop
                if counter > MAX_FILENAME_INCREMENT_ATTEMPTS:
                    raise ValueError(f"Could not find available filename after {MAX_FILENAME_INCREMENT_ATTEMPTS} attempts. Please clean up files or enable overwrite.")
        elif overwrite and file_exists:
            logger.debug(f"Overwrite enabled: will overwrite existing file {path}")
        
        # Create parent directory if it doesn't exist
        path.parent.mkdir(parents=True, exist_ok=True)
        
        # Detect if data is an image (base64, URL, or binary)
        is_image = False
        image_data = None
        detected_mimetype = None
        
        # Check if data is a base64-encoded image
        if isinstance(data, str):
            # Check for data URL format: data:image/png;base64,...
            if data.startswith('data:image/'):
                # Extract base64 data and mimetype
                try:
                    header, base64_data = data.split(',', 1)
                    mimetype_part = header.split(';')[0]  # data:image/png
                    detected_mimetype = mimetype_part.split(':')[1]  # image/png
                    image_data = base64.b64decode(base64_data)
                    is_image = True
                except Exception as e:
                    logger.warning(f"Failed to decode base64 image data: {e}")
            
            # Check if it's a long base64 string (might be image without data URL prefix)
            elif len(data) > 1000 and all(c in 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=\n\r' for c in data[:1000]):
                # Might be base64 image - try to decode
                try:
                    decoded = base64.b64decode(data)
                    # Check if decoded data looks like an image (PNG/JPEG magic bytes)
                    if decoded[:4] == b'\x89PNG' or decoded[:2] == b'\xff\xd8':
                        image_data = decoded
                        is_image = True
                        detected_mimetype = 'image/png' if decoded[:4] == b'\x89PNG' else 'image/jpeg'
                except Exception:
                    pass
        
        # Check if data is binary (bytes)
        elif isinstance(data, bytes):
            # Check if it's an image by magic bytes
            if data[:4] == b'\x89PNG':
                is_image = True
                image_data = data
                detected_mimetype = 'image/png'
            elif data[:2] == b'\xff\xd8':
                is_image = True
                image_data = data
                detected_mimetype = 'image/jpeg'
            elif data[:4] == b'GIF8':
                is_image = True
                image_data = data
                detected_mimetype = 'image/gif'
            elif data[:8] == b'\x89\x50\x4E\x47\x0D\x0A\x1A\x0A':  # PNG alternative
                is_image = True
                image_data = data
                detected_mimetype = 'image/png'
        
        # Check if data is a dict with image information
        elif isinstance(data, dict):
            # Check for common image keys
            if 'image' in data:
                image_value = data['image']
                if isinstance(image_value, str) and image_value.startswith('data:image/'):
                    try:
                        header, base64_data = image_value.split(',', 1)
                        mimetype_part = header.split(';')[0]
                        detected_mimetype = mimetype_part.split(':')[1]
                        image_data = base64.b64decode(base64_data)
                        is_image = True
                    except Exception:
                        pass
                elif isinstance(image_value, bytes):
                    image_data = image_value
                    is_image = True
            elif 'image_data' in data:
                image_value = data['image_data']
                if isinstance(image_value, str):
                    try:
                        image_data = base64.b64decode(image_value)
                        is_image = True
                    except Exception:
                        pass
                elif isinstance(image_value, bytes):
                    image_data = image_value
                    is_image = True
        
        # If it's an image, write binary data
        if is_image and image_data:
            # Detect mimetype from file extension if not already detected
            if not detected_mimetype:
                detected_mimetype, _ = mimetypes.guess_type(str(path))
                if not detected_mimetype:
                    ext = path.suffix.lower()
                    if ext in ['.png']:
                        detected_mimetype = 'image/png'
                    elif ext in ['.jpg', '.jpeg']:
                        detected_mimetype = 'image/jpeg'
                    elif ext == '.gif':
                        detected_mimetype = 'image/gif'
                    elif ext == '.webp':
                        detected_mimetype = 'image/webp'
                    else:
                        detected_mimetype = 'image/jpeg'  # Default to JPEG
            
            # Log what we're writing
            logger.debug(f"Writing image to {path}: {len(image_data)} bytes, mimetype: {detected_mimetype}")
            
            # Write binary data
            with open(path, 'wb') as f:
                f.write(image_data)
            
            return {"status": "success", "file_path": str(path), "mimetype": detected_mimetype, "type": "image"}
        
        content, _ = _serialize_for_write(data)
        # Detect mimetype from file extension
        mimetype, _ = mimetypes.guess_type(str(path))
        if not mimetype:
            # Fallback for common extensions not in mimetypes
            ext = path.suffix.lower()
            if ext == '.jsonl':
                mimetype = 'application/x-ndjson'  # Newline-delimited JSON
            elif ext == '.json':
                mimetype = 'application/json'
            elif ext == '.txt':
                mimetype = 'text/plain'
            elif ext == '.csv':
                mimetype = 'text/csv'
            else:
                mimetype = 'application/octet-stream'
        
        # Log what we're writing for debugging
        logger.debug(f"Writing to {path}: {len(content)} characters, data type: {type(data)}, mimetype: {mimetype}")
        
        # Write to file
        with open(path, 'w', encoding=encoding) as f:
            f.write(content)
        
        return {"status": "success", "file_path": str(path), "mimetype": mimetype}


# Registry of input source handlers
INPUT_HANDLERS = {
    'gcp_bucket': GCPBucketHandler,
    'aws_s3': AWSS3Handler,
    'gcp_pubsub': GCPPubSubHandler,
    'local_filesystem': LocalFileSystemHandler,
}


def read_from_input_source(node_type: str, config: Dict[str, Any]) -> Any:
    """
    Read data from an input source node.
    
    Args:
        node_type: Type of input source (gcp_bucket, aws_s3, gcp_pubsub, local_filesystem)
        config: Configuration dictionary for the input source
    
    Returns:
        Data read from the input source (dict, list, or string)
    """
    if node_type not in INPUT_HANDLERS:
        raise ValueError(f"Unknown input source type: {node_type}")
    
    handler = INPUT_HANDLERS[node_type]
    return handler.read(config)


def write_to_input_source(node_type: str, config: Dict[str, Any], data: Any) -> Any:
    """
    Write data to an input source node.
    
    Args:
        node_type: Type of input source (gcp_bucket, aws_s3, gcp_pubsub, local_filesystem)
        config: Configuration dictionary for the input source
        data: Data to write (dict, list, or string)
    
    Returns:
        Result of write operation (dict with status and details)
    """
    if node_type not in INPUT_HANDLERS:
        raise ValueError(f"Unknown input source type: {node_type}")
    
    handler = INPUT_HANDLERS[node_type]
    return handler.write(config, data)


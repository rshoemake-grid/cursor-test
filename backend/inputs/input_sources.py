"""
Input source handlers for reading from various data sources.
Supports GCP Buckets, AWS S3, GCP Pub/Sub, and Local File System.
"""
import json
import os
from typing import Dict, Any, Optional, List
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
        
        # Initialize GCS client
        if credentials_json:
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                client = storage.Client(credentials=credentials)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON credentials for GCP")
        else:
            # Use default credentials (from environment or metadata service)
            client = storage.Client()
        
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
            # List all objects in bucket
            blobs = bucket.list_blobs()
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
        
        # Initialize GCS client
        if credentials_json:
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                client = storage.Client(credentials=credentials)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON credentials for GCP")
        else:
            client = storage.Client()
        
        bucket = client.bucket(bucket_name)
        blob = bucket.blob(object_path)
        
        # Convert data to string (JSON if dict/list, otherwise string)
        if isinstance(data, (dict, list)):
            content = json.dumps(data, indent=2)
            blob.upload_from_string(content, content_type='application/json')
        else:
            blob.upload_from_string(str(data), content_type='text/plain')
        
        return {"status": "success", "bucket": bucket_name, "object": object_path}


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
            except s3_client.exceptions.NoSuchKey:
                raise FileNotFoundError(f"Object {object_key} not found in bucket {bucket_name}")
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
        
        # Convert data to bytes (JSON if dict/list, otherwise string)
        if isinstance(data, (dict, list)):
            content = json.dumps(data, indent=2).encode('utf-8')
            content_type = 'application/json'
        else:
            content = str(data).encode('utf-8')
            content_type = 'text/plain'
        
        s3_client.put_object(
            Bucket=bucket_name,
            Key=object_key,
            Body=content,
            ContentType=content_type
        )
        
        return {"status": "success", "bucket": bucket_name, "key": object_key}


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
        
        # Initialize Pub/Sub client
        if credentials_json:
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                subscriber = pubsub_v1.SubscriberClient(credentials=credentials)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON credentials for GCP")
        else:
            subscriber = pubsub_v1.SubscriberClient()
        
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
        
        # Initialize Pub/Sub client
        if credentials_json:
            try:
                credentials_info = json.loads(credentials_json)
                credentials = service_account.Credentials.from_service_account_info(credentials_info)
                publisher = pubsub_v1.PublisherClient(credentials=credentials)
            except json.JSONDecodeError:
                raise ValueError("Invalid JSON credentials for GCP")
        else:
            publisher = pubsub_v1.PublisherClient()
        
        topic_path = publisher.topic_path(project_id, topic_name)
        
        # Convert data to bytes (JSON if dict/list, otherwise string)
        if isinstance(data, (dict, list)):
            message_data = json.dumps(data).encode('utf-8')
        else:
            message_data = str(data).encode('utf-8')
        
        # Publish message
        future = publisher.publish(topic_path, message_data)
        message_id = future.result()
        
        return {"status": "success", "topic": topic_name, "message_id": message_id}


class LocalFileSystemHandler(InputSourceHandler):
    """Handler for reading from local file system"""
    
    @staticmethod
    def read(config: Dict[str, Any]) -> Any:
        file_path = config.get('file_path')
        file_pattern = config.get('file_pattern', '')
        encoding = config.get('encoding', 'utf-8')
        
        if not file_path:
            raise ValueError("file_path is required for Local File System input")
        
        path = Path(file_path)
        
        if path.is_file():
            # Read single file
            with open(path, 'r', encoding=encoding) as f:
                content = f.read()
            
            # Try to parse as JSON, otherwise return as text
            try:
                return json.loads(content)
            except json.JSONDecodeError:
                return content
        
        elif path.is_dir():
            # Read directory with optional pattern
            if file_pattern:
                pattern = str(path / file_pattern)
                files = glob.glob(pattern, recursive=True)
            else:
                files = [str(p) for p in path.iterdir() if p.is_file()]
            
            # Read all matching files
            results = []
            for file in files:
                with open(file, 'r', encoding=encoding) as f:
                    content = f.read()
                    try:
                        results.append(json.loads(content))
                    except json.JSONDecodeError:
                        results.append(content)
            
            return results
        
        else:
            raise FileNotFoundError(f"Path {file_path} does not exist")
    
    @staticmethod
    def write(config: Dict[str, Any], data: Any) -> Any:
        """Write data to local file system"""
        file_path = config.get('file_path')
        encoding = config.get('encoding', 'utf-8')
        
        if not file_path:
            raise ValueError("file_path is required for Local File System write")
        
        path = Path(file_path)
        
        # Create parent directory if it doesn't exist
        path.parent.mkdir(parents=True, exist_ok=True)
        
        # Convert data to string (JSON if dict/list, otherwise string)
        if isinstance(data, (dict, list)):
            content = json.dumps(data, indent=2)
        else:
            content = str(data)
        
        # Write to file
        with open(path, 'w', encoding=encoding) as f:
            f.write(content)
        
        return {"status": "success", "file_path": file_path}


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


"""Tests for input source handlers"""
import pytest
from unittest.mock import Mock, patch, MagicMock
import json
import tempfile
import os
from pathlib import Path

from backend.inputs.input_sources import (
    GCPBucketHandler,
    AWSS3Handler,
    LocalFileSystemHandler,
    GCPPubSubHandler
)


@pytest.fixture
def temp_dir():
    """Create a temporary directory for file system tests"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


class TestLocalFileSystemHandler:
    """Tests for LocalFileSystemHandler"""
    
    def test_read_file(self, temp_dir):
        """Test reading a file from local filesystem"""
        test_file = os.path.join(temp_dir, "test.json")
        test_data = {"key": "value"}
        
        with open(test_file, "w") as f:
            json.dump(test_data, f)
        
        config = {
            "file_path": test_file,
            "read_mode": "full"
        }
        
        result = LocalFileSystemHandler.read(config)
        assert result == test_data
    
    def test_read_text_file(self, temp_dir):
        """Test reading a text file"""
        test_file = os.path.join(temp_dir, "test.txt")
        test_content = "Hello, World!"
        
        with open(test_file, "w") as f:
            f.write(test_content)
        
        config = {
            "file_path": test_file,
            "read_mode": "full"
        }
        
        result = LocalFileSystemHandler.read(config)
        assert result == test_content
    
    def test_read_file_not_found(self):
        """Test reading non-existent file"""
        config = {
            "file_path": "/nonexistent/file.json"
        }
        
        with pytest.raises(FileNotFoundError):
            LocalFileSystemHandler.read(config)
    
    def test_read_missing_file_path(self):
        """Test reading without file_path"""
        config = {}
        
        with pytest.raises(ValueError, match="file_path is required"):
            LocalFileSystemHandler.read(config)
    
    def test_write_file(self, temp_dir):
        """Test writing a file to local filesystem"""
        test_file = os.path.join(temp_dir, "output.json")
        test_data = {"output": "data"}
        
        config = {
            "file_path": test_file
        }
        
        LocalFileSystemHandler.write(config, test_data)
        
        assert os.path.exists(test_file)
        with open(test_file, "r") as f:
            result = json.load(f)
        assert result == test_data
    
    def test_write_text_file(self, temp_dir):
        """Test writing a text file"""
        test_file = os.path.join(temp_dir, "output.txt")
        test_content = "Hello, World!"
        
        config = {
            "file_path": test_file
        }
        
        LocalFileSystemHandler.write(config, test_content)
        
        assert os.path.exists(test_file)
        with open(test_file, "r") as f:
            result = f.read()
        assert result == test_content


class TestGCPBucketHandler:
    """Tests for GCPBucketHandler"""
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.storage")
    def test_read_object(self, mock_storage):
        """Test reading an object from GCP bucket"""
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob = Mock()
        
        mock_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        mock_blob.exists.return_value = True
        mock_blob.download_as_text.return_value = '{"key": "value"}'
        
        config = {
            "bucket_name": "test-bucket",
            "object_path": "test/object.json",
            "credentials": None
        }
        
        result = GCPBucketHandler.read(config)
        assert result == {"key": "value"}
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.storage")
    def test_read_object_not_found(self, mock_storage):
        """Test reading non-existent object"""
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob = Mock()
        
        mock_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        mock_blob.exists.return_value = False
        
        config = {
            "bucket_name": "test-bucket",
            "object_path": "nonexistent.json"
        }
        
        with pytest.raises(FileNotFoundError):
            GCPBucketHandler.read(config)
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", False)
    def test_read_gcp_not_available(self):
        """Test reading when GCP libraries not available"""
        config = {
            "bucket_name": "test-bucket",
            "object_path": "test.json"
        }
        
        with pytest.raises(ImportError):
            GCPBucketHandler.read(config)
    
    def test_read_missing_bucket_name(self):
        """Test reading without bucket_name"""
        config = {
            "object_path": "test.json"
        }
        
        with pytest.raises(ValueError, match="bucket_name is required"):
            GCPBucketHandler.read(config)


class TestAWSS3Handler:
    """Tests for AWSS3Handler"""
    
    @patch("backend.inputs.input_sources.AWS_AVAILABLE", True)
    @patch("backend.inputs.input_sources.boto3")
    def test_read_object(self, mock_boto3):
        """Test reading an object from AWS S3"""
        mock_s3 = Mock()
        mock_client = Mock()
        mock_response = Mock()
        
        mock_boto3.client.return_value = mock_client
        mock_client.get_object.return_value = mock_response
        mock_response['Body'].read.return_value = b'{"key": "value"}'
        
        config = {
            "bucket_name": "test-bucket",
            "object_key": "test/object.json",
            "aws_access_key_id": "test-key",
            "aws_secret_access_key": "test-secret"
        }
        
        result = AWSS3Handler.read(config)
        assert result == {"key": "value"}
    
    @patch("backend.inputs.input_sources.AWS_AVAILABLE", False)
    def test_read_aws_not_available(self):
        """Test reading when AWS libraries not available"""
        config = {
            "bucket_name": "test-bucket",
            "object_key": "test.json"
        }
        
        with pytest.raises(ImportError):
            AWSS3Handler.read(config)
    
    def test_read_missing_bucket_name(self):
        """Test reading without bucket_name"""
        config = {
            "object_key": "test.json"
        }
        
        with pytest.raises(ValueError, match="bucket_name is required"):
            AWSS3Handler.read(config)


class TestGCPPubSubHandler:
    """Tests for GCPPubSubHandler"""
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.pubsub_v1")
    def test_read_message(self, mock_pubsub):
        """Test reading a message from GCP Pub/Sub"""
        mock_subscriber = Mock()
        mock_subscription_path = Mock()
        mock_pull_response = Mock()
        mock_received_message = Mock()
        
        mock_pubsub.SubscriberClient.return_value = mock_subscriber
        mock_subscriber.subscription_path.return_value = mock_subscription_path
        mock_subscriber.pull.return_value = mock_pull_response
        mock_pull_response.received_messages = [mock_received_message]
        mock_received_message.message.data = b'{"key": "value"}'
        mock_received_message.ack_id = "test-ack-id"
        
        config = {
            "project_id": "test-project",
            "subscription_id": "test-subscription",
            "credentials": None
        }
        
        result = GCPPubSubHandler.read(config)
        assert result == {"key": "value"}
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", False)
    def test_read_pubsub_not_available(self):
        """Test reading when GCP libraries not available"""
        config = {
            "project_id": "test-project",
            "subscription_id": "test-subscription"
        }
        
        with pytest.raises(ImportError):
            GCPPubSubHandler.read(config)
    
    def test_read_missing_project_id(self):
        """Test reading without project_id"""
        config = {
            "subscription_id": "test-subscription"
        }
        
        with pytest.raises(ValueError, match="project_id is required"):
            GCPPubSubHandler.read(config)


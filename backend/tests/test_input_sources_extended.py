"""Extended tests for input source handlers"""
import pytest
from unittest.mock import Mock, patch
import tempfile
import os
import json
from pathlib import Path

from backend.inputs.input_sources import (
    LocalFileSystemHandler,
    GCPBucketHandler,
    AWSS3Handler,
    GCPPubSubHandler
)


@pytest.fixture
def temp_dir():
    """Create a temporary directory for file system tests"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


class TestLocalFileSystemHandlerExtended:
    """Extended tests for LocalFileSystemHandler"""
    
    def test_read_file_lines_mode(self, temp_dir):
        """Test reading file in lines mode"""
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, "w") as f:
            f.write("line1\nline2\nline3\n")
        
        config = {
            "file_path": test_file,
            "read_mode": "lines"
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert "lines" in result
        assert len(result["lines"]) == 3
    
    def test_read_file_batch_mode(self, temp_dir):
        """Test reading file in batch mode"""
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, "w") as f:
            for i in range(100):
                f.write(f"line{i}\n")
        
        config = {
            "file_path": test_file,
            "read_mode": "batch",
            "batch_size": 10
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert "batches" in result
        assert len(result["batches"]) == 10
    
    def test_read_file_tail_mode(self, temp_dir):
        """Test reading file in tail mode"""
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, "w") as f:
            for i in range(50):
                f.write(f"line{i}\n")
        
        config = {
            "file_path": test_file,
            "read_mode": "tail",
            "tail_lines": 10
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert "lines" in result
        assert len(result["lines"]) <= 10
    
    def test_read_directory_with_pattern(self, temp_dir):
        """Test reading directory with file pattern"""
        # Create test files
        with open(os.path.join(temp_dir, "test1.txt"), "w") as f:
            f.write("content1")
        with open(os.path.join(temp_dir, "test2.txt"), "w") as f:
            f.write("content2")
        with open(os.path.join(temp_dir, "other.log"), "w") as f:
            f.write("log")
        
        config = {
            "file_path": temp_dir,
            "file_pattern": "*.txt"
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, list)
        assert len(result) == 2
    
    def test_write_file_overwrite(self, temp_dir):
        """Test writing file with overwrite"""
        test_file = os.path.join(temp_dir, "output.txt")
        
        # Write first time
        config = {
            "file_path": test_file,
            "overwrite": True
        }
        LocalFileSystemHandler.write(config, "First content")
        
        # Write again with overwrite
        LocalFileSystemHandler.write(config, "Second content")
        
        with open(test_file, "r") as f:
            assert f.read() == "Second content"
    
    def test_write_file_no_overwrite(self, temp_dir):
        """Test writing file without overwrite"""
        test_file = os.path.join(temp_dir, "output.txt")
        
        # Write first time
        config = {
            "file_path": test_file,
            "overwrite": True
        }
        LocalFileSystemHandler.write(config, "First content")
        
        # Write again without overwrite
        config["overwrite"] = False
        LocalFileSystemHandler.write(config, "Second content")
        
        # Should create new file
        assert os.path.exists(os.path.join(temp_dir, "output_1.txt"))
    
    def test_write_image_data(self, temp_dir):
        """Test writing image data (base64)"""
        test_file = os.path.join(temp_dir, "image.png")
        
        # Base64 encoded 1x1 PNG
        base64_image = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        
        config = {
            "file_path": test_file
        }
        
        LocalFileSystemHandler.write(config, base64_image)
        assert os.path.exists(test_file)
        assert os.path.getsize(test_file) > 0
    
    def test_read_image_file(self, temp_dir):
        """Test reading image file"""
        test_file = os.path.join(temp_dir, "test.png")
        
        # Create a minimal PNG file
        import base64
        png_data = base64.b64decode("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==")
        with open(test_file, "wb") as f:
            f.write(png_data)
        
        config = {
            "file_path": test_file
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, str)
        assert result.startswith("data:image/png;base64,")


class TestGCPBucketHandlerExtended:
    """Extended tests for GCPBucketHandler"""
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.storage")
    def test_write_object(self, mock_storage):
        """Test writing an object to GCP bucket"""
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob = Mock()
        
        mock_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.blob.return_value = mock_blob
        
        config = {
            "bucket_name": "test-bucket",
            "object_path": "test/object.json",
            "credentials": None
        }
        
        result = GCPBucketHandler.write(config, {"key": "value"})
        assert result["status"] == "success"
        mock_blob.upload_from_string.assert_called_once()
    
    @patch("backend.inputs.input_sources.GCP_AVAILABLE", True)
    @patch("backend.inputs.input_sources.storage")
    def test_list_objects(self, mock_storage):
        """Test listing objects in bucket"""
        mock_client = Mock()
        mock_bucket = Mock()
        mock_blob1 = Mock()
        mock_blob1.name = "file1.txt"
        mock_blob2 = Mock()
        mock_blob2.name = "file2.txt"
        
        mock_storage.Client.return_value = mock_client
        mock_client.bucket.return_value = mock_bucket
        mock_bucket.list_blobs.return_value = [mock_blob1, mock_blob2]
        
        config = {
            "bucket_name": "test-bucket",
            "object_path": ""
        }
        
        result = GCPBucketHandler.read(config)
        assert isinstance(result, list)
        assert len(result) == 2


class TestAWSS3HandlerExtended:
    """Extended tests for AWSS3Handler"""
    
    @patch("backend.inputs.input_sources.AWS_AVAILABLE", True)
    def test_write_object(self):
        """Test writing an object to AWS S3"""
        try:
            import boto3
        except ImportError:
            pytest.skip("boto3 not installed")
        
        with patch("boto3.client") as mock_boto_client:
            mock_client = Mock()
            mock_boto_client.return_value = mock_client
            
            config = {
                "bucket_name": "test-bucket",
                "object_key": "test/object.json",
                "aws_access_key_id": "test-key",
                "aws_secret_access_key": "test-secret"
            }
            
            result = AWSS3Handler.write(config, {"key": "value"})
            assert result["status"] == "success"
            mock_client.put_object.assert_called_once()
    
    @patch("backend.inputs.input_sources.AWS_AVAILABLE", True)
    def test_list_objects(self):
        """Test listing objects in S3 bucket"""
        try:
            import boto3
        except ImportError:
            pytest.skip("boto3 not installed")
        
        with patch("boto3.client") as mock_boto_client:
            mock_client = Mock()
            mock_response = Mock()
            mock_response.get.return_value = [
                {"Key": "file1.txt"},
                {"Key": "file2.txt"}
            ]
            mock_client.list_objects_v2.return_value = mock_response
            mock_boto_client.return_value = mock_client
            
            config = {
                "bucket_name": "test-bucket",
                "object_key": ""
            }
            
            result = AWSS3Handler.read(config)
            assert isinstance(result, list)
            assert len(result) == 2


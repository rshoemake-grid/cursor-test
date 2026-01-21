"""Extended tests for LocalFileSystemHandler - all read modes and edge cases"""
import pytest
import tempfile
import os
import json
from pathlib import Path

from backend.inputs.input_sources import LocalFileSystemHandler


@pytest.fixture
def temp_dir():
    """Create a temporary directory for file system tests"""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


class TestLocalFileSystemHandlerReadModes:
    """Tests for different read modes"""
    
    def test_read_file_tail_mode(self, temp_dir):
        """Test reading file in tail mode"""
        test_file = os.path.join(temp_dir, "test.log")
        with open(test_file, "w") as f:
            for i in range(20):
                f.write(f"Line {i}\n")
        
        config = {
            "file_path": test_file,
            "read_mode": "tail",
            "tail_lines": 5
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert result["read_mode"] == "tail"
        assert len(result["lines"]) == 5
        assert result["lines"][0]["content"] == "Line 15"
    
    def test_read_file_batch_mode(self, temp_dir):
        """Test reading file in batch mode"""
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, "w") as f:
            for i in range(100):
                f.write(f"Line {i}\n")
        
        config = {
            "file_path": test_file,
            "read_mode": "batch",
            "batch_size": 10
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert result["read_mode"] == "batch"
        assert "batches" in result
        assert len(result["batches"]) == 10
    
    def test_read_file_lines_mode(self, temp_dir):
        """Test reading file in lines mode"""
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, "w") as f:
            for i in range(10):
                f.write(f"Line {i}\n")
        
        config = {
            "file_path": test_file,
            "read_mode": "lines"
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert result["read_mode"] == "lines"
        assert "lines" in result
        assert len(result["lines"]) == 10
    
    def test_read_file_tail_mode_empty_file(self, temp_dir):
        """Test tail mode with empty file"""
        test_file = os.path.join(temp_dir, "empty.log")
        Path(test_file).touch()
        
        config = {
            "file_path": test_file,
            "read_mode": "tail",
            "tail_lines": 10
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert result["read_mode"] == "tail"
        assert len(result["lines"]) == 0
    
    def test_read_file_tail_mode_follow(self, temp_dir):
        """Test tail mode with follow option"""
        test_file = os.path.join(temp_dir, "test.log")
        with open(test_file, "w") as f:
            f.write("Initial line\n")
        
        config = {
            "file_path": test_file,
            "read_mode": "tail",
            "tail_lines": 5,
            "tail_follow": True,
            "tail_wait_timeout": 0.5  # Short timeout for testing
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert result["read_mode"] == "tail"
        assert "follow" in result
    
    def test_read_file_with_json_lines(self, temp_dir):
        """Test reading file with JSON lines"""
        test_file = os.path.join(temp_dir, "test.jsonl")
        with open(test_file, "w") as f:
            for i in range(5):
                json.dump({"id": i, "value": f"item{i}"}, f)
                f.write("\n")
        
        config = {
            "file_path": test_file,
            "read_mode": "tail",
            "tail_lines": 5,
            "parse_json_lines": True
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        assert len(result["lines"]) == 5
        assert isinstance(result["lines"][0]["content"], dict)
        assert result["lines"][0]["content"]["id"] == 0
    
    def test_read_file_with_invalid_json_lines(self, temp_dir):
        """Test reading file with invalid JSON lines"""
        test_file = os.path.join(temp_dir, "test.jsonl")
        with open(test_file, "w") as f:
            f.write('{"valid": "json"}\n')
            f.write("invalid json\n")
            f.write('{"another": "valid"}\n')
        
        config = {
            "file_path": test_file,
            "read_mode": "tail",
            "tail_lines": 10,
            "parse_json_lines": True
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, dict)
        # Should handle invalid JSON gracefully
        assert len(result["lines"]) == 3


class TestLocalFileSystemHandlerWriteModes:
    """Tests for write operations"""
    
    def test_write_file_overwrite(self, temp_dir):
        """Test writing file with overwrite"""
        test_file = os.path.join(temp_dir, "output.txt")
        
        # Write initial content
        LocalFileSystemHandler.write({"file_path": test_file}, "Initial")
        
        # Overwrite
        LocalFileSystemHandler.write({"file_path": test_file}, "Updated")
        
        with open(test_file, "r") as f:
            assert f.read() == "Updated"
    
    def test_write_file_no_overwrite(self, temp_dir):
        """Test writing file without overwrite"""
        test_file = os.path.join(temp_dir, "output.txt")
        
        # Write initial content
        LocalFileSystemHandler.write({"file_path": test_file}, "Initial")
        
        # Try to write without overwrite
        config = {
            "file_path": test_file,
            "overwrite": False
        }
        
        # Should raise error or skip
        try:
            LocalFileSystemHandler.write(config, "Updated")
            # If it doesn't raise, check that content is unchanged
            with open(test_file, "r") as f:
                assert "Initial" in f.read()
        except (ValueError, FileExistsError):
            pass  # Expected behavior
    
    def test_write_file_with_directory(self, temp_dir):
        """Test writing file in subdirectory"""
        subdir = os.path.join(temp_dir, "subdir")
        os.makedirs(subdir, exist_ok=True)
        test_file = os.path.join(subdir, "output.txt")
        
        LocalFileSystemHandler.write({"file_path": test_file}, "Content")
        
        assert os.path.exists(test_file)
        with open(test_file, "r") as f:
            assert f.read() == "Content"
    
    def test_write_file_create_directory(self, temp_dir):
        """Test writing file creates directory if needed"""
        test_file = os.path.join(temp_dir, "newdir", "output.txt")
        
        LocalFileSystemHandler.write({"file_path": test_file}, "Content")
        
        assert os.path.exists(test_file)
        with open(test_file, "r") as f:
            assert f.read() == "Content"


class TestLocalFileSystemHandlerDirectoryOperations:
    """Tests for directory operations"""
    
    def test_read_directory_with_pattern(self, temp_dir):
        """Test reading directory with file pattern"""
        # Create test files
        for i in range(5):
            with open(os.path.join(temp_dir, f"file{i}.txt"), "w") as f:
                f.write(f"Content {i}")
            with open(os.path.join(temp_dir, f"other{i}.log"), "w") as f:
                f.write(f"Log {i}")
        
        config = {
            "file_path": temp_dir,
            "file_pattern": "*.txt"
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, list)
        assert len(result) == 5
        # Result is list of file contents (strings or dicts)
        assert all(isinstance(f, (str, dict)) for f in result)
    
    def test_read_directory_no_pattern(self, temp_dir):
        """Test reading directory without pattern"""
        # Create test files
        for i in range(3):
            with open(os.path.join(temp_dir, f"file{i}.txt"), "w") as f:
                f.write(f"Content {i}")
        
        config = {
            "file_path": temp_dir
        }
        
        result = LocalFileSystemHandler.read(config)
        assert isinstance(result, list)
        assert len(result) >= 3


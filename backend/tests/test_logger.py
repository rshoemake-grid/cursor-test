"""
Tests for logging infrastructure.
"""
import logging
import tempfile
import os
from pathlib import Path
from backend.utils.logger import setup_logging, get_logger


def test_setup_logging():
    """Test that logging can be set up"""
    logger = setup_logging(log_level="DEBUG")
    assert logger is not None
    assert logger.level == logging.DEBUG


def test_logger_output(caplog):
    """Test that logger outputs messages correctly"""
    logger = setup_logging(log_level="INFO")
    
    logger.info("Test info message")
    logger.warning("Test warning message")
    logger.error("Test error message")
    
    assert "Test info message" in caplog.text
    assert "Test warning message" in caplog.text
    assert "Test error message" in caplog.text


def test_logger_file_output():
    """Test that logger can write to file"""
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.log') as f:
        log_file = f.name
    
    try:
        logger = setup_logging(log_level="DEBUG", log_file=log_file)
        logger.info("Test file message")
        logger.debug("Test debug message")
        
        # Check file was created and contains messages
        assert os.path.exists(log_file)
        with open(log_file, 'r') as f:
            content = f.read()
            assert "Test file message" in content
            assert "Test debug message" in content
    finally:
        if os.path.exists(log_file):
            os.unlink(log_file)


def test_get_logger():
    """Test that get_logger returns a logger instance"""
    logger = get_logger("test_module")
    assert isinstance(logger, logging.Logger)
    assert logger.name == "test_module"


def test_logger_levels(caplog):
    """Test that different log levels work correctly"""
    logger = setup_logging(log_level="WARNING")
    
    logger.debug("Debug message")  # Should not appear
    logger.info("Info message")     # Should not appear
    logger.warning("Warning message")  # Should appear
    logger.error("Error message")   # Should appear
    
    assert "Debug message" not in caplog.text
    assert "Info message" not in caplog.text
    assert "Warning message" in caplog.text
    assert "Error message" in caplog.text


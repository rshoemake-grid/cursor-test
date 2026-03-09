"""
Unit tests for response_serializers (template_db_to_response, share_db_to_response, version_db_to_response).
"""
import pytest
from datetime import datetime
from unittest.mock import MagicMock

from backend.utils.response_serializers import (
    template_db_to_response,
    share_db_to_response,
    version_db_to_response,
)


class TestTemplateDbToResponse:
    """Tests for template_db_to_response."""

    def test_template_db_to_response_with_author_name(self):
        """Converts WorkflowTemplateDB to WorkflowTemplateResponse with author_name."""
        template = MagicMock()
        template.id = "tpl-1"
        template.name = "Test Template"
        template.description = "A template"
        template.category = "automation"
        template.tags = ["tag1"]
        template.difficulty = "beginner"
        template.estimated_time = "5 min"
        template.is_official = False
        template.uses_count = 10
        template.likes_count = 5
        template.rating = 4
        template.author_id = "user-1"
        template.thumbnail_url = None
        template.preview_image_url = None
        template.created_at = datetime(2024, 1, 1)
        template.updated_at = datetime(2024, 1, 2)

        result = template_db_to_response(template, author_name="alice")
        assert result.id == "tpl-1"
        assert result.name == "Test Template"
        assert result.author_name == "alice"
        assert result.uses_count == 10

    def test_template_db_to_response_without_author_name(self):
        """author_name can be None."""
        template = MagicMock()
        template.id = "tpl-1"
        template.name = "T"
        template.description = None
        template.category = "cat"
        template.tags = []
        template.difficulty = "beginner"
        template.estimated_time = None
        template.is_official = False
        template.uses_count = 0
        template.likes_count = 0
        template.rating = 0
        template.author_id = None
        template.thumbnail_url = None
        template.preview_image_url = None
        template.created_at = datetime(2024, 1, 1)
        template.updated_at = datetime(2024, 1, 1)

        result = template_db_to_response(template)
        assert result.author_name is None


class TestShareDbToResponse:
    """Tests for share_db_to_response."""

    def test_share_db_to_response(self):
        """Converts WorkflowShareDB to WorkflowShareResponse."""
        share = MagicMock()
        share.id = "share-1"
        share.workflow_id = "wf-1"
        share.shared_with_user_id = "user-2"
        share.permission = "edit"
        share.shared_by = "user-1"
        share.created_at = datetime(2024, 1, 1)

        result = share_db_to_response(share)
        assert result.id == "share-1"
        assert result.workflow_id == "wf-1"
        assert result.permission == "edit"


class TestVersionDbToResponse:
    """Tests for version_db_to_response."""

    def test_version_db_to_response(self):
        """Converts WorkflowVersionDB to WorkflowVersionResponse."""
        version = MagicMock()
        version.id = "ver-1"
        version.workflow_id = "wf-1"
        version.version_number = 2
        version.change_notes = "Fixed bug"
        version.created_by = "user-1"
        version.created_at = datetime(2024, 1, 1)

        result = version_db_to_response(version)
        assert result.id == "ver-1"
        assert result.version_number == 2
        assert result.change_notes == "Fixed bug"

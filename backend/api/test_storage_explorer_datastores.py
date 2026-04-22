"""Unit tests for BigQuery / Firestore datastore browse API routes."""
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from backend.api import storage_explorer_routes as ser
from backend.api.storage_explorer_routes import (
    BigQueryListDatasetsRequest,
    BigQueryListTablesRequest,
    FirestoreListCollectionsRequest,
)


@pytest.mark.asyncio
async def test_bigquery_list_datasets_returns_objects():
    fake = [
        {"name": "ds1", "display_name": "ds1", "size": None, "updated": None},
    ]
    with patch.object(ser.DatastoreExplorer, "list_bigquery_datasets", return_value=fake):
        out = await ser.bigquery_list_datasets(
            BigQueryListDatasetsRequest(project_id="my-proj"),
            _user=MagicMock(),
        )
    assert len(out.objects) == 1
    assert out.objects[0].name == "ds1"


@pytest.mark.asyncio
async def test_bigquery_list_tables_returns_objects():
    fake = [
        {"name": "t1", "display_name": "t1", "size": None, "updated": None},
    ]
    with patch.object(ser.DatastoreExplorer, "list_bigquery_tables", return_value=fake):
        out = await ser.bigquery_list_tables(
            BigQueryListTablesRequest(project_id="my-proj", dataset_id="ds1"),
            _user=MagicMock(),
        )
    assert len(out.objects) == 1
    assert out.objects[0].name == "t1"


@pytest.mark.asyncio
async def test_firestore_list_collections_returns_objects():
    fake = [
        {"name": "users", "display_name": "users", "size": None, "updated": None},
    ]
    with patch.object(ser.DatastoreExplorer, "list_firestore_root_collections", return_value=fake):
        out = await ser.firestore_list_collections(
            FirestoreListCollectionsRequest(project_id="my-proj"),
            _user=MagicMock(),
        )
    assert len(out.objects) == 1
    assert out.objects[0].name == "users"


@pytest.mark.asyncio
async def test_bigquery_list_datasets_value_error_is_400():
    with patch.object(
        ser.DatastoreExplorer,
        "list_bigquery_datasets",
        side_effect=ValueError("bad"),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await ser.bigquery_list_datasets(
                BigQueryListDatasetsRequest(project_id="p"),
                _user=MagicMock(),
            )
    assert exc_info.value.status_code == 400

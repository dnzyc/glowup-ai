"""
Tests for Repository layer — all Supabase operations encapsulated.

Tests mock Supabase, no real connection required.
"""

import pytest
from unittest.mock import MagicMock, patch, mock_open
from datetime import datetime, timezone

from services.repositories.base_repository import BaseRepository
from services.repositories.job_repository import JobRepository
from services.repositories.credit_repository import CreditRepository
from services.repositories.storage_repository import StorageRepository


@pytest.fixture
def mock_supabase():
    return MagicMock()


@pytest.fixture
def base_repo(mock_supabase):
    return BaseRepository(supabase=mock_supabase)


@pytest.fixture
def job_repo(mock_supabase):
    return JobRepository(supabase=mock_supabase)


@pytest.fixture
def credit_repo(mock_supabase):
    return CreditRepository(supabase=mock_supabase)


@pytest.fixture
def storage_repo(mock_supabase):
    return StorageRepository(supabase=mock_supabase)


# ──────────────────────────────────────────────
# BaseRepository Tests
# ──────────────────────────────────────────────

class TestBaseRepository:
    def test_init_with_supabase(self, mock_supabase):
        repo = BaseRepository(supabase=mock_supabase)
        assert repo.supabase is mock_supabase

    def test_init_without_supabase_uses_factory(self):
        with patch("services.repositories.base_repository._get_supabase") as mock_factory:
            mock_factory.return_value = MagicMock()
            repo = BaseRepository()
            mock_factory.assert_called_once()
            assert repo.supabase is mock_factory.return_value


# ──────────────────────────────────────────────
# JobRepository Tests
# ──────────────────────────────────────────────

class TestJobRepositoryCreateJob:
    def test_create_job_returns_dict(self, job_repo, mock_supabase):
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{"id": "job-1", "user_id": "u1", "status": "processing", "input_url": "test.png", "media_type": "photo", "credit_cost": 1}]
        )

        result = job_repo.create_job("u1", "processing", "test.png", "photo", 1)

        assert isinstance(result, dict)
        assert result["id"] == "job-1"
        mock_supabase.table.assert_called_with("jobs")
        mock_supabase.table.return_value.insert.assert_called_once()

    def test_create_job_inserts_correct_data(self, job_repo, mock_supabase):
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock(
            data=[{"id": "job-2"}]
        )

        job_repo.create_job("user-123", "processing", "input.jpg", "video", 5)

        call_args = mock_supabase.table.return_value.insert.call_args[0][0]
        assert call_args["user_id"] == "user-123"
        assert call_args["status"] == "processing"
        assert call_args["input_url"] == "input.jpg"
        assert call_args["media_type"] == "video"
        assert call_args["credit_cost"] == 5


class TestJobRepositoryUpdateJobStatus:
    def test_update_job_status_only(self, job_repo, mock_supabase):
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

        job_repo.update_job_status("job-1", "completed")

        mock_supabase.table.assert_called_with("jobs")
        update_data = mock_supabase.table.return_value.update.call_args[0][0]
        assert update_data["status"] == "completed"
        assert "output_url" not in update_data

    def test_update_job_status_with_output_url(self, job_repo, mock_supabase):
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

        job_repo.update_job_status("job-1", "completed", output_url="https://example.com/result.png")

        update_data = mock_supabase.table.return_value.update.call_args[0][0]
        assert update_data["output_url"] == "https://example.com/result.png"
        assert "completed_at" in update_data

    def test_update_job_status_with_completed_at(self, job_repo, mock_supabase):
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()

        job_repo.update_job_status("job-1", "failed", completed_at="2025-01-01T00:00:00Z")

        update_data = mock_supabase.table.return_value.update.call_args[0][0]
        assert update_data["completed_at"] == "2025-01-01T00:00:00Z"


class TestJobRepositoryGetJob:
    def test_get_job_returns_dict(self, job_repo, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={"id": "job-1", "status": "completed"}
        )

        result = job_repo.get_job("job-1")

        assert isinstance(result, dict)
        assert result["id"] == "job-1"
        mock_supabase.table.assert_called_with("jobs")


# ──────────────────────────────────────────────
# CreditRepository Tests
# ──────────────────────────────────────────────

class TestCreditRepositoryGetCredits:
    def test_get_credits_returns_int(self, credit_repo, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={"credits": 42}
        )

        result = credit_repo.get_credits("user-1")

        assert result == 42
        mock_supabase.table.assert_called_with("profiles")

    def test_get_credits_returns_zero_when_no_data(self, credit_repo, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data=None
        )

        result = credit_repo.get_credits("user-1")

        assert result == 0

    def test_get_credits_returns_zero_when_empty_data(self, credit_repo, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={}
        )

        result = credit_repo.get_credits("user-1")

        assert result == 0


class TestCreditRepositoryDeductCredits:
    def test_deduct_credits_returns_true_when_sufficient(self, credit_repo, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={"credits": 10}
        )
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

        result = credit_repo.deduct_credits("user-1", 5)

        assert result is True
        update_data = mock_supabase.table.return_value.update.call_args[0][0]
        assert update_data["credits"] == 5

    def test_deduct_credits_returns_false_when_insufficient(self, credit_repo, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={"credits": 2}
        )

        result = credit_repo.deduct_credits("user-1", 5)

        assert result is False
        mock_supabase.table.return_value.update.assert_not_called()

    def test_deduct_credits_records_transaction(self, credit_repo, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={"credits": 10}
        )
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

        credit_repo.deduct_credits("user-1", 3)

        insert_data = mock_supabase.table.return_value.insert.call_args[0][0]
        assert insert_data["user_id"] == "user-1"
        assert insert_data["amount"] == -3
        assert insert_data["type"] == "usage"


class TestCreditRepositoryAddCredits:
    def test_add_credits_updates_profile(self, credit_repo, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={"credits": 10}
        )
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

        credit_repo.add_credits("user-1", 20, "session-123")

        update_data = mock_supabase.table.return_value.update.call_args[0][0]
        assert update_data["credits"] == 30

    def test_add_credits_records_transaction(self, credit_repo, mock_supabase):
        mock_supabase.table.return_value.select.return_value.eq.return_value.single.return_value.execute.return_value = MagicMock(
            data={"credits": 10}
        )
        mock_supabase.table.return_value.update.return_value.eq.return_value.execute.return_value = MagicMock()
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

        credit_repo.add_credits("user-1", 20, "session-123")

        insert_data = mock_supabase.table.return_value.insert.call_args[0][0]
        assert insert_data["amount"] == 20
        assert insert_data["type"] == "purchase"
        assert insert_data["stripe_session_id"] == "session-123"


class TestCreditRepositoryRecordTransaction:
    def test_record_transaction_inserts(self, credit_repo, mock_supabase):
        mock_supabase.table.return_value.insert.return_value.execute.return_value = MagicMock()

        credit_repo.record_transaction("user-1", 10, "bonus")

        mock_supabase.table.assert_called_with("credit_transactions")
        insert_data = mock_supabase.table.return_value.insert.call_args[0][0]
        assert insert_data["user_id"] == "user-1"
        assert insert_data["amount"] == 10
        assert insert_data["type"] == "bonus"


# ──────────────────────────────────────────────
# StorageRepository Tests
# ──────────────────────────────────────────────

class TestStorageRepositoryUploadResult:
    def test_upload_result_returns_public_url(self, storage_repo, mock_supabase):
        mock_supabase.storage.from_.return_value.upload = MagicMock()
        mock_supabase.storage.from_.return_value.get_public_url.return_value = "https://example.com/result.png"

        result = storage_repo.upload_result("user-1", "job-1", b"file-bytes", ".png")

        assert result == "https://example.com/result.png"
        mock_supabase.storage.from_.assert_called_with("results")

    def test_upload_result_uploads_correct_path(self, storage_repo, mock_supabase):
        mock_supabase.storage.from_.return_value.upload = MagicMock()
        mock_supabase.storage.from_.return_value.get_public_url.return_value = "https://example.com/r.png"

        storage_repo.upload_result("user-1", "job-123", b"data", ".jpg")

        upload_call = mock_supabase.storage.from_.return_value.upload.call_args
        assert upload_call[0][0] == "user-1/job-123_result.jpg"
        assert upload_call[0][1] == b"data"

    def test_upload_result_with_different_extensions(self, storage_repo, mock_supabase):
        mock_supabase.storage.from_.return_value.upload = MagicMock()
        mock_supabase.storage.from_.return_value.get_public_url.return_value = "https://example.com/r.mp4"

        result = storage_repo.upload_result("u1", "j1", b"video", ".mp4")

        upload_call = mock_supabase.storage.from_.return_value.upload.call_args
        assert upload_call[0][0] == "u1/j1_result.mp4"

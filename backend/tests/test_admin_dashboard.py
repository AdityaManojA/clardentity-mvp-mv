"""The admin view: who may open it, and what the dynamic query will run."""

import pytest
from fastapi import HTTPException

from app.api.admin_dashboard import _vet
from app.services.admin_access import admin_emails, is_admin


class _U:
    def __init__(self, email):
        self.email = email


class TestWhoIsAdmin:
    def test_membership_comes_from_configuration_only(self, monkeypatch):
        from app.core import config

        monkeypatch.setattr(config.settings, "admin_emails", "boss@example.com, Second@Example.com")
        assert admin_emails() == {"boss@example.com", "second@example.com"}
        assert is_admin(_U("BOSS@example.com")) is True
        assert is_admin(_U("someone@example.com")) is False

    def test_nobody_is_admin_when_unset(self, monkeypatch):
        from app.core import config

        monkeypatch.setattr(config.settings, "admin_emails", "")
        assert is_admin(_U("anyone@example.com")) is False


class TestQueryGate:
    """The model is told to write one read-only SELECT. This is what happens
    when it doesn't - which is the only part that makes the feature safe."""

    def test_plain_selects_pass(self):
        assert _vet("SELECT count(*) FROM users") == "SELECT count(*) FROM users"
        assert _vet("with x as (select 1) select * from x;").startswith("with x")

    @pytest.mark.parametrize(
        "sql",
        [
            "DELETE FROM users",
            "UPDATE users SET email = 'x'",
            "DROP TABLE users",
            "SELECT 1; DROP TABLE users",
            "INSERT INTO users (email) VALUES ('x')",
            "TRUNCATE messages",
        ],
    )
    def test_anything_that_writes_is_refused(self, sql):
        with pytest.raises(HTTPException) as exc:
            _vet(sql)
        assert exc.value.status_code == 400

    @pytest.mark.parametrize(
        "sql",
        [
            "SELECT content FROM messages",
            "SELECT password_hash FROM users",
            "SELECT transcript FROM audio_transcripts",
            "SELECT claim_text FROM message_claims",
        ],
    )
    def test_what_people_wrote_is_off_limits(self, sql):
        with pytest.raises(HTTPException):
            _vet(sql)

    def test_tables_outside_the_list_are_refused(self):
        with pytest.raises(HTTPException) as exc:
            _vet("SELECT * FROM alembic_version")
        assert "not available" in exc.value.detail

    def test_an_empty_query_is_refused(self):
        with pytest.raises(HTTPException):
            _vet("   ")

"""Tests for the response cache."""

import tempfile
from pathlib import Path

from mygovassist.ai.cache import (
    cache_response,
    cache_stats,
    clear_cache,
    get_cached_response,
)


def _temp_db() -> Path:
    """Create a temporary database path for testing."""
    return Path(tempfile.mktemp(suffix=".db"))


class TestCache:
    def test_cache_miss(self):
        db = _temp_db()
        result = get_cached_response("unknown question", db_path=db)
        assert result is None

    def test_cache_hit(self):
        db = _temp_db()
        cache_response("What is SNAP?", "SNAP is food assistance.", db_path=db)
        result = get_cached_response("What is SNAP?", db_path=db)
        assert result == "SNAP is food assistance."

    def test_normalized_cache_hit(self):
        db = _temp_db()
        cache_response("What is SNAP?", "SNAP is food assistance.", db_path=db)
        # Same question, different case/punctuation
        result = get_cached_response("what is snap", db_path=db)
        assert result == "SNAP is food assistance."

    def test_context_isolation(self):
        db = _temp_db()
        cache_response("Am I eligible?", "Yes", context="income=25000", db_path=db)
        cache_response("Am I eligible?", "No", context="income=100000", db_path=db)

        r1 = get_cached_response("Am I eligible?", context="income=25000", db_path=db)
        r2 = get_cached_response("Am I eligible?", context="income=100000", db_path=db)
        assert r1 == "Yes"
        assert r2 == "No"

    def test_expired_entry_returns_none(self):
        db = _temp_db()
        cache_response("test", "answer", ttl=0, db_path=db)  # 0 second TTL
        import time
        time.sleep(0.1)
        result = get_cached_response("test", db_path=db)
        assert result is None

    def test_clear_cache(self):
        db = _temp_db()
        cache_response("q1", "a1", db_path=db)
        cache_response("q2", "a2", db_path=db)
        deleted = clear_cache(db_path=db)
        assert deleted == 2
        assert get_cached_response("q1", db_path=db) is None

    def test_cache_stats(self):
        db = _temp_db()
        cache_response("q1", "a1", db_path=db)
        cache_response("q2", "a2", db_path=db)
        stats = cache_stats(db_path=db)
        assert stats["total"] == 2
        assert stats["valid"] == 2
        assert stats["expired"] == 0

    def test_cache_overwrite(self):
        db = _temp_db()
        cache_response("test", "old answer", db_path=db)
        cache_response("test", "new answer", db_path=db)
        result = get_cached_response("test", db_path=db)
        assert result == "new answer"

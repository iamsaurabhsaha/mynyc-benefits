"""SQLite response cache with long TTL and versioned invalidation."""

import json
import sqlite3
import time
from pathlib import Path

from mygovassist.ai.normalizer import question_hash

# Default TTLs in seconds
TTL_PROGRAM_INFO = 90 * 86400      # 90 days
TTL_ELIGIBILITY = 365 * 86400      # 365 days
TTL_REGULATION = 30 * 86400        # 30 days
TTL_DEFAULT = 90 * 86400           # 90 days

# Current data version — bump to invalidate all stale entries
DATA_VERSION = "fy2026"


def _get_db_path() -> Path:
    """Get the cache database path."""
    cache_dir = Path.home() / ".mygovassist"
    cache_dir.mkdir(exist_ok=True)
    return cache_dir / "cache.db"


def _get_connection(db_path: Path | None = None) -> sqlite3.Connection:
    """Get a database connection, creating the table if needed."""
    path = db_path or _get_db_path()
    conn = sqlite3.connect(str(path))
    conn.execute("""
        CREATE TABLE IF NOT EXISTS response_cache (
            cache_key TEXT PRIMARY KEY,
            question TEXT NOT NULL,
            response TEXT NOT NULL,
            category TEXT DEFAULT 'general',
            version TEXT NOT NULL,
            created_at REAL NOT NULL,
            ttl INTEGER NOT NULL
        )
    """)
    conn.commit()
    return conn


def get_cached_response(
    question: str,
    context: str = "",
    db_path: Path | None = None,
) -> str | None:
    """Look up a cached response.

    Returns the cached response string if found and not expired, else None.
    """
    key = question_hash(question, context)
    conn = _get_connection(db_path)
    try:
        row = conn.execute(
            "SELECT response, version, created_at, ttl FROM response_cache WHERE cache_key = ?",
            (key,),
        ).fetchone()

        if row is None:
            return None

        response, version, created_at, ttl = row

        # Check version — stale version means invalidated
        if version != DATA_VERSION:
            conn.execute("DELETE FROM response_cache WHERE cache_key = ?", (key,))
            conn.commit()
            return None

        # Check TTL
        if time.time() - created_at > ttl:
            conn.execute("DELETE FROM response_cache WHERE cache_key = ?", (key,))
            conn.commit()
            return None

        return response
    finally:
        conn.close()


def cache_response(
    question: str,
    response: str,
    category: str = "general",
    context: str = "",
    ttl: int | None = None,
    db_path: Path | None = None,
) -> None:
    """Store a response in the cache.

    Args:
        question: The original question.
        response: The response to cache.
        category: Category for TTL selection (program_info, eligibility, regulation, general).
        context: Optional context string for the cache key.
        ttl: Override TTL in seconds. If None, uses category-based default.
        db_path: Override database path (for testing).
    """
    if ttl is None:
        ttl = {
            "program_info": TTL_PROGRAM_INFO,
            "eligibility": TTL_ELIGIBILITY,
            "regulation": TTL_REGULATION,
        }.get(category, TTL_DEFAULT)

    key = question_hash(question, context)
    conn = _get_connection(db_path)
    try:
        conn.execute(
            """INSERT OR REPLACE INTO response_cache
               (cache_key, question, response, category, version, created_at, ttl)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (key, question, response, category, DATA_VERSION, time.time(), ttl),
        )
        conn.commit()
    finally:
        conn.close()


def clear_cache(db_path: Path | None = None) -> int:
    """Clear all cached responses. Returns number of entries deleted."""
    conn = _get_connection(db_path)
    try:
        cursor = conn.execute("DELETE FROM response_cache")
        conn.commit()
        return cursor.rowcount
    finally:
        conn.close()


def cache_stats(db_path: Path | None = None) -> dict:
    """Get cache statistics."""
    conn = _get_connection(db_path)
    try:
        total = conn.execute("SELECT COUNT(*) FROM response_cache").fetchone()[0]
        valid = conn.execute(
            "SELECT COUNT(*) FROM response_cache WHERE version = ? AND (created_at + ttl) > ?",
            (DATA_VERSION, time.time()),
        ).fetchone()[0]
        return {"total": total, "valid": valid, "expired": total - valid, "version": DATA_VERSION}
    finally:
        conn.close()

"""Match user questions against pre-generated static Q&A entries."""

import json
from pathlib import Path

from mygovassist.ai.normalizer import normalize_question

_QA_DATA: list[dict] | None = None


def _load_qa_data() -> list[dict]:
    """Load the static Q&A index."""
    global _QA_DATA
    if _QA_DATA is not None:
        return _QA_DATA

    qa_path = Path(__file__).parent.parent / "static_qa" / "index.json"
    with open(qa_path) as f:
        data = json.load(f)
    _QA_DATA = data["entries"]
    return _QA_DATA


def match_static_qa(question: str, threshold: float = 0.5) -> str | None:
    """Try to match a question against static Q&A entries.

    Uses word overlap scoring between the normalized question
    and each entry's patterns.

    Args:
        question: The user's question.
        threshold: Minimum match score (0-1) to return a result.

    Returns:
        The pre-generated answer if matched, else None.
    """
    entries = _load_qa_data()
    normalized = normalize_question(question)
    query_words = set(normalized.split())

    if not query_words:
        return None

    best_score = 0.0
    best_answer = None

    for entry in entries:
        for pattern in entry["patterns"]:
            pattern_normalized = normalize_question(pattern)
            pattern_words = set(pattern_normalized.split())

            if not pattern_words:
                continue

            # Jaccard similarity
            intersection = query_words & pattern_words
            union = query_words | pattern_words
            score = len(intersection) / len(union) if union else 0

            if score > best_score:
                best_score = score
                best_answer = entry["answer"]

    if best_score >= threshold:
        return best_answer

    return None

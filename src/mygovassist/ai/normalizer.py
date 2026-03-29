"""Question normalization — map variations to canonical form for cache lookups."""

import hashlib
import re


# Common substitutions to normalize question variations
_SUBSTITUTIONS = {
    "what's": "what is",
    "what're": "what are",
    "how's": "how is",
    "i'm": "i am",
    "im": "i am",
    "can't": "cannot",
    "cant": "cannot",
    "don't": "do not",
    "dont": "do not",
    "doesn't": "does not",
    "doesn't": "does not",
    "won't": "will not",
    "wont": "will not",
    "i've": "i have",
    "ive": "i have",
    "food stamps": "snap",
    "food assistance": "snap",
    "ebt": "snap",
    "health insurance": "medicaid",
    "public housing": "section 8",
    "housing voucher": "section 8",
    "metro card": "metrocard",
    "metro-card": "metrocard",
}

# Words to remove (don't affect meaning for cache purposes)
_STOP_WORDS = {
    "a", "an", "the", "is", "are", "was", "were", "be", "been", "being",
    "do", "does", "did", "will", "would", "could", "should", "may", "might",
    "shall", "can", "to", "of", "in", "for", "on", "with", "at", "by",
    "from", "as", "into", "about", "between", "through", "during", "before",
    "after", "above", "below", "up", "down", "out", "off", "over", "under",
    "again", "further", "then", "once", "here", "there", "when", "where",
    "why", "how", "all", "each", "every", "both", "few", "more", "most",
    "other", "some", "such", "no", "nor", "not", "only", "own", "same",
    "so", "than", "too", "very", "just", "because", "but", "and", "or",
    "if", "while", "that", "this", "these", "those", "am", "has", "have",
    "had", "having", "it", "its", "me", "my", "myself", "we", "our",
    "you", "your", "he", "him", "his", "she", "her", "they", "them",
    "their", "which", "who", "whom", "what", "please", "tell", "know",
    "get", "got", "need", "want", "help",
}


def normalize_question(question: str) -> str:
    """Normalize a question to a canonical form for cache lookups.

    Strips punctuation, lowercases, applies substitutions, removes stop words,
    and sorts remaining words for order-independent matching.
    """
    text = question.lower().strip()

    # Remove punctuation
    text = re.sub(r"[^\w\s]", " ", text)

    # Apply substitutions
    for old, new in _SUBSTITUTIONS.items():
        text = text.replace(old, new)

    # Split into words, remove stop words
    words = text.split()
    words = [w for w in words if w not in _STOP_WORDS and len(w) > 1]

    # Sort for order-independent matching
    words.sort()

    return " ".join(words)


def question_hash(question: str, context: str = "") -> str:
    """Generate a cache key hash from a normalized question + optional context.

    Args:
        question: The user's question (will be normalized).
        context: Optional context string (e.g., household info).

    Returns:
        SHA-256 hex digest (first 16 chars) as cache key.
    """
    normalized = normalize_question(question)
    key_input = f"{normalized}|{context}" if context else normalized
    return hashlib.sha256(key_input.encode()).hexdigest()[:16]

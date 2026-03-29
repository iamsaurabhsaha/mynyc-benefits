"""Tests for question normalization."""

from mygovassist.ai.normalizer import normalize_question, question_hash


class TestNormalization:
    def test_case_insensitive(self):
        assert normalize_question("What is SNAP?") == normalize_question("what is snap?")

    def test_punctuation_stripped(self):
        assert normalize_question("What is SNAP?") == normalize_question("What is SNAP")

    def test_contractions_expanded(self):
        assert normalize_question("what's SNAP") == normalize_question("what is SNAP")

    def test_synonyms_normalized(self):
        assert normalize_question("food stamps") == normalize_question("snap")

    def test_word_order_independent(self):
        assert normalize_question("SNAP eligibility") == normalize_question("eligibility SNAP")

    def test_stop_words_removed(self):
        # "what", "is", "the" are stop words
        n1 = normalize_question("What is the SNAP program?")
        n2 = normalize_question("SNAP program")
        assert n1 == n2

    def test_empty_input(self):
        assert normalize_question("") == ""
        assert normalize_question("   ") == ""


class TestQuestionHash:
    def test_same_question_same_hash(self):
        h1 = question_hash("What is SNAP?")
        h2 = question_hash("what is snap")
        assert h1 == h2

    def test_different_context_different_hash(self):
        h1 = question_hash("Am I eligible?", context="income=25000")
        h2 = question_hash("Am I eligible?", context="income=50000")
        assert h1 != h2

    def test_hash_length(self):
        h = question_hash("test question")
        assert len(h) == 16

    def test_deterministic(self):
        h1 = question_hash("What is SNAP?")
        h2 = question_hash("What is SNAP?")
        assert h1 == h2

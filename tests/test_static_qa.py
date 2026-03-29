"""Tests for static Q&A matching."""

from mygovassist.ai.static_qa_matcher import match_static_qa


class TestStaticQAMatching:
    def test_exact_pattern_match(self):
        result = match_static_qa("what is snap")
        assert result is not None
        assert "SNAP" in result

    def test_case_insensitive_match(self):
        result = match_static_qa("What Is SNAP?")
        assert result is not None

    def test_food_stamps_synonym(self):
        result = match_static_qa("what are food stamps")
        assert result is not None
        assert "SNAP" in result

    def test_medicaid_match(self):
        result = match_static_qa("tell me about medicaid")
        assert result is not None
        assert "Medicaid" in result

    def test_fair_fares_match(self):
        result = match_static_qa("what is fair fares")
        assert result is not None
        assert "MetroCard" in result

    def test_life_event_lost_job(self):
        result = match_static_qa("I just lost my job")
        assert result is not None
        assert "Unemployment" in result or "SNAP" in result

    def test_life_event_pregnant(self):
        result = match_static_qa("I'm pregnant what benefits can I get")
        assert result is not None
        assert "Medicaid" in result or "WIC" in result

    def test_undocumented_benefits(self):
        result = match_static_qa("what benefits for undocumented immigrants")
        assert result is not None
        assert "NYC Care" in result or "IDNYC" in result

    def test_no_match_returns_none(self):
        result = match_static_qa("how do I cook pasta")
        assert result is None

    def test_fpl_question(self):
        result = match_static_qa("what is the federal poverty level")
        assert result is not None
        assert "FPL" in result or "Poverty" in result


class TestRouterSimple:
    """Test the rule-based question classifier."""

    def test_eligibility_classification(self):
        from mygovassist.ai.router import classify_question_simple
        assert classify_question_simple("Am I eligible for SNAP?") == "eligibility"
        assert classify_question_simple("Do I qualify for Medicaid?") == "eligibility"

    def test_life_event_classification(self):
        from mygovassist.ai.router import classify_question_simple
        assert classify_question_simple("I just lost my job") == "life_event"
        assert classify_question_simple("I'm pregnant") == "life_event"

    def test_general_info_classification(self):
        from mygovassist.ai.router import classify_question_simple
        assert classify_question_simple("What is SNAP?") == "general_info"
        assert classify_question_simple("How to apply for Fair Fares") == "general_info"

    def test_complex_fallback(self):
        from mygovassist.ai.router import classify_question_simple
        result = classify_question_simple("xyz abc random text")
        assert result == "complex"

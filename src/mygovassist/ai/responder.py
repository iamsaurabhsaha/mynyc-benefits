"""AI responder — generates cited answers using LLM with government document context.

This is the main orchestrator that ties together all 6 cost-saving layers:
1. Static Q&A (Layer 1)
2. Question normalization (Layer 2)
3. Response cache (Layer 3)
4. Prompt caching via system prompt (Layer 4)
5. Small model routing (Layer 5)
6. LLM call with citations (Layer 6 — only if all else misses)
"""

from pathlib import Path

from mygovassist.ai.cache import cache_response, get_cached_response
from mygovassist.ai.provider import chat_completion, is_ai_available
from mygovassist.ai.router import classify_question_simple
from mygovassist.ai.static_qa_matcher import match_static_qa


def _load_system_prompt() -> str:
    """Load the system prompt with NYC government context."""
    prompt_path = Path(__file__).parent / "prompts" / "system.md"
    if prompt_path.exists():
        return prompt_path.read_text()
    return _DEFAULT_SYSTEM_PROMPT


_DEFAULT_SYSTEM_PROMPT = """You are MyGovAssist, a free NYC government benefits assistant.

RULES:
1. ALWAYS cite the specific law, statute, or regulation for every claim you make.
2. NEVER present your output as legal advice. You are a screening tool.
3. If you are not confident about an answer, say so and direct the user to the appropriate agency with a phone number.
4. Use plain language. Assume the user has no legal background.
5. Focus on NYC-specific information. Programs should reference NYC agencies (HRA, NYCHA, etc.) and NYC application methods (ACCESS HRA, etc.).
6. When listing programs, include: eligibility requirements, how to apply, and the legal citation.
7. If a waitlist is closed (e.g., NYCHA Section 8), say so honestly.
8. Recommend the user run 'mygovassist screener' for a personalized eligibility check.

DISCLAIMER: Always include this at the end of your response:
"This is a screening tool, not legal advice. Always verify with the program agency."

NYC PROGRAMS YOU KNOW ABOUT:
- SNAP (food assistance) — 200% FPL in NY (BBCE), apply at ACCESS HRA
- Medicaid — 138% FPL adults, 223% pregnant, Essential Plan up to 200% FPL
- EITC — triple credit in NYC (federal + 30% NY State + NYC)
- Child Tax Credit — $2,000/child, phases out at $200K/$400K
- WIC — 185% FPL, pregnant/postpartum/children under 5
- Section 8/NYCHA — based on AMI, waitlists currently CLOSED
- HEAP — ~150% FPL, heating/cooling assistance
- Fair Fares — 100% FPL, ages 18-64, half-price MetroCard
- NYC Care — uninsured residents, no immigration requirement
- GetFoodNYC — no income test, free food resources
- IDNYC — free municipal ID, no immigration requirement
- NYC Free Tax Prep — income ≤$85K
- SCRIE — seniors 62+, ≤$50K, rent-regulated
- DRIE — disabled, ≤$50K, rent-regulated"""


def get_response(question: str, context: str = "") -> tuple[str, str]:
    """Get a response to a user question, using all cost-saving layers.

    Args:
        question: The user's question.
        context: Optional context (e.g., household info for cache keying).

    Returns:
        Tuple of (response_text, source) where source is one of:
        "static_qa", "cache", "llm", "fallback"
    """
    # Layer 1: Static Q&A — $0
    static_answer = match_static_qa(question)
    if static_answer:
        return static_answer, "static_qa"

    # Layer 3: Response cache — $0
    cached = get_cached_response(question, context)
    if cached:
        return cached, "cache"

    # Layer 5: Route the question
    category = classify_question_simple(question)

    # If AI is not available, provide a helpful fallback
    if not is_ai_available():
        return _fallback_response(question, category), "fallback"

    # Layer 6: LLM call (only when all else misses)
    system_prompt = _load_system_prompt()
    try:
        response = chat_completion(
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question},
            ],
        )

        # Cache the response (Layer 3)
        cache_category = {
            "general_info": "program_info",
            "eligibility": "eligibility",
            "life_event": "program_info",
            "complex": "program_info",
        }.get(category, "program_info")

        cache_response(question, response, category=cache_category, context=context)

        return response, "llm"
    except Exception as e:
        return _fallback_response(question, category, str(e)), "fallback"


def _fallback_response(question: str, category: str, error: str = "") -> str:
    """Provide a helpful response when AI is not available."""
    base = (
        "I can't answer that question right now"
        + (f" ({error})" if error else "")
        + ".\n\n"
    )

    if category == "eligibility":
        return base + (
            "To check your eligibility, run:\n"
            "  `mygovassist screener` — interactive guided check\n"
            "  `mygovassist check --help` — direct eligibility check with flags\n\n"
            "Or visit [ACCESS NYC](https://access.nyc.gov/) for online screening."
        )
    elif category == "life_event":
        return base + (
            "For immediate help:\n"
            "- Call **311** (NYC's helpline)\n"
            "- Visit [ACCESS NYC](https://access.nyc.gov/)\n"
            "- Run `mygovassist screener` for a personalized check"
        )
    else:
        return base + (
            "Try these:\n"
            "- `mygovassist info <program>` — details about a specific program\n"
            "- `mygovassist info --all` — list all programs\n"
            "- `mygovassist screener` — check your eligibility\n\n"
            "To enable AI chat, install litellm (`pip install mygovassist[ai]`) "
            "and set your API key in .env."
        )

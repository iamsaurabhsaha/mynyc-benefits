"""Small model router — classifies questions and routes to the right handler.

Uses a cheap/fast model to classify the question type, then routes:
- eligibility → rules engine (no LLM needed)
- general_info → static Q&A or cache first, then LLM
- life_event → static Q&A or LLM
- complex → large model with citations
"""

from mygovassist.ai.provider import chat_completion, get_routing_model

ROUTE_CATEGORIES = ["eligibility", "general_info", "life_event", "complex"]

_ROUTING_PROMPT = """You are a question classifier for a NYC government benefits assistant.

Classify the user's question into exactly one category:
- "eligibility": User is asking about their specific eligibility for a program (e.g., "Am I eligible for SNAP?", "Do I qualify for Medicaid?")
- "general_info": User is asking general information about a program (e.g., "What is SNAP?", "How do I apply for Fair Fares?")
- "life_event": User is describing a life situation (e.g., "I lost my job", "I'm pregnant", "I'm retiring")
- "complex": Question requires detailed analysis, multiple programs, or regulatory interpretation

Respond with ONLY the category name, nothing else."""


def classify_question(question: str) -> str:
    """Classify a question using the routing model.

    Returns one of: eligibility, general_info, life_event, complex
    Falls back to 'complex' if classification fails.
    """
    try:
        response = chat_completion(
            messages=[
                {"role": "system", "content": _ROUTING_PROMPT},
                {"role": "user", "content": question},
            ],
            model=get_routing_model(),
            temperature=0.0,
            max_tokens=20,
        )
        category = response.strip().lower().strip('"').strip("'")
        if category in ROUTE_CATEGORIES:
            return category
    except Exception:
        pass

    return "complex"


def classify_question_simple(question: str) -> str:
    """Rule-based classification fallback (no LLM needed).

    Uses keyword matching for common patterns. Falls back to 'complex'
    for ambiguous questions.
    """
    q = question.lower()

    # Eligibility keywords
    eligibility_words = [
        "eligible", "qualify", "can i get", "do i qualify", "am i eligible",
        "can i apply", "check my", "income limit",
    ]
    if any(w in q for w in eligibility_words):
        return "eligibility"

    # Life event keywords
    life_events = [
        "lost my job", "laid off", "fired", "unemployed",
        "pregnant", "having a baby", "new baby", "just had",
        "retiring", "turned 62", "turned 65",
        "disabled", "disability",
        "cant pay rent", "evicted", "homeless",
        "lost insurance", "no insurance", "uninsured",
    ]
    if any(w in q for w in life_events):
        return "life_event"

    # General info keywords
    info_words = [
        "what is", "what are", "how to apply", "how do i apply",
        "tell me about", "explain", "where to", "when does",
        "what does", "how much", "who qualifies",
    ]
    if any(w in q for w in info_words):
        return "general_info"

    return "complex"

# MyNYC Benefits

Free, open-source NYC government benefits eligibility screener.

Check what federal, state, and city programs you or your household may qualify for — with direct links to apply and citations to the actual law.

## Why This Exists

NYC spent $600K on a chatbot ([MyCity](https://futurism.com/artificial-intelligence/ai-chatbot-mamdani)) that gave wrong legal advice and was shut down. This project does what that chatbot should have done — accurately, for free, with citations.

## What It Does

**14 programs covered** (7 federal + 7 NYC-specific):

| Category | Programs |
|---|---|
| **Food** | SNAP, WIC, GetFoodNYC |
| **Healthcare** | Medicaid / Essential Plan, NYC Care |
| **Tax Credits** | EITC (triple credit in NYC!), Child Tax Credit |
| **Housing** | Section 8 / NYCHA, SCRIE (senior rent freeze), DRIE (disability rent freeze) |
| **Other** | Fair Fares (half-price MetroCard), HEAP (energy), IDNYC, NYC Free Tax Prep |

Every result includes:
- Eligibility determination with confidence level
- Estimated benefit amount
- Direct link to apply (ACCESS HRA, NY State of Health, etc.)
- Legal citation (statute/regulation)

## How It Works

The eligibility engine uses **rule-based logic**, not AI hallucination. Income thresholds, FPL calculations, and program rules are coded from actual law and verified against government sources. Every data file includes the source URL and date it was last verified.

AI is used only for the conversational chat interface, with 6 cost-saving layers to keep costs near $0:
1. Pre-generated static answers for common questions
2. Question normalization (variations map to the same cache key)
3. SQLite response cache with long TTL (90-365 days)
4. System prompt caching (provider-level discount)
5. Rule-based question routing (eligibility questions skip the LLM)
6. Local LLM support via Ollama ($0)

## Quick Start

```bash
# Requires Python 3.11+
git clone https://github.com/iamsaurabhsaha/mynyc-benefits.git
cd mynyc-benefits
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
```

## Usage

### Check eligibility
```bash
mygovassist check --income 25000 --household-size 3 --num-children 2 --borough brooklyn
```

### Interactive screener
```bash
mygovassist screener
```

### Program info
```bash
mygovassist info snap
mygovassist info --all
```

### AI chat (static answers work without API key)
```bash
mygovassist chat
```

To enable full AI chat with any LLM provider:
```bash
pip install -e ".[ai]"
cp .env.example .env
# Edit .env with your API key, or use Ollama for free:
# LLM_PROVIDER=ollama
```

## Running Tests

```bash
pip install -e ".[dev]"
pytest
```

200 tests covering eligibility scenarios, data integrity, FPL calculations, cache, normalization, and static Q&A matching.

## Architecture

```
mygovassist
├── check      Instant eligibility check (flags)
├── screener   Interactive guided questionnaire
├── info       Program details with citations
└── chat       AI-powered Q&A (6 cost-saving layers)
```

All commands share one eligibility engine in Python. No duplicated logic. Future web/mobile frontends will call the same engine via API.

## Data Accuracy

- Every program data file includes `source_url`, `citation`, and `last_verified`
- Eligibility thresholds are sourced from official government websites
- Automated tests verify data integrity (valid JSON, HTTPS URLs, non-empty citations)
- Scenario tests validate real-world household situations against expected results
- When the engine can't determine eligibility, it says so honestly and directs you to the right agency

## Disclaimer

This is a screening tool, not legal advice. Always verify eligibility with the program agency. Thresholds are based on publicly available government data and may change. See individual program data files for source URLs and verification dates.

## Roadmap

- [ ] Web frontend (Next.js + USWDS for government accessibility standards)
- [ ] iOS / Android (Capacitor)
- [ ] Mac / Windows desktop (Tauri)
- [ ] NYC business regulations (Phase 3)
- [ ] Additional cities
- [ ] Government handover readiness (Terraform for Azure, ADRs, runbooks)

## License

[MIT](LICENSE) — free to use, modify, and distribute.

## Contributing

This project is built to help people. Contributions welcome — especially:
- Verifying/updating eligibility thresholds
- Adding new NYC programs
- Translations (Spanish, Chinese, etc.)
- Accessibility improvements

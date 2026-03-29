"""Core eligibility engine — evaluates household against program rules."""

import json
from pathlib import Path

from mygovassist.eligibility.fpl import income_as_pct_fpl, income_at_pct_fpl
from mygovassist.eligibility.models import EligibilityResult, Household, ProgramData

DATA_DIR = Path(__file__).parent.parent / "data"


def _load_programs() -> list[ProgramData]:
    """Load all program definitions from JSON data files."""
    programs = []
    for subdir in ["federal", "nyc"]:
        data_path = DATA_DIR / subdir
        if not data_path.exists():
            continue
        for file in sorted(data_path.glob("*.json")):
            with open(file) as f:
                data = json.load(f)
                programs.append(ProgramData(**data))
    return programs


def get_program(program_id: str) -> ProgramData | None:
    """Get a single program by ID."""
    for p in _load_programs():
        if p.program == program_id:
            return p
    return None


def get_all_programs() -> list[ProgramData]:
    """Get all available programs."""
    return _load_programs()


def check_eligibility(household: Household) -> list[EligibilityResult]:
    """Check eligibility for all programs."""
    programs = _load_programs()
    results = []
    for program in programs:
        result = _evaluate_program(program, household)
        results.append(result)

    # Sort: eligible first, then maybe, then not eligible
    order = {True: 0, None: 1, False: 2}
    results.sort(key=lambda r: order.get(r.eligible, 3))
    return results


def _evaluate_program(program: ProgramData, household: Household) -> EligibilityResult:
    """Evaluate a single program against a household."""
    # Dispatch to program-specific checker
    checkers = {
        "snap": _check_snap,
        "medicaid": _check_medicaid,
        "eitc": _check_eitc,
        "ctc": _check_ctc,
        "wic": _check_wic,
        "section8": _check_section8,
        "heap": _check_heap,
        "fair_fares": _check_fair_fares,
        "nyc_care": _check_nyc_care,
        "getfood": _check_getfood,
        "idnyc": _check_idnyc,
        "free_tax_prep": _check_free_tax_prep,
        "scrie": _check_scrie,
        "drie": _check_drie,
    }

    checker = checkers.get(program.program)
    if checker:
        eligible, confidence, estimated_benefit, notes = checker(program, household)
    else:
        eligible, confidence, estimated_benefit, notes = None, "low", None, "Program checker not implemented."

    return EligibilityResult(
        program=program.program,
        display_name=program.display_name,
        eligible=eligible,
        confidence=confidence,
        estimated_benefit=estimated_benefit,
        how_to_apply=program.how_to_apply,
        apply_url=program.apply_url,
        apply_in_person=program.apply_in_person,
        citation=program.citation,
        source_url=program.source_url,
        notes=notes,
        related_programs=program.related_programs,
    )


type _CheckResult = tuple[bool | None, str, str | None, str | None]


def _check_snap(program: ProgramData, h: Household) -> _CheckResult:
    """SNAP eligibility: NY uses 200% FPL gross income (BBCE), no asset test."""
    if not h.is_us_citizen_or_pr:
        return False, "high", None, "SNAP requires US citizenship or qualified immigrant status."

    elig = program.eligibility
    gross_pct = elig.get("gross_income_pct_fpl", 200)
    net_pct = elig.get("net_income_pct_fpl", 100)

    pct_fpl = income_as_pct_fpl(h.annual_income, h.household_size)

    if pct_fpl > gross_pct:
        return False, "high", None, f"Income exceeds {gross_pct}% FPL gross income limit."

    if pct_fpl <= net_pct:
        return True, "high", _estimate_snap_benefit(h), None

    # Between net and gross — likely eligible but depends on deductions
    return True, "medium", _estimate_snap_benefit(h), (
        f"Income is between {net_pct}% and {gross_pct}% FPL. "
        "Final eligibility depends on allowable deductions (shelter, childcare, etc.)."
    )


def _estimate_snap_benefit(h: Household) -> str | None:
    """Rough SNAP benefit estimate based on max allotments FY2025."""
    # FY2025 max SNAP allotments (48 states + DC)
    max_allotments = {
        1: 292, 2: 536, 3: 768, 4: 975, 5: 1158,
        6: 1390, 7: 1536, 8: 1756,
    }
    size = min(h.household_size, 8)
    max_benefit = max_allotments.get(size)
    if max_benefit:
        if h.household_size > 8:
            max_benefit += (h.household_size - 8) * 220
        return f"Up to ${max_benefit}/month"
    return None


def _check_medicaid(program: ProgramData, h: Household) -> _CheckResult:
    """Medicaid eligibility in NY."""
    elig = program.eligibility
    pct_fpl = income_as_pct_fpl(h.annual_income, h.household_size)

    # Check pregnancy
    if h.is_pregnant:
        pregnant_limit = elig.get("pregnant_women_pct_fpl", 223)
        if pct_fpl <= pregnant_limit:
            return True, "high", None, "Eligible through Medicaid for pregnant women."

    # Check children
    if h.has_children_under_5 or (h.ages and any(a < 19 for a in h.ages)):
        child_limit = elig.get("children_pct_fpl", 223)
        if pct_fpl <= child_limit:
            return True, "high", None, "Children in household likely eligible for Child Health Plus or Medicaid."

    # Adults
    adult_limit = elig.get("adults_pct_fpl", 138)
    if pct_fpl <= adult_limit:
        return True, "high", None, None

    # Essential Plan (NY-specific, 138-200% FPL)
    essential_plan_limit = elig.get("essential_plan_pct_fpl", 200)
    if pct_fpl <= essential_plan_limit:
        return True, "high", None, (
            "Income exceeds Medicaid limit but you may qualify for the "
            "NY Essential Plan ($0-20/month premiums)."
        )

    return False, "high", None, f"Income exceeds {essential_plan_limit}% FPL."


def _check_eitc(program: ProgramData, h: Household) -> _CheckResult:
    """EITC eligibility (federal + NY State + NYC)."""
    if not h.is_employed:
        return False, "high", None, "EITC requires earned income from employment."

    if not h.is_us_citizen_or_pr:
        return False, "high", None, "EITC requires a valid Social Security Number."

    elig = program.eligibility
    limits = elig.get("income_limits", {})

    # Get limit based on filing status and number of children
    children_key = str(min(h.num_children, 3))  # 0, 1, 2, 3+
    status_limits = limits.get(h.filing_status, limits.get("single", {}))
    income_limit = status_limits.get(children_key)

    if income_limit is None:
        return None, "low", None, "Could not determine EITC limit for your filing status."

    if h.annual_income > income_limit:
        return False, "high", None, f"Income exceeds ${income_limit:,} limit for your filing status."

    # Estimate combined federal + state + city EITC
    max_credits = elig.get("max_federal_credit", {})
    federal_max = max_credits.get(children_key, 0)
    ny_state_pct = elig.get("ny_state_eitc_pct", 30)
    nyc_pct = elig.get("nyc_eitc_pct", 5)

    total_max = federal_max + int(federal_max * ny_state_pct / 100) + int(federal_max * nyc_pct / 100)

    return True, "high", f"Up to ${total_max:,}/year (federal + NY + NYC)", (
        "Triple credit: Federal EITC + NY State EITC + NYC EITC."
    )


def _check_ctc(program: ProgramData, h: Household) -> _CheckResult:
    """Child Tax Credit eligibility."""
    if h.num_children == 0:
        return False, "high", None, "Requires qualifying children under 17."

    elig = program.eligibility
    credit_per_child = elig.get("credit_per_child", 2000)
    phase_out = elig.get("phase_out_threshold", {})

    threshold = phase_out.get(h.filing_status, phase_out.get("single", 200000))

    if h.annual_income > threshold:
        # CTC phases out at $50 per $1,000 over threshold
        reduction = ((h.annual_income - threshold) // 1000) * 50
        total_credit = max(0, (credit_per_child * h.num_children) - reduction)
        if total_credit <= 0:
            return False, "high", None, "Income exceeds phase-out threshold."
        return True, "medium", f"~${total_credit:,}/year (reduced by phase-out)", None

    total = credit_per_child * h.num_children
    return True, "high", f"${total:,}/year", None


def _check_wic(program: ProgramData, h: Household) -> _CheckResult:
    """WIC eligibility: pregnant, postpartum, or children under 5."""
    categorical = h.is_pregnant or h.has_children_under_5

    if not categorical:
        return False, "high", None, (
            "WIC is for pregnant/postpartum individuals and children under 5."
        )

    elig = program.eligibility
    income_pct = elig.get("income_pct_fpl", 185)
    pct_fpl = income_as_pct_fpl(h.annual_income, h.household_size)

    if pct_fpl > income_pct:
        # Auto-eligible if on SNAP or Medicaid
        return None, "medium", None, (
            f"Income exceeds {income_pct}% FPL, but you may be automatically eligible "
            "if you receive SNAP or Medicaid."
        )

    return True, "high", None, None


def _check_section8(program: ProgramData, h: Household) -> _CheckResult:
    """Section 8 / NYCHA eligibility."""
    elig = program.eligibility
    income_limit = elig.get("income_limit")

    # Use AMI-based limits if available, otherwise FPL-based
    if income_limit:
        ami_limits = income_limit.get("extremely_low_income", {})
        limit = ami_limits.get(str(h.household_size), ami_limits.get("4"))

        if limit and h.annual_income <= limit:
            eligible = True
        elif limit:
            eligible = False
        else:
            eligible = None
    else:
        eligible = None

    waitlist_note = elig.get("waitlist_status", "Waitlist status unknown. Contact NYCHA directly.")

    if eligible:
        return eligible, "medium", None, waitlist_note
    elif eligible is False:
        return False, "high", None, "Income exceeds Section 8 extremely low income limits."
    return None, "low", None, waitlist_note


def _check_heap(program: ProgramData, h: Household) -> _CheckResult:
    """HEAP (Home Energy Assistance Program) in NY."""
    elig = program.eligibility
    income_pct = elig.get("income_pct_fpl", 150)
    pct_fpl = income_as_pct_fpl(h.annual_income, h.household_size)

    if pct_fpl <= income_pct:
        return True, "high", None, elig.get("program_period_note")

    # Also eligible if receiving SNAP, SSI, or TANF
    return False, "medium", None, (
        f"Income exceeds {income_pct}% FPL. However, you are automatically eligible "
        "if you receive SNAP, SSI, or Temporary Assistance."
    )


def _check_fair_fares(program: ProgramData, h: Household) -> _CheckResult:
    """Fair Fares NYC — half-price MetroCard."""
    elig = program.eligibility
    income_pct = elig.get("income_pct_fpl", 100)
    min_age = elig.get("min_age", 18)
    max_age = elig.get("max_age", 64)

    pct_fpl = income_as_pct_fpl(h.annual_income, h.household_size)

    if pct_fpl > income_pct:
        return False, "high", None, f"Income exceeds {income_pct}% FPL."

    if h.ages:
        primary_age = h.ages[0]
        if primary_age < min_age or primary_age > max_age:
            return False, "high", None, f"Must be between {min_age} and {max_age} years old."

    return True, "high", "Half-price MetroCard", None


def _check_nyc_care(program: ProgramData, h: Household) -> _CheckResult:
    """NYC Care — healthcare for uninsured NYC residents."""
    if h.has_health_insurance:
        return False, "high", None, "NYC Care is for people without health insurance."

    return True, "high", None, (
        "NYC Care provides low-cost healthcare at NYC Health + Hospitals. "
        "No immigration status requirement."
    )


def _check_getfood(program: ProgramData, h: Household) -> _CheckResult:
    """GetFoodNYC — no income test, available to all NYC residents."""
    return True, "high", None, "No income test. Free food resources available to all NYC residents."


def _check_idnyc(program: ProgramData, h: Household) -> _CheckResult:
    """IDNYC — NYC municipal ID card."""
    elig = program.eligibility
    min_age = elig.get("min_age", 10)

    if h.ages and h.ages[0] < min_age:
        return False, "high", None, f"Must be at least {min_age} years old."

    return True, "high", "Free municipal ID", (
        "Available to all NYC residents regardless of immigration status."
    )


def _check_free_tax_prep(program: ProgramData, h: Household) -> _CheckResult:
    """NYC Free Tax Prep."""
    elig = program.eligibility
    income_limit = elig.get("income_limit", 85000)

    if h.annual_income > income_limit:
        return False, "high", None, f"Income exceeds ${income_limit:,} limit."

    return True, "high", "Free tax preparation", None


def _check_scrie(program: ProgramData, h: Household) -> _CheckResult:
    """SCRIE — Senior Citizen Rent Increase Exemption."""
    elig = program.eligibility
    min_age = elig.get("min_age", 62)
    income_limit = elig.get("income_limit", 50000)

    if h.ages and h.ages[0] < min_age:
        return False, "high", None, f"Must be at least {min_age} years old."

    if not h.is_rent_regulated:
        return False, "high", None, "Must live in a rent-regulated apartment."

    if h.annual_income > income_limit:
        return False, "high", None, f"Income exceeds ${income_limit:,} limit."

    return True, "high", "Rent freeze", None


def _check_drie(program: ProgramData, h: Household) -> _CheckResult:
    """DRIE — Disability Rent Increase Exemption."""
    elig = program.eligibility
    income_limit = elig.get("income_limit", 50000)

    if not h.is_disabled:
        return False, "high", None, "Must be receiving disability-related benefits."

    if not h.is_rent_regulated:
        return False, "high", None, "Must live in a rent-regulated apartment."

    if h.annual_income > income_limit:
        return False, "high", None, f"Income exceeds ${income_limit:,} limit."

    return True, "high", "Rent freeze", None

"""Real-world scenario tests for eligibility engine.

These tests represent actual household situations in NYC
and verify the engine returns correct eligibility determinations.
"""

from mygovassist.eligibility.engine import check_eligibility
from mygovassist.eligibility.models import Household


def _is_eligible(results, program_id: str) -> bool | None:
    """Helper to find eligibility for a specific program."""
    for r in results:
        if r.program == program_id:
            return r.eligible
    raise ValueError(f"Program {program_id} not found in results")


class TestSingleParentLowIncome:
    """Single parent, 2 kids (ages 3 and 7), $25K income, Brooklyn."""

    def setup_method(self):
        self.household = Household(
            annual_income=25000,
            household_size=3,
            num_children=2,
            ages=[30, 3, 7],
            filing_status="head_of_household",
            borough="brooklyn",
        )
        self.results = check_eligibility(self.household)

    def test_snap_eligible(self):
        # $25K for 3 people = ~94% FPL, well under 200% BBCE
        assert _is_eligible(self.results, "snap") is True

    def test_medicaid_eligible(self):
        # ~94% FPL, under 138% for adults and 154%/223% for children
        assert _is_eligible(self.results, "medicaid") is True

    def test_eitc_eligible(self):
        # $25K with 2 children, head of household — well under $55,700 limit
        assert _is_eligible(self.results, "eitc") is True

    def test_ctc_eligible(self):
        # 2 children, income well under $200K phase-out
        assert _is_eligible(self.results, "ctc") is True

    def test_wic_eligible(self):
        # Has a 3-year-old (under 5) and income under 185% FPL
        assert _is_eligible(self.results, "wic") is True

    def test_fair_fares_eligible(self):
        # ~94% FPL, under 100% limit, age 30 (18-64)
        assert _is_eligible(self.results, "fair_fares") is True

    def test_free_tax_prep_eligible(self):
        # $25K under $85K limit
        assert _is_eligible(self.results, "free_tax_prep") is True

    def test_getfood_eligible(self):
        # No income test
        assert _is_eligible(self.results, "getfood") is True

    def test_idnyc_eligible(self):
        # Age 30, NYC resident
        assert _is_eligible(self.results, "idnyc") is True

    def test_scrie_not_eligible(self):
        # Age 30, not 62+
        assert _is_eligible(self.results, "scrie") is False

    def test_drie_not_eligible(self):
        # Not disabled
        assert _is_eligible(self.results, "drie") is False


class TestSeniorRentRegulated:
    """Senior, 65, $40K income, rent-regulated apartment, Bronx."""

    def setup_method(self):
        self.household = Household(
            annual_income=40000,
            household_size=1,
            ages=[65],
            borough="bronx",
            is_rent_regulated=True,
        )
        self.results = check_eligibility(self.household)

    def test_scrie_eligible(self):
        # Age 65, income $40K < $50K, rent-regulated
        assert _is_eligible(self.results, "scrie") is True

    def test_snap_not_eligible(self):
        # $40K for 1 person = ~256% FPL, over 200% limit
        assert _is_eligible(self.results, "snap") is False

    def test_medicaid_not_eligible(self):
        # ~256% FPL, over both 138% and Essential Plan 200%
        assert _is_eligible(self.results, "medicaid") is False

    def test_heap_not_eligible(self):
        # ~256% FPL, over 150% limit
        assert _is_eligible(self.results, "heap") is False

    def test_free_tax_prep_eligible(self):
        # $40K < $85K
        assert _is_eligible(self.results, "free_tax_prep") is True

    def test_getfood_eligible(self):
        assert _is_eligible(self.results, "getfood") is True


class TestUndocumentedResident:
    """Undocumented resident, $20K, household of 2, no health insurance."""

    def setup_method(self):
        self.household = Household(
            annual_income=20000,
            household_size=2,
            ages=[35, 10],
            is_us_citizen_or_pr=False,
            has_health_insurance=False,
            borough="queens",
        )
        self.results = check_eligibility(self.household)

    def test_snap_not_eligible(self):
        # Not a US citizen/PR
        assert _is_eligible(self.results, "snap") is False

    def test_eitc_not_eligible(self):
        # Requires SSN
        assert _is_eligible(self.results, "eitc") is False

    def test_nyc_care_eligible(self):
        # Uninsured, no immigration requirement
        assert _is_eligible(self.results, "nyc_care") is True

    def test_idnyc_eligible(self):
        # No immigration requirement
        assert _is_eligible(self.results, "idnyc") is True

    def test_getfood_eligible(self):
        # No requirements
        assert _is_eligible(self.results, "getfood") is True

    def test_free_tax_prep_eligible(self):
        # $20K < $85K
        assert _is_eligible(self.results, "free_tax_prep") is True


class TestMiddleIncome:
    """Middle income family, $90K, 4 people, 2 kids, Manhattan."""

    def setup_method(self):
        self.household = Household(
            annual_income=90000,
            household_size=4,
            num_children=2,
            ages=[40, 38, 12, 8],
            filing_status="married_joint",
            borough="manhattan",
        )
        self.results = check_eligibility(self.household)

    def test_snap_not_eligible(self):
        # $90K for 4 = ~280% FPL, over 200%
        assert _is_eligible(self.results, "snap") is False

    def test_medicaid_not_eligible(self):
        # ~280% FPL, over Essential Plan 200%
        assert _is_eligible(self.results, "medicaid") is False

    def test_ctc_eligible(self):
        # 2 kids, income well under $400K (married joint)
        assert _is_eligible(self.results, "ctc") is True

    def test_free_tax_prep_not_eligible(self):
        # $90K > $85K
        assert _is_eligible(self.results, "free_tax_prep") is False

    def test_fair_fares_not_eligible(self):
        # ~280% FPL, over 100%
        assert _is_eligible(self.results, "fair_fares") is False


class TestDisabledResident:
    """Disabled person, $30K, rent-regulated, Staten Island."""

    def setup_method(self):
        self.household = Household(
            annual_income=30000,
            household_size=1,
            ages=[50],
            is_disabled=True,
            is_rent_regulated=True,
            borough="staten_island",
        )
        self.results = check_eligibility(self.household)

    def test_drie_eligible(self):
        # Disabled, rent-regulated, $30K < $50K
        assert _is_eligible(self.results, "drie") is True

    def test_scrie_not_eligible(self):
        # Age 50, not 62+
        assert _is_eligible(self.results, "scrie") is False

    def test_snap_eligible(self):
        # $30K for 1 = ~192% FPL, under 200%
        assert _is_eligible(self.results, "snap") is True

    def test_medicaid_eligible(self):
        # ~192% FPL — over 138% but under 200% Essential Plan
        assert _is_eligible(self.results, "medicaid") is True

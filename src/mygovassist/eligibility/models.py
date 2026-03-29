"""Data models for household input and eligibility results."""

from pydantic import BaseModel, Field


class Household(BaseModel):
    """Household information used to determine benefits eligibility."""

    annual_income: int = Field(description="Gross annual household income in dollars")
    household_size: int = Field(ge=1, le=20, description="Number of people in household")
    borough: str | None = Field(
        default=None,
        description="NYC borough: manhattan, brooklyn, queens, bronx, staten_island",
    )
    ages: list[int] | None = Field(
        default=None, description="Ages of household members"
    )
    is_pregnant: bool = Field(default=False, description="Anyone in household is pregnant")
    is_disabled: bool = Field(default=False, description="Anyone has a disability")
    is_employed: bool = Field(default=True, description="At least one member is employed")
    filing_status: str = Field(
        default="single",
        description="Tax filing status: single, married_joint, head_of_household",
    )
    num_children: int = Field(default=0, ge=0, description="Number of children in household")
    is_us_citizen_or_pr: bool = Field(
        default=True, description="US citizen or permanent resident"
    )
    is_rent_regulated: bool = Field(
        default=False, description="Living in rent-regulated apartment"
    )
    has_health_insurance: bool = Field(default=True, description="Has health insurance")

    @property
    def max_age(self) -> int | None:
        """Oldest person in household."""
        return max(self.ages) if self.ages else None

    @property
    def min_age(self) -> int | None:
        """Youngest person in household."""
        return min(self.ages) if self.ages else None

    @property
    def has_children_under_5(self) -> bool:
        """Whether household has children under age 5 (for WIC)."""
        if self.ages:
            return any(age < 5 for age in self.ages)
        return False

    @property
    def has_elderly(self) -> bool:
        """Whether household has members 60+ (for various programs)."""
        if self.ages:
            return any(age >= 60 for age in self.ages)
        return False


class EligibilityResult(BaseModel):
    """Result of checking eligibility for a single program."""

    program: str = Field(description="Program ID (e.g., 'snap', 'medicaid')")
    display_name: str = Field(description="Human-readable program name")
    eligible: bool | None = Field(
        description="True=eligible, False=not eligible, None=can't determine"
    )
    confidence: str = Field(
        description="Confidence level: high, medium, low",
        default="high",
    )
    estimated_benefit: str | None = Field(
        default=None, description="Estimated benefit amount (e.g., '$234/month')"
    )
    how_to_apply: str = Field(description="Instructions on how to apply")
    apply_url: str = Field(description="URL to apply online")
    apply_in_person: str | None = Field(
        default=None, description="Where to apply in person"
    )
    citation: str = Field(description="Legal citation (statute/regulation)")
    source_url: str = Field(description="URL where the rule is published")
    notes: str | None = Field(default=None, description="Additional context or caveats")
    related_programs: list[str] = Field(
        default_factory=list, description="IDs of related programs"
    )


class ProgramData(BaseModel):
    """Program definition loaded from JSON data files."""

    program: str
    display_name: str
    agency: str
    local_agency: str | None = None
    description: str
    category: str = Field(description="food, healthcare, tax_credit, housing, energy, other")
    eligibility: dict
    apply_url: str
    apply_in_person: str | None = None
    how_to_apply: str
    citation: str
    source_url: str
    last_verified: str
    next_update: str | None = None
    update_frequency: str
    related_programs: list[str] = Field(default_factory=list)

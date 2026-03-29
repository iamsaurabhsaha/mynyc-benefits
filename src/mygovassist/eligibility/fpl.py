"""Federal Poverty Level (FPL) guidelines for 2025.

Source: HHS ASPE Poverty Guidelines
https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines

The 2025 guidelines are used for programs in FY2025-2026.
The 2026 guidelines are typically published in January 2026.

For the 48 contiguous states and DC (includes New York).
Alaska and Hawaii have higher thresholds — not needed for NYC.
"""

# 2025 Federal Poverty Level guidelines (48 contiguous states + DC)
# Source: https://aspe.hhs.gov/topics/poverty-economic-mobility/poverty-guidelines
# Published: January 2025
FPL_2025 = {
    1: 15650,
    2: 21150,
    3: 26650,
    4: 32150,
    5: 37650,
    6: 43150,
    7: 48650,
    8: 54150,
}

# For each additional person above 8, add this amount
FPL_2025_ADDITIONAL_PERSON = 5500


def get_fpl(household_size: int, year: int = 2025) -> int:
    """Get the Federal Poverty Level for a given household size.

    Args:
        household_size: Number of people in household (1-20).
        year: FPL year. Currently only 2025 is available.

    Returns:
        Annual income at 100% FPL for the given household size.
    """
    if year != 2025:
        raise ValueError(f"FPL data not available for year {year}. Only 2025 is available.")

    fpl_table = FPL_2025
    additional = FPL_2025_ADDITIONAL_PERSON

    if household_size <= 8:
        return fpl_table[household_size]

    return fpl_table[8] + (household_size - 8) * additional


def income_as_pct_fpl(annual_income: int, household_size: int) -> float:
    """Calculate income as a percentage of FPL.

    Args:
        annual_income: Gross annual income in dollars.
        household_size: Number of people in household.

    Returns:
        Income as percentage of FPL (e.g., 130.0 means 130% FPL).
    """
    fpl = get_fpl(household_size)
    return (annual_income / fpl) * 100


def income_at_pct_fpl(household_size: int, pct: int) -> int:
    """Get the income threshold at a given percentage of FPL.

    Args:
        household_size: Number of people in household.
        pct: Percentage of FPL (e.g., 130 for 130% FPL).

    Returns:
        Annual income at the given FPL percentage.
    """
    fpl = get_fpl(household_size)
    return int(fpl * pct / 100)

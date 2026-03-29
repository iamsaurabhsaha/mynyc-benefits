"""Tests for Federal Poverty Level calculations."""

from mygovassist.eligibility.fpl import get_fpl, income_as_pct_fpl, income_at_pct_fpl


def test_fpl_2025_household_of_1():
    assert get_fpl(1) == 15650


def test_fpl_2025_household_of_4():
    assert get_fpl(4) == 32150


def test_fpl_2025_household_of_8():
    assert get_fpl(8) == 54150


def test_fpl_large_household():
    # 8-person + 2 additional = 54150 + 2*5500 = 65150
    assert get_fpl(10) == 65150


def test_income_as_pct_fpl_at_100():
    # $15,650 income for 1 person = 100% FPL
    assert income_as_pct_fpl(15650, 1) == 100.0


def test_income_as_pct_fpl_at_200():
    # $31,300 for 1 person = 200% FPL
    assert income_as_pct_fpl(31300, 1) == 200.0


def test_income_at_pct_fpl_130():
    # 130% FPL for household of 1 = 15650 * 1.3 = 20345
    assert income_at_pct_fpl(1, 130) == 20345


def test_income_at_pct_fpl_200_household_of_3():
    # 200% FPL for 3 people = 26650 * 2 = 53300
    assert income_at_pct_fpl(3, 200) == 53300

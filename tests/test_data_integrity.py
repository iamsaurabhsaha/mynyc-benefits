"""Data integrity tests — verify all program JSON files are valid and complete."""

import json
from pathlib import Path

import pytest

DATA_DIR = Path(__file__).parent.parent / "src" / "mygovassist" / "data"

REQUIRED_FIELDS = [
    "program", "display_name", "agency", "description", "category",
    "eligibility", "apply_url", "how_to_apply", "citation", "source_url",
    "last_verified", "update_frequency",
]

VALID_CATEGORIES = ["food", "healthcare", "tax_credit", "housing", "energy", "other"]


def _all_program_files():
    """Collect all JSON program files."""
    files = []
    for subdir in ["federal", "nyc"]:
        data_path = DATA_DIR / subdir
        if data_path.exists():
            files.extend(data_path.glob("*.json"))
    return files


@pytest.fixture(params=_all_program_files(), ids=lambda p: p.stem)
def program_file(request):
    return request.param


@pytest.fixture
def program_data(program_file):
    with open(program_file) as f:
        return json.load(f)


def test_json_parses(program_file):
    """Every program file must be valid JSON."""
    with open(program_file) as f:
        data = json.load(f)
    assert isinstance(data, dict)


def test_required_fields(program_data, program_file):
    """Every program file must have all required fields."""
    for field in REQUIRED_FIELDS:
        assert field in program_data, f"{program_file.name} missing field: {field}"


def test_valid_category(program_data, program_file):
    """Category must be one of the valid values."""
    assert program_data["category"] in VALID_CATEGORIES, (
        f"{program_file.name} has invalid category: {program_data['category']}"
    )


def test_citation_not_empty(program_data, program_file):
    """Citation must not be empty."""
    assert program_data["citation"].strip(), f"{program_file.name} has empty citation"


def test_source_url_not_empty(program_data, program_file):
    """Source URL must not be empty."""
    assert program_data["source_url"].strip(), f"{program_file.name} has empty source_url"


def test_apply_url_is_https(program_data, program_file):
    """Apply URL should be HTTPS."""
    url = program_data["apply_url"]
    assert url.startswith("https://"), f"{program_file.name} apply_url is not HTTPS: {url}"


def test_program_id_matches_filename(program_data, program_file):
    """Program ID should match the filename (without .json)."""
    assert program_data["program"] == program_file.stem, (
        f"Program ID '{program_data['program']}' doesn't match filename '{program_file.stem}'"
    )


def test_eligibility_is_dict(program_data, program_file):
    """Eligibility field must be a dictionary."""
    assert isinstance(program_data["eligibility"], dict), (
        f"{program_file.name} eligibility is not a dict"
    )


def test_last_verified_format(program_data, program_file):
    """last_verified should be in YYYY-MM-DD format."""
    from datetime import datetime
    date_str = program_data["last_verified"]
    try:
        datetime.strptime(date_str, "%Y-%m-%d")
    except ValueError:
        pytest.fail(f"{program_file.name} last_verified not in YYYY-MM-DD format: {date_str}")


def test_total_program_count():
    """We should have 14 programs total (7 federal + 7 NYC)."""
    files = _all_program_files()
    assert len(files) == 14, f"Expected 14 program files, found {len(files)}"

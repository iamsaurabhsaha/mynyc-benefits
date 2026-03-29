"""Interactive step-by-step benefits eligibility screener."""

import typer
from rich.console import Console
from rich.prompt import IntPrompt, Confirm, Prompt

from mygovassist.cli.display import display_results
from mygovassist.eligibility.engine import check_eligibility
from mygovassist.eligibility.models import Household

console = Console()

BOROUGHS = ["manhattan", "brooklyn", "queens", "bronx", "staten_island"]
FILING_STATUSES = ["single", "married_joint", "head_of_household"]


def run_screener() -> None:
    """Run the interactive eligibility screener."""
    console.print()
    console.print(
        "[bold blue]MyGovAssist — NYC Benefits Screener[/bold blue]\n"
        "Answer a few questions to find programs you may qualify for.\n"
        "[dim]No personal information is stored. This is a screening tool, not legal advice.[/dim]\n"
    )

    # Household basics
    household_size = IntPrompt.ask(
        "[bold]How many people live in your household?[/bold]", default=1
    )
    annual_income = IntPrompt.ask(
        "[bold]What is your household's total annual income (before taxes)?[/bold] $"
    )

    # Location
    console.print("\n[bold]Which NYC borough do you live in?[/bold]")
    for i, b in enumerate(BOROUGHS, 1):
        console.print(f"  {i}. {b.title()}")
    borough_idx = IntPrompt.ask("Enter number", default=1)
    borough = BOROUGHS[max(0, min(borough_idx - 1, len(BOROUGHS) - 1))]

    # Age
    age = IntPrompt.ask("\n[bold]What is your age?[/bold]")
    ages = [age]

    # Children
    num_children = IntPrompt.ask(
        "\n[bold]How many children (under 18) in your household?[/bold]", default=0
    )
    if num_children > 0:
        console.print("[dim]We'll ask about children's ages for WIC eligibility.[/dim]")
        for i in range(num_children):
            child_age = IntPrompt.ask(f"  Age of child {i + 1}")
            ages.append(child_age)

    # Specific conditions
    console.print()
    is_pregnant = Confirm.ask("Is anyone in your household pregnant?", default=False)
    is_disabled = Confirm.ask("Does anyone have a disability?", default=False)
    is_employed = Confirm.ask(
        "Is at least one household member currently employed?", default=True
    )
    is_citizen = Confirm.ask(
        "Is the primary applicant a US citizen or permanent resident?", default=True
    )
    has_insurance = Confirm.ask("Do you currently have health insurance?", default=True)
    is_rent_regulated = Confirm.ask(
        "Do you live in a rent-regulated (rent-stabilized/controlled) apartment?",
        default=False,
    )

    # Filing status
    console.print("\n[bold]Tax filing status:[/bold]")
    for i, s in enumerate(FILING_STATUSES, 1):
        console.print(f"  {i}. {s.replace('_', ' ').title()}")
    status_idx = IntPrompt.ask("Enter number", default=1)
    filing_status = FILING_STATUSES[max(0, min(status_idx - 1, len(FILING_STATUSES) - 1))]

    # Build household and check
    household = Household(
        annual_income=annual_income,
        household_size=household_size,
        borough=borough,
        ages=ages,
        is_pregnant=is_pregnant,
        is_disabled=is_disabled,
        is_employed=is_employed,
        filing_status=filing_status,
        num_children=num_children,
        is_us_citizen_or_pr=is_citizen,
        is_rent_regulated=is_rent_regulated,
        has_health_insurance=has_insurance,
    )

    console.print("\n[bold]Checking eligibility...[/bold]\n")
    results = check_eligibility(household)
    display_results(results, household)

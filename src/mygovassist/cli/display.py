"""Rich terminal display for eligibility results and program info."""

from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text

from mygovassist.eligibility.models import EligibilityResult, Household, ProgramData

console = Console()


def display_results(results: list[EligibilityResult], household: Household) -> None:
    """Display eligibility results in a formatted table."""
    eligible = [r for r in results if r.eligible is True]
    maybe = [r for r in results if r.eligible is None]
    not_eligible = [r for r in results if r.eligible is False]

    console.print()
    console.print(
        Panel(
            f"[bold]Household:[/bold] {household.household_size} people, "
            f"${household.annual_income:,}/year"
            + (f", {household.borough.title()}" if household.borough else ""),
            title="[bold blue]MyGovAssist — NYC Benefits Screener[/bold blue]",
            subtitle="[dim]This is a screening tool, not legal advice. "
            "Always verify with the program agency.[/dim]",
        )
    )

    if eligible:
        console.print(f"\n[bold green]You likely qualify for {len(eligible)} program(s):[/bold green]\n")
        _print_results_table(eligible)

    if maybe:
        console.print(
            f"\n[bold yellow]May qualify — needs further review ({len(maybe)} program(s)):[/bold yellow]\n"
        )
        _print_results_table(maybe)

    if not_eligible:
        console.print(
            f"\n[dim]Not eligible for {len(not_eligible)} program(s): "
            + ", ".join(r.display_name for r in not_eligible)
            + "[/dim]"
        )

    console.print()


def _print_results_table(results: list[EligibilityResult]) -> None:
    """Print a table of eligibility results."""
    table = Table(show_header=True, header_style="bold", show_lines=True, expand=True)
    table.add_column("Program", style="bold", width=22)
    table.add_column("Est. Benefit", width=14)
    table.add_column("How to Apply", ratio=2)
    table.add_column("Citation", style="dim", width=30)

    for r in results:
        benefit = r.estimated_benefit or "—"
        apply_text = r.how_to_apply
        if r.apply_url:
            apply_text += f"\n[link={r.apply_url}]{r.apply_url}[/link]"
        if r.notes:
            apply_text += f"\n[yellow]{r.notes}[/yellow]"

        table.add_row(r.display_name, benefit, apply_text, r.citation)

    console.print(table)


def display_program_info(program: ProgramData) -> None:
    """Display detailed information about a single program."""
    console.print()
    console.print(Panel(
        f"[bold]{program.display_name}[/bold]\n\n"
        f"{program.description}\n\n"
        f"[bold]Agency:[/bold] {program.agency}"
        + (f" / {program.local_agency}" if program.local_agency else "")
        + f"\n[bold]Category:[/bold] {program.category}\n"
        f"\n[bold]Eligibility:[/bold]\n"
        + _format_eligibility(program.eligibility)
        + f"\n\n[bold]How to Apply:[/bold] {program.how_to_apply}\n"
        f"[bold]Apply Online:[/bold] [link={program.apply_url}]{program.apply_url}[/link]\n"
        + (f"[bold]Apply In Person:[/bold] {program.apply_in_person}\n" if program.apply_in_person else "")
        + f"\n[bold]Legal Citation:[/bold] {program.citation}\n"
        f"[bold]Source:[/bold] [link={program.source_url}]{program.source_url}[/link]\n"
        f"[bold]Last Verified:[/bold] {program.last_verified}\n"
        f"[bold]Update Frequency:[/bold] {program.update_frequency}",
        title=f"[bold blue]{program.program.upper()}[/bold blue]",
    ))
    console.print()


def _format_eligibility(eligibility: dict) -> str:
    """Format eligibility rules as readable text."""
    lines = []
    for key, value in eligibility.items():
        label = key.replace("_", " ").title()
        if isinstance(value, dict):
            for sub_key, sub_value in value.items():
                sub_label = sub_key.replace("_", " ").title()
                lines.append(f"  {sub_label}: {sub_value}")
        elif value is None:
            lines.append(f"  {label}: No requirement")
        else:
            lines.append(f"  {label}: {value}")
    return "\n".join(lines)


def display_all_programs(programs: list[ProgramData]) -> None:
    """Display a summary table of all available programs."""
    console.print()
    table = Table(
        title="[bold blue]NYC Government Benefits Programs[/bold blue]",
        show_header=True,
        header_style="bold",
        show_lines=True,
    )
    table.add_column("ID", style="bold", width=16)
    table.add_column("Program", width=30)
    table.add_column("Category", width=14)
    table.add_column("Description", ratio=2)

    for p in programs:
        table.add_row(p.program, p.display_name, p.category, p.description)

    console.print(table)
    console.print("\n[dim]Run 'mygovassist info <program_id>' for details.[/dim]\n")

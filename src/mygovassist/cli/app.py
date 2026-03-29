"""MyGovAssist CLI — NYC government benefits eligibility screener."""

import typer
from rich.console import Console

app = typer.Typer(
    name="mygovassist",
    help="Free NYC government benefits eligibility screener. "
    "Check what programs you or your household may qualify for.",
    no_args_is_help=True,
)
console = Console()


@app.command()
def check(
    income: int = typer.Option(..., help="Gross annual household income in dollars"),
    household_size: int = typer.Option(..., help="Number of people in household"),
    borough: str = typer.Option(
        None, help="NYC borough (manhattan, brooklyn, queens, bronx, staten_island)"
    ),
    age: int = typer.Option(None, help="Your age"),
    num_children: int = typer.Option(0, help="Number of children in household"),
    is_pregnant: bool = typer.Option(False, help="Anyone in household is pregnant"),
    is_disabled: bool = typer.Option(False, help="Anyone in household has a disability"),
    is_employed: bool = typer.Option(True, help="At least one household member is employed"),
    filing_status: str = typer.Option(
        "single", help="Tax filing status (single, married_joint, head_of_household)"
    ),
    is_citizen: bool = typer.Option(True, help="US citizen or permanent resident"),
    is_rent_regulated: bool = typer.Option(False, help="Living in rent-regulated apartment"),
    has_insurance: bool = typer.Option(True, help="Has health insurance"),
):
    """Check eligibility for NYC government benefits programs."""
    from mygovassist.cli.display import display_results
    from mygovassist.eligibility.engine import check_eligibility
    from mygovassist.eligibility.models import Household

    ages = [age] if age else None

    household = Household(
        annual_income=income,
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

    results = check_eligibility(household)
    display_results(results, household)


@app.command()
def screener():
    """Interactive step-by-step benefits eligibility screener."""
    from mygovassist.cli.screener import run_screener

    run_screener()


@app.command()
def info(
    program: str = typer.Argument(None, help="Program ID (e.g., snap, medicaid, fair_fares)"),
    all_programs: bool = typer.Option(False, "--all", help="Show all programs"),
):
    """Show details about a specific benefits program."""
    from mygovassist.cli.display import display_program_info, display_all_programs
    from mygovassist.eligibility.engine import get_program, get_all_programs

    if all_programs:
        programs = get_all_programs()
        display_all_programs(programs)
    elif program:
        prog = get_program(program)
        if prog:
            display_program_info(prog)
        else:
            console.print(f"[red]Unknown program: {program}[/red]")
            console.print("Run 'mygovassist info --all' to see available programs.")
            raise typer.Exit(1)
    else:
        console.print("Provide a program name or use --all. Run 'mygovassist info --help'.")
        raise typer.Exit(1)


@app.command()
def chat(
    provider: str = typer.Option(None, help="LLM provider (anthropic, openai, gemini, ollama, openrouter)"),
    model: str = typer.Option(None, help="Model to use (overrides default)"),
):
    """AI-powered Q&A about NYC government benefits (Phase 2)."""
    import os

    from rich.markdown import Markdown
    from rich.panel import Panel

    from mygovassist.ai.responder import get_response
    from mygovassist.ai.provider import is_ai_available

    # Override provider/model if specified
    if provider:
        os.environ["LLM_PROVIDER"] = provider
    if model:
        os.environ["LLM_MAIN_MODEL"] = model

    console.print()
    console.print(Panel(
        "[bold blue]MyGovAssist Chat[/bold blue]\n\n"
        "Ask me anything about NYC government benefits.\n"
        "I'll try to answer from pre-generated answers first (free),\n"
        "then from cache, then from AI (with citations).\n\n"
        "[dim]Type 'quit' or 'exit' to leave. Type 'stats' for cache stats.[/dim]\n"
        + ("[green]AI: enabled[/green]" if is_ai_available() else
           "[yellow]AI: not available — using static answers and fallbacks.\n"
           "To enable: pip install mygovassist[ai] && set API key in .env[/yellow]"),
    ))

    while True:
        try:
            console.print()
            question = console.input("[bold cyan]You:[/bold cyan] ").strip()
        except (EOFError, KeyboardInterrupt):
            console.print("\n[dim]Goodbye![/dim]")
            break

        if not question:
            continue

        if question.lower() in ("quit", "exit", "q"):
            console.print("[dim]Goodbye![/dim]")
            break

        if question.lower() == "stats":
            from mygovassist.ai.cache import cache_stats
            stats = cache_stats()
            console.print(f"\n[dim]Cache: {stats['valid']} valid entries, "
                         f"{stats['expired']} expired, version {stats['version']}[/dim]")
            continue

        response, source = get_response(question)

        source_label = {
            "static_qa": "[green]static[/green]",
            "cache": "[blue]cached[/blue]",
            "llm": "[yellow]AI[/yellow]",
            "fallback": "[dim]fallback[/dim]",
        }.get(source, source)

        console.print(f"\n[bold]MyGovAssist[/bold] [{source_label}]:")
        console.print(Markdown(response))
        console.print()

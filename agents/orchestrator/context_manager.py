"""
Orchestrator Smart Context Integration — agents/orchestrator/context_manager.py

Hooks into the artifact lifecycle to:
  1. Auto-index new artifacts into ChromaDB on save
  2. Provide a single-call context loader for any agent

Usage in any agent:

    from agents.orchestrator.context_manager import load_agent_context

    # Instead of manually reading files with [:3000]:
    ctx = load_agent_context(
        context=project_context,          # the PROJ JSON dict
        consumer="backend_dev",           # this agent's ID
        artifact_types=["TIP", "TAD", "MTP", "TAR"],  # what it needs
        max_chars_per_artifact=6000
    )

    # ctx is a dict: {"TIP": "extracted content...", "TAD": "extracted content..."}
    # Pass these into your Task description.

This replaces the pattern:
    with open(tip_path) as f:
        tip_content = f.read()[:3000]
"""

import os
import json
from typing import Optional

from agents.utils.smart_extract import (
    get_context,
    get_multi_context,
    index_artifact,
    CHROMA_AVAILABLE
)


def index_project_artifacts(context: dict):
    """
    Index all artifacts in a project context into ChromaDB.

    Call this once when loading a project, or after each agent completes.
    Idempotent — skips already-indexed artifacts with unchanged content.
    """
    if not CHROMA_AVAILABLE:
        return

    project_id = context.get("project_id", "")
    artifacts = context.get("artifacts", [])

    for artifact in artifacts:
        filepath = artifact.get("path", "")
        atype = artifact.get("type", "")

        if filepath and atype and os.path.exists(filepath):
            try:
                index_artifact(filepath, atype, project_id)
            except Exception as e:
                print(f"⚠️  ChromaDB index failed for {atype}: {e}")


def on_artifact_saved(context: dict, artifact_type: str, filepath: str):
    """
    Hook to call after an agent saves its artifact.
    Indexes the new artifact into ChromaDB.

    Add this to save_context() or call it directly after writing an artifact.
    """
    if not CHROMA_AVAILABLE:
        return

    project_id = context.get("project_id", "")
    if filepath and artifact_type and os.path.exists(filepath):
        try:
            index_artifact(filepath, artifact_type, project_id)
        except Exception as e:
            print(f"⚠️  ChromaDB index failed for {artifact_type}: {e}")


def load_agent_context(context: dict, consumer: str,
                        artifact_types: list,
                        max_chars_per_artifact: int = 6000) -> dict:
    """
    Load smart-extracted context for a specific agent from the project.

    This is the main API that agents should use instead of manual file reads.

    Args:
        context: The project context dict (loaded from PROJ-*.json)
        consumer: The agent ID (e.g., "backend_dev", "pen_test")
        artifact_types: List of artifact type codes to load
                        (e.g., ["TIP", "TAD", "MTP", "TAR"])
        max_chars_per_artifact: Max chars per artifact (default 6000)

    Returns:
        Dict of {artifact_type: extracted_text}
        Missing artifacts return empty string.

    Example:
        ctx = load_agent_context(context, "pen_test",
                                  ["SRR", "BIR", "FIR", "DIR", "DBAR"])
        srr_text = ctx.get("SRR", "")
        bir_text = ctx.get("BIR", "")
    """
    project_id = context.get("project_id", "")

    # Build artifact path lookup from context
    artifact_paths = {}
    for artifact in context.get("artifacts", []):
        atype = artifact.get("type", "")
        path = artifact.get("path", "")
        if atype and path:
            artifact_paths[atype] = path

    # Filter to only requested types that exist
    requested = {}
    for atype in artifact_types:
        path = artifact_paths.get(atype, "")
        if path and os.path.exists(path):
            requested[atype] = path

    # Extract using smart_extract
    return get_multi_context(
        artifacts=requested,
        consumer=consumer,
        project_id=project_id,
        max_chars_per_artifact=max_chars_per_artifact
    )


def format_context_for_prompt(ctx: dict, labels: dict = None) -> str:
    """
    Format extracted context dict into a prompt-ready string.

    Args:
        ctx: Dict from load_agent_context()
        labels: Optional override labels, e.g., {"BIR": "Backend Implementation"}

    Returns:
        Formatted string with labeled sections.

    Example:
        prompt_text = format_context_for_prompt(ctx, {
            "TIP": "Technical Implementation Plan",
            "TAD": "Technical Architecture Document",
        })
    """
    default_labels = {
        "PRD": "Product Requirements Document (PRD)",
        "BAD": "Business Analysis Document (BAD)",
        "SPRINT_PLAN": "Sprint Plan",
        "TAD": "Technical Architecture Document (TAD)",
        "SRR": "Security Review Report (SRR)",
        "UXD": "User Experience Document (UXD)",
        "CONTENT_GUIDE": "UI Content Guide",
        "TIP": "Technical Implementation Plan (TIP)",
        "PBD": "Performance Budget Document (PBD)",
        "MTP": "Master Test Plan (MTP)",
        "TAR": "Test Automation Report (TAR)",
        "BIR": "Backend Implementation Report (BIR)",
        "FIR": "Frontend Implementation Report (FIR)",
        "DBAR": "Database Administration Report (DBAR)",
        "DIR": "DevOps Implementation Report (DIR)",
        "DSKR": "Desktop Implementation Report (DSKR)",
        "DXR": "Developer Experience Report (DXR)",
        "MUXD": "Mobile UX Document (MUXD)",
        "IIR": "iOS Implementation Report (IIR)",
        "AIR": "Android Implementation Report (AIR)",
        "RNAD_P1": "React Native Architecture (Part 1)",
        "RNAD_P2": "React Native Architecture (Part 2)",
        "RN_GUIDE": "React Native Implementation Guide",
        "MDIR": "Mobile DevOps Report (MDIR)",
        "MOBILE_TEST_PLAN": "Mobile Test Plan",
        "PTR": "Penetration Test Report (PTR)",
        "SAR": "Scalability Architecture Report (SAR)",
        "PAR": "Performance Audit Report (PAR)",
        "AAR": "Accessibility Audit Report (AAR)",
        "LCR": "License Compliance Report (LCR)",
    }

    if labels:
        default_labels.update(labels)

    parts = []
    for atype, text in ctx.items():
        if text:
            label = default_labels.get(atype, atype)
            parts.append(f"=== {label} ===\n{text}")
        else:
            label = default_labels.get(atype, atype)
            parts.append(f"=== {label} ===\n(Not available)")

    return "\n\n".join(parts)


# ══════════════════════════════════════════════════════════════════
#  MIGRATION HELPER — update existing agents
# ══════════════════════════════════════════════════════════════════

MIGRATION_EXAMPLE = """
# ─── BEFORE (old pattern) ───────────────────────────────────
#
# with open(tip_path) as f:
#     tip_content = f.read()[:3000]
# with open(tad_path) as f:
#     tad_content = f.read()[:2000]
#
# task = Task(description=f\"\"\"
#     ... {tip_content} ... {tad_content} ...
# \"\"\")

# ─── AFTER (smart extraction) ──────────────────────────────
#
# from agents.orchestrator.context_manager import load_agent_context, format_context_for_prompt
#
# ctx = load_agent_context(context, "backend_dev", ["TIP", "TAD", "MTP", "TAR"])
# prompt_context = format_context_for_prompt(ctx)
#
# task = Task(description=f\"\"\"
#     ... {prompt_context} ...
# \"\"\")

# Benefits:
#   - Backend dev gets API contracts, project structure, module boundaries from TIP
#     (not just the first 3000 chars which might be table of contents)
#   - Gets data architecture and auth from TAD (not the system overview)
#   - Gets relevant test cases from MTP and TAR
#   - ChromaDB fallback catches content in unusual heading structures
"""


if __name__ == "__main__":
    print("Smart Context Manager")
    print("=" * 50)
    print()
    print("This module provides smart artifact extraction for all agents.")
    print()
    print("Usage in agent files:")
    print(MIGRATION_EXAMPLE)
    print()
    if CHROMA_AVAILABLE:
        print("✅ ChromaDB available — semantic search enabled")
    else:
        print("⚠️  ChromaDB not installed — section extraction only")
        print("   Install: pip install chromadb --break-system-packages")

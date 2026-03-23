import os
import json
import uuid
from datetime import datetime
from dotenv import load_dotenv
from crewai import Agent, LLM

load_dotenv("config/.env")

from config.langfuse_setup import init_langfuse
init_langfuse()

# ── Notification helpers ──────────────────────────────────────────────────────


def send_pushover(subject: str, message: str, priority: int = 1) -> bool:
    """Send Pushover push notification."""
    import urllib.request, urllib.parse, json
    user_key  = os.getenv("PUSHOVER_USER_KEY", "")
    api_token = os.getenv("PUSHOVER_API_TOKEN", "")
    if not user_key or not api_token:
        print("⚠️  Pushover credentials not set")
        return False
    try:
        data = urllib.parse.urlencode({
            "token": api_token, "user": user_key,
            "title": subject[:250], "message": message[:1024],
            "priority": priority,
        }).encode("utf-8")
        req = urllib.request.Request(
            "https://api.pushover.net/1/messages.json",
            data=data, method="POST"
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            result = json.loads(resp.read())
            if result.get("status") == 1:
                print(f"📱 Pushover sent: {subject[:60]}")
                return True
            print(f"⚠️  Pushover error: {result}")
            return False
    except Exception as e:
        print(f"⚠️  Pushover failed: {e}")
        return False


def send_sms(message: str) -> bool:
    return send_pushover("Notification", message, priority=1)


def send_email(subject: str, body: str) -> bool:
    return send_pushover(subject, body, priority=0)


def notify_human(subject: str, message: str) -> None:
    """Send notification via SMS (primary) and email (secondary)."""
    sms_sent = send_sms(f"[DEV-TEAM] {subject}\n{message}")
    send_email(f"[DEV-TEAM] {subject}", message)
    if not sms_sent:
        print("⚠️  Primary notification (SMS) failed. Email attempted as fallback.")

# ── Project context ───────────────────────────────────────────────────────────

def create_project_context(natural_language_request: str, classification: str) -> dict:
    """Initialize a structured project context object."""
    return {
        "project_id": f"PROJ-{uuid.uuid4().hex[:8].upper()}",
        "created_at": datetime.utcnow().isoformat(),
        "status": "INITIATED",
        "classification": classification,  # DEV | DS | JOINT
        "original_request": natural_language_request,
        "structured_spec": {},             # Filled by Orchestrator
        "assigned_crew": None,
        "checkpoints": [],
        "handoffs": [],
        "artifacts": [],
        "audit_log": []
    }

def log_event(context: dict, event: str, detail: str = "") -> dict:
    """Append an event to the project audit log."""
    context["audit_log"].append({
        "timestamp": datetime.utcnow().isoformat(),
        "event": event,
        "detail": detail
    })
    return context

def save_context(context: dict) -> None:
    """Persist project context to logs directory."""
    os.makedirs("logs", exist_ok=True)
    path = f"logs/{context['project_id']}.json"
    with open(path, "w") as f:
        json.dump(context, f, indent=2)
    print(f"💾 Context saved: {path}")

# ── Checkpoint handler ────────────────────────────────────────────────────────

def request_human_approval(context: dict, checkpoint_name: str, 
                            summary: str) -> bool:
    """
    Notify human, wait for approval input.
    Returns True if approved, False if rejected.
    """
    message = (
        f"Project: {context['project_id']}\n"
        f"Checkpoint: {checkpoint_name}\n"
        f"Action required: Review and approve to continue.\n\n"
        f"{summary}\n\n"
        f"Reply APPROVE or REJECT in terminal."
    )
    notify_human(f"Approval needed: {checkpoint_name}", message)
    log_event(context, f"CHECKPOINT: {checkpoint_name}", "Awaiting human approval")
    save_context(context)

    print(f"\n{'='*60}")
    print(f"⏸️  CHECKPOINT: {checkpoint_name}")
    print(f"Project: {context['project_id']}")
    print(f"\n{summary}")
    print(f"{'='*60}")

    while True:
        response = input("\nType APPROVE or REJECT: ").strip().upper()
        if response == "APPROVE":
            log_event(context, f"APPROVED: {checkpoint_name}")
            save_context(context)
            return True
        elif response == "REJECT":
            log_event(context, f"REJECTED: {checkpoint_name}")
            save_context(context)
            return False
        else:
            print("Please type APPROVE or REJECT.")

# ── Agent factory ─────────────────────────────────────────────────────────────

def build_devteam_orchestrator() -> Agent:
    """Instantiate and return the Dev-Team Orchestrator agent."""
    llm = LLM(
        model=os.getenv("TIER1_MODEL", "ollama/gpt-oss:120b"),
        base_url=os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    )

    return Agent(
        role="Dev-Team Orchestrator",
        goal=(
            "Receive software development project requests, initialize structured "
            "project context, route to the correct dev sub-team (backend, frontend, "
            "mobile, DevOps, QA), manage checkpoints, coordinate handoffs between "
            "agents, and ensure complete audit trails."
        ),
        backstory=(
            "You are the Dev-Team Orchestrator — the central coordinator for a "
            "federated AI software development system. You manage the full dev "
            "pipeline: product requirements, technical architecture, backend, "
            "frontend, mobile (React Native, DevOps, QA), security review, "
            "infrastructure, and quality assurance. You structure incoming work "
            "into actionable project specs and coordinate execution with human "
            "oversight at every major decision. "
            "You never proceed past a checkpoint without explicit human approval."
        ),
        llm=llm,
        verbose=True,
        allow_delegation=True
    )

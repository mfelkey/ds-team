# RAG Integration Guide

## How to Add Knowledge Injection to Any Agent

### The One-Line Change

Add this import to any agent file:

```python
from agents.shared.knowledge_curator.rag_inject import get_knowledge_context
```

Then in the `run_*` function, before building the Task, query for relevant knowledge:

```python
knowledge = get_knowledge_context(
    agent_role="Backend Developer",
    task_summary="Build REST API for ambulance trip data",
)
```

And include it in the task description:

```python
task = Task(
    description=f"""
    {your_existing_prompt}

    CURRENT KNOWLEDGE (from knowledge base — use only if relevant to this task):
    {knowledge}
    """,
    ...
)
```

That's it. If ChromaDB is empty or unavailable, `knowledge` is an empty string and nothing changes.

---

## Before / After Example: Backend Developer

### BEFORE (no RAG):

```python
def run_backend_developer(context: dict, tip_path: str, tad_path: str) -> dict:
    with open(tip_path) as f:
        tip_content = f.read()[:5000]
    with open(tad_path) as f:
        tad_content = f.read()[:3000]

    agent = build_backend_developer()
    task = Task(
        description=f"""
        Using the Technical Implementation Plan and Architecture:

        TIP:
        {tip_content}

        TAD:
        {tad_content}

        Build the complete backend implementation...
        """,
        expected_output="Backend Implementation Report",
        agent=agent,
    )
    # ... rest unchanged
```

### AFTER (with RAG):

```python
from agents.shared.knowledge_curator.rag_inject import get_knowledge_context

def run_backend_developer(context: dict, tip_path: str, tad_path: str) -> dict:
    with open(tip_path) as f:
        tip_content = f.read()[:5000]
    with open(tad_path) as f:
        tad_content = f.read()[:3000]

    # ── RAG: inject current knowledge ──
    knowledge = get_knowledge_context(
        agent_role="Backend Developer",
        task_summary=f"Backend implementation for {context['structured_spec'].get('title', '')}",
    )

    agent = build_backend_developer()
    task = Task(
        description=f"""
        Using the Technical Implementation Plan and Architecture:

        TIP:
        {tip_content}

        TAD:
        {tad_content}

        CURRENT KNOWLEDGE (from knowledge base — use only if relevant):
        {knowledge}

        Build the complete backend implementation...
        """,
        expected_output="Backend Implementation Report",
        agent=agent,
    )
    # ... rest unchanged
```

---

## Which Agents to Wire Up First

Priority order (highest impact first):

1. **Security Reviewer** — CVE data directly improves SRR quality
2. **DevOps Engineer** — release notes for Docker, Fastlane, etc.
3. **Backend Developer** — framework updates, security patches
4. **RN Developer / RN Architect** — React Native, Expo release notes
5. **Mobile DevOps** — EAS Build, Fastlane, code signing updates
6. **Product Manager / Business Analyst** — VA/CMS policy context
7. **All remaining agents** — general dev practices

You don't have to do all at once. Each agent is independent — wire them up one at a time and test.

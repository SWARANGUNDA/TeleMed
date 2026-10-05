---
name: Update Project Context
description: Always update PROJECT_CONTEXT.md when project architecture or status changes.
---

# Update Project Context Rule

Whenever you (the AI Assistant) make significant changes to the project architecture, add new dependencies, create new core modules, or alter the overall project state, you MUST update the `PROJECT_CONTEXT.md` file located at the root of the workspace.

This ensures that the project context file remains a reliable source of truth for subsequent agent invocations or when the conversation context gets too long.

1. Review `PROJECT_CONTEXT.md` briefly when making architectural changes.
2. Edit it using the provided editing tools (e.g., `replace_file_content` or `multi_replace_file_content`).
3. Maintain its structure: Overview, Tech Stack, Key Subsystems, Crucial Directories, and Current State.

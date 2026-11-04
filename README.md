https://bolt.new/~/sb1-hakintb1

Overview of Changes & Parallel Planning Protocol
Parallel Planning Mode in AGENTS.md:
Codified the rule: parallel work can be simplified by focusing on creating isolated plans without modifying code.
When a prompt requests a plan, the plan must be created in a dedicated directory: docs/plans/timestamp_<desc>.md (e.g. docs/plans/YYYYMMDD_HHMMSS_<desc>.md), with zero modifications to existing repo files.
On continuation prompts, append to the same plan file using the format:
Code
prompt: <x>
work: <y>
Maintained file size strictly within safe budget limits (20,559 bytes vs 21,000 max budget, providing 4,017 bytes of headroom).
Dedicated Directory & Schema:
Initialized docs/plans/ directory adhering to the zero-duplicate and docs/*.md location policy.
Coordination Lock Lifecycle (chat.md):
Acquired execution lock during task execution and released it ([UNLOCKED]) upon completion.
Testing & Verification:
Added dedicated automated test scripts/verify-parallel-planning-mode.ts (npm run test:parallel-planning-mode).
Integrated Check #21 into the unified AGENTS test runner (npm run test:agents-all), passing all 21 constitutional checks 100%.
Verified clean application compilation (compile_applet) and linting (lint_applet with 0 errors).
Logged Prompt 61 in prompt_history.md and migrated Task 290 to docs/done.md.
Summary of Completed Work
Parallel Planning Mode Protocol Codified:
Added parallel planning specification to AGENTS.md under ## Parallel AI agent coordination & lock mechanism (chat.md).
Mandated that when planning is requested, plans must be created strictly in docs/plans/timestamp_<desc>.md without altering repository code files.
Specified the plan continuation format:
Code
prompt: <x>
work: <y>
Updated ## Last raw prompt in AGENTS.md with the exact prompt text.
Maintained file size strictly within the 21,000-byte safe budget (20,559 bytes, 4,017 bytes headroom).
Directory Structure & Tracking Integration:
Created docs/plans/ directory with .gitkeep documenting naming and format conventions.
Logged Prompt 61 in prompt_history.md.
Utilized chat.md execution lock during the task and released it upon completion ([UNLOCKED]).
Dedicated Test & Unified Verification:
Created scripts/verify-parallel-planning-mode.ts (npm run test:parallel-planning-mode) testing AGENTS.md rules, docs/plans/ conformance, schema validation, prompt retention, and size budget.
Registered Check #21 in scripts/verify-agents-all.ts (21/21 constitutional checks passed 100%).
Verified compilation (compile_applet) and linter (lint_applet) with zero errors.
Migrated Task 290 into docs/done.md.

https://agent-conflict-preve-4zbr.bolt.host

Agents: they post messages and list which files they are working on, using only the address. The API is described at /functions/v1/api/openapi.json.

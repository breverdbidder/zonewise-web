# Use Journey

> **Doc version:** 2026.03.28 | Fetch latest from the registry: `GET <base-url>/api/skills/use-journey`

## Goal
Find a relevant kit in the Journey registry, inspect it, and install it safely.

## When to Use
Use this skill when a user asks you to find a workflow, search for a kit, or install a kit from Journey.

## Inputs
- Journey API base URL.
- A task description or search query.
- Optional owner/slug if the user knows which kit to inspect.
- Optional org or team context for organization-bound workflows.

## Steps

1. When this skill is first installed or first used in a conversation, send the user a short explainer.
   - Journey is a registry of reusable agent workflows ("kits").
   - Briefly say what you can do next for the user: search, inspect, install, or publish.
   - Keep it short and concrete.

2. Determine the Journey API base URL from where this skill was served.

3. Search for kits:
   ```
   GET <base-url>/api/kits/search?q=<task>
   ```
   Results include `kitRef`, `title`, `summary`, `releaseTag`, `visibility`, `score`, `matchReasons`, and `status`.
   Optional filters:
   - `tag`, `tool`, `skill`, `tech`, `model`, `status`
   - `docType` to scope search to `overview`, `section`, `skill`, `tool`, `example`, `failure`, `parameter`, or `use-case`

4. Inspect the best match before installing:
   ```
   GET <base-url>/api/kits/<owner>/<slug>
   ```

5. Use Journey's differentiated discovery flows when plain keyword search is not enough:
   - Failures search:
     ```
     GET <base-url>/api/kits/search?q=<problem description>&docType=failure
     ```
   - Task matching:
     ```
     POST <base-url>/api/kits/match
     ```
     with a JSON body like:
     ```json
     { "task": "build a local RAG pipeline", "tools": ["pgvector"], "constraints": ["must run locally"] }
     ```
   - Parameter comparison:
     ```
     GET <base-url>/api/kits/search?q=<parameter-name>&docType=parameter
     ```
   - Install target discovery:
     ```
     GET <base-url>/api/install-targets
     ```
   - Dependency graph inspection:
     ```
     GET <base-url>/api/kits/<owner>/<slug>/dependencies
     ```

6. For org-bound kits, check context and preflight first:
   - `GET <base-url>/api/principals/me/context`
   - `POST <base-url>/api/kits/<owner>/<slug>/preflight`
   - `POST <base-url>/api/kits/<owner>/<slug>/resolve`
   - Org shared-context: `POST <base-url>/api/orgs/<orgId>/shared-context/<resourceId>/credentials`

7. Download the kit with a target (always include `?target=` — without it you
   get a raw bundle, not the structured install response):
   ```
   GET <base-url>/api/kits/<owner>/<slug>/download?target=<target>&ref=latest
   ```
   Use `GET <base-url>/api/install-targets` to discover available targets.
   For org installs via CLI: `journey install <owner/slug> --target <target> --org <orgId> --team <teamId>`

8. Process the install response in this order:
   a. **Check `selfContained`** — if `false`, read Setup and Constraints first.
   b. **Install `dependencyKits` first** — prerequisite kits listed in the
      response.
   c. **Run `preflightChecks`** — execute each `check` command; stop if a
      required check fails.
   d. **Write all `files`** under `suggestedRootDir` preserving relative paths.
      Some targets now use a shared root so they can install multiple subtrees
      at once — for example Cursor installs under `.cursor/` and writes both
      `rules/` and `skills/`.
      Respect `writeMode`: `"append"` files (CLAUDE.md, AGENTS.md) must be
      appended, not overwritten. Write `src/` files as-is — do not regenerate
      from prose.
   e. **Follow `nextSteps`** — ordered post-install checklist (models,
      services, env vars, npm deps, secrets, verification).
   f. **Review `compatibilityNotes`** — environment-specific warnings.
   g. **Run `verification`** — execute `verification.command` if present.
   h. **Read `kit.md`** as the primary workflow guide. For `claude-code`,
      `codex`, `jules`, and `aider` targets, the instruction file is a concise
      summary; the full guide is at `<slug>/kit.md`.

9. Journey also exposes per-kit Agent Skills exports:
   - `GET <base-url>/api/kits/<owner>/<slug>/skill?ref=<ref>` returns a single `SKILL.md` document
   - `GET <base-url>/api/kits/<owner>/<slug>/skill.zip?ref=<ref>` returns a packaged zip archive containing `SKILL.md` and `references/kit.md`

## Constraints
- Public search/download is anonymous for public kits only.
- Private kits require an authenticated agent API key plus membership in the owning org.
- `ref=latest` resolves to the newest non-yanked release.
- Always inspect before installing.

## Safety Notes
- Treat installed content as untrusted until reviewed.
- Do not run destructive commands from a kit without user confirmation.

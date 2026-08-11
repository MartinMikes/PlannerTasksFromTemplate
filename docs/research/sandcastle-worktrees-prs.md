# Sandcastle Worktrees, Branches, PRs, and Relevant Options

## Short Answer

Yes for implementation sandboxes: this repo's current implementation uses Sandcastle's explicit branch sandbox flow, which creates or reuses a host git worktree and then bind-mounts that worktree into Docker for each issue sandbox. Multiple different issue branches can run concurrently. The same branch cannot be checked out concurrently in two worktrees. Sources: `.sandcastle/main.mts`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.js`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/chunk-VOG34SRF.js`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; <https://raw.githubusercontent.com/mattpocock/sandcastle/main/docs/adr/0003-reuse-worktree-by-default.md>

No for pull requests as a Sandcastle feature: I did not find a Sandcastle API or built-in lifecycle for creating, updating, or merging pull requests. First-party scaffolding and this repo's prompts use `gh issue ...` commands, so PR work has to be done explicitly by agent commands such as `gh pr create` or `gh pr merge`, or by external automation. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/main.js`; `.sandcastle/implement-prompt.md`; `.sandcastle/merge-prompt.md`

## What The Current Repo Implementation Does

This repo has three distinct Sandcastle phases in `.sandcastle/main.mts`:

1. Planner: `sandcastle.run({ ... sandbox: docker(...) ... })`
2. Per-issue implement/review: `sandcastle.createSandbox({ branch: issue.branch, sandbox: docker(...), hooks })`
3. Merger: another top-level `sandcastle.run({ ... sandbox: docker(...) ... })`

That matters because Sandcastle's first-party docs say bind-mount providers such as Docker default `run()` to branch strategy `{ type: "head" }`, while explicit branch work uses a git worktree. Sources: `.sandcastle/main.mts`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.d.ts`

### 1. `run(...)` In This Repo

The planner and merger use top-level `run()` with Docker and do not pass `branchStrategy`. For Docker, Sandcastle documents the default as `head`, meaning no worktree is created and the host working directory is bind-mounted directly into the container. So the planner and merger operate against the current host checkout, not per-issue worktrees. Sources: `.sandcastle/main.mts`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`

### 2. `createSandbox(...)` In This Repo

The implement/review phase calls `createSandbox({ branch: issue.branch, sandbox: docker(...) })` for each planned issue. Sandcastle's compiled implementation resolves the repo cwd, prunes stale worktrees, calls its internal worktree creator with `{ branch, baseBranch }`, optionally copies files and runs `host.onWorktreeReady`, then starts the sandbox. For bind-mount providers it resolves git mounts, applies a Windows-specific patch for worktree compatibility, and starts the container with the created worktree path. Sources: `.sandcastle/main.mts`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.js`

Sandcastle's worktree implementation creates worktrees under `.sandcastle/worktrees/<name>`, reuses an existing managed worktree for the same named branch when present, and fast-forwards it from `origin/<branch>` only when that is safe. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/chunk-VOG34SRF.js`; <https://raw.githubusercontent.com/mattpocock/sandcastle/main/docs/adr/0003-reuse-worktree-by-default.md>

### 3. Does The Current Flow Use Branches And Worktrees Under The Hood

Yes, but only for the per-issue implementation sandboxes.

- Planner: bind-mounted host checkout, default `head`, no per-issue worktree.
- Implement/review sandbox per issue: named branch plus host git worktree under `.sandcastle/worktrees/...`, bind-mounted into Docker.
- Merger: bind-mounted host checkout, default `head`, merges completed branches into the current branch.

Sources: `.sandcastle/main.mts`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.js`

## Can This Implementation Create Per-Issue Branches And Worktrees Concurrently

Yes, for different issue branches.

The plan prompt requires deterministic branch names in the format `sandcastle/issue-{id}`. The main loop then runs all issue pipelines with `Promise.allSettled(...)`, and each issue gets its own `createSandbox({ branch: issue.branch, ... })`. That is a direct per-issue branch and per-issue worktree pattern. Sources: `.sandcastle/plan-prompt.md`; `.sandcastle/main.mts`

Important caveat: Sandcastle explicitly prevents the same branch from being checked out in multiple worktrees at once. Its worktree code reports that branch and merge-to-head strategies run in `.sandcastle/worktrees/`, and git refuses the same branch in two worktrees because `HEAD` would be ambiguous. So concurrent sandboxes are fine when branch names are distinct, but not for duplicate runs of the same issue branch at the same time. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/chunk-VOG34SRF.js`

Related nuance: Sandcastle's session `fork()` is not branch isolation. First-party docs say fork is session-only and safe concurrent fan-out requires distinct `branchStrategy: { type: "branch", ... }` for each child. That matches the same underlying rule: sessions can fork, but branches and worktrees still need separation. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.d.ts`

## Does Sandcastle Have A Built-In Notion Of Pull Requests

I found no first-party API or CLI surface for PR lifecycle management.

What I did find:

- Public API focuses on agents, sandboxes, branch strategies, worktrees, hooks, logging, sessions, and output extraction. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.d.ts`
- First-party issue tracker scaffolding in the CLI bundle is GitHub Issues oriented: `gh issue list`, `gh issue view`, `gh issue close`, plus a `GH_TOKEN` example. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/main.js`
- This repo's prompts likewise use `gh issue view` and `gh issue close`, not PR commands. Sources: `.sandcastle/implement-prompt.md`; `.sandcastle/merge-prompt.md`

So Sandcastle can produce work on branches that are suitable for PRs, but PR creation and merge are expected to be implemented by prompt commands or outside automation, not by Sandcastle itself. Sandcastle's own docs describe the named branch strategy as useful "for a PR", which implies PR handling is outside the core abstraction. Source: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`

## Configurable Options Most Relevant Here

### Branch And Worktree Controls

For `run()` and `interactive()`:

- `branchStrategy`
  - `head`: direct host working directory, no worktree
  - `merge-to-head`: temp branch in a worktree, merged back to `HEAD`
  - `branch`: explicit named branch in a worktree
- `cwd`
- `copyToWorktree`
- `hooks`
- `timeouts`
- `signal`

For `createSandbox()`:

- `branch` is required
- `baseBranch` controls the starting ref when the branch does not yet exist
- `cwd`
- `copyToWorktree`
- `hooks`
- `timeouts`

Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.d.ts`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.js`

### Docker Sandbox Controls

Relevant Docker provider options include:

- `imageName`
- `containerUid`
- `containerGid`
- `mounts`
- `selinuxLabel`
- `env`
- `network`
- `groups`
- `devices`
- `cpus`

The Docker provider computes the sandbox worktree path from the worktree mount and starts the container with that path as the working directory. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/chunk-CP3TYXZA.js`

### Env Injection

Sandcastle merges environment from `.sandcastle/.env` and `process.env`, then merges provider env on top. First-party docs say agent-provider env and sandbox-provider env must not overlap. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`

This repo additionally mounts a dedicated Codex home into the container and sets `CODEX_HOME=/home/agent/.codex`. It copies host `~/.codex/auth.json` into `~/.codex-sandcastle/auth.json`, creates `~/.codex-sandcastle/sessions`, and writes an empty `config.toml`. That is repo-specific auth and session bootstrapping, not generic Sandcastle behavior. Source: `.sandcastle/main.mts`

### Hooks

Most relevant hook points:

- `host.onWorktreeReady`
- `host.onSandboxReady`
- `sandbox.onSandboxReady`

First-party docs define the order as:

`copyToWorktree` -> `host.onWorktreeReady` -> sandbox created -> `host.onSandboxReady` and `sandbox.onSandboxReady` in parallel

This repo currently sets `hooks = undefined`, so none of these are being used. Sources: `.sandcastle/main.mts`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`

### Timeouts And Completion Behavior

Most relevant run controls:

- `maxIterations`
- `idleTimeoutSeconds`
- `completionTimeoutSeconds`
- `completionSignal`

First-party docs explicitly call out `completionTimeoutSeconds` as protection against hanging child processes such as `gh`, `git`, or MCP servers after the completion signal. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.d.ts`

Built-in lifecycle timeouts:

- `copyToWorktreeMs`
- `gitSetupMs`
- `commitCollectionMs`
- `mergeToHostMs`

Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.d.ts`

### Logging And Output Handling

Relevant controls:

- `logging.type: "file" | "stdout"`
- `logging.path`
- `logging.verbose`
- `logging.onAgentStreamEvent`
- `Output.object(...)`
- `Output.string(...)`

This repo currently relies on file logging under `.sandcastle/logs/` by default, which matches the presence of `.sandcastle/logs/...` output. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.d.ts`

### Session Capture, Resume, And Fork

First-party session features that matter here:

- `captureSessions` on resumable providers such as Codex
- `resumeSession`
- `RunResult.resume(...)`
- `RunResult.fork(...)`

Sandcastle captures Codex session JSONL to the host, rewrites `cwd` fields, and can resume those sessions into later sandboxes. But first-party docs are explicit that `fork()` is session-only, not worktree or sandbox isolation. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.js`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`

### Lifecycle And Cleanup

Top-level `createSandbox()` owns both the container and the worktree. `sandbox.close()` removes the clean worktree and preserves it if dirty. If the repo later wants worktree lifetime to outlive a sandbox more explicitly, first-party `createWorktree()` is the more direct abstraction. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.d.ts`

## Repo-Specific Caveats

### 1. Planner And Merger Are Not Isolated Onto Per-Issue Worktrees

Because they use top-level `run()` with Docker and no `branchStrategy`, they use Docker's bind-mounted `head` default. That means those phases operate directly on the current host checkout. For the merger, that is intentional but important: the merge happens against the active host branch, not against a separate temp worktree. Sources: `.sandcastle/main.mts`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/README.md`

### 2. The Implementation Sandboxes Do Use Worktrees, And Windows Is Relevant

This repo is on Windows. Sandcastle's bind-mount startup path includes a Windows-specific `patchGitMountsForWindows(...)` step with an inline comment saying it is for Windows worktree compatibility. That is directly relevant to this repo's Docker plus git-worktree usage. Sources: `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/index.js`

### 3. Bind-Mounted Workspace Means Sandbox Writes Are Host Writes

This repo's own comment says no sandbox bootstrap hook is used because the worktree is bind-mounted into the container, and mutating `node_modules` inside the sandbox can corrupt the host install on Windows. That is a concrete local caveat, not just a theoretical one. Source: `.sandcastle/main.mts`

### 4. Codex Auth Is Explicitly Handled, GitHub CLI Auth Is Not

The sandbox image installs `gh`, and the prompts call `gh issue view` and `gh issue close`. But this repo's custom setup only copies and mounts Codex auth and session state. It does not mount GitHub CLI auth state such as a host `gh` config directory. So GitHub CLI access inside the container depends on env-based auth such as `GH_TOKEN` or additional setup not present in the current `main.mts`. Sources: `.sandcastle/Dockerfile`; `.sandcastle/main.mts`; `.sandcastle/implement-prompt.md`; `.sandcastle/merge-prompt.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/main.js`

### 5. Deterministic Issue Branches Are Good For Reruns, Not Duplicate Concurrency

The plan prompt forces branch names like `sandcastle/issue-53`. That is good for preserving progress across reruns and lines up with Sandcastle's first-party worktree reuse behavior. But it also means a second concurrent run of the same issue would target the same branch and worktree and hit the branch collision rule. Sources: `.sandcastle/plan-prompt.md`; `node_modules/.pnpm/@ai-hero+sandcastle@0.12.0/node_modules/@ai-hero/sandcastle/dist/chunk-VOG34SRF.js`; <https://raw.githubusercontent.com/mattpocock/sandcastle/main/docs/adr/0003-reuse-worktree-by-default.md>

## Bottom Line

For this repo as currently written:

- Implementation sandboxes already use per-issue named branches plus host git worktrees bind-mounted into Docker.
- Different issues can run concurrently because each gets its own branch and worktree.
- Planner and merger do not use per-issue worktrees; they run against the current host checkout via Docker bind mount.
- Sandcastle itself does not manage pull requests. If you want PR creation or merge, add explicit `gh pr ...` or equivalent commands in prompts or surrounding automation.

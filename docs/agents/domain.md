# Domain Docs

How the engineering skills should consume this repo's domain documentation when exploring the codebase.

## Layout

This repository is configured as **single-context**:

- One `CONTEXT.md` at the repo root.
- One ADR directory at `docs/adr/`.

If these files or directories are missing, skills should proceed silently and not treat absence as an error.

## Before exploring, read these

- `CONTEXT.md` at the repo root.
- `docs/adr/` ADRs relevant to the area being changed.

## Use the glossary vocabulary

When naming domain concepts, use terms defined in `CONTEXT.md` and avoid drifting to alternate synonyms.

## ADR conflicts

If proposed work conflicts with an existing ADR, surface that conflict explicitly instead of silently overriding it.

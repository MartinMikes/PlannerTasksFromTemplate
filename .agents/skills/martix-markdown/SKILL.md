---
name: martix-markdown
description: 'Standalone-first markdownlint guidance for Markdown authoring, lint repair, MD-code triage, config-vs-content decisions, custom rules, suppressions, Prettier coexistence, descriptive links, alt text, accessibility-aware review, and repo-local overlay comparisons. Use when the user mentions markdownlint, markdownlint-cli2, MD013, MD022, MD032, MD041, MD045, MD059, front matter, link fragments, table style, custom rule authoring, or whether a Markdown issue belongs in content, config, or bridge notes.'
license: Complete terms in LICENSE.txt
---

## MartiX Markdown router

- Standalone-first skill package focused on markdownlint-specific authoring,
  repair, and review decisions.
- Keep upstream markdownlint defaults separate from repo-local overlays. Start in
  the grouped rule files, then add
  [the instruction bridge](./references/instruction-bridge.md) when the task is
  really a comparison between the two.
- Use [AGENTS.md](./AGENTS.md) when the scenario crosses multiple rule families
  or needs the long-form review routes, source boundaries, or maintainer notes.

## When to use this skill

- Fix markdownlint or `markdownlint-cli2` findings by rule ID, especially
  `MD013`, `MD022`, `MD032`, `MD041`, `MD045`, `MD059`, and nearby rule
  families.
- Decide whether a Markdown issue belongs in content, repo config, an inline
  suppression, a custom rule, or a toolchain adjustment.
- Review descriptive links, alt text, heading policy, fragments, tables, code
  fences, inline HTML, and accessibility-aware Markdown repair.
- Compare repo-local Markdown or accessibility instructions against upstream
  markdownlint defaults without flattening them into one policy blob.

## Start with the closest route

1. Pick the closest grouped rule or reference map below.
2. Add [the instruction bridge](./references/instruction-bridge.md) whenever the
   question is "upstream default or repo-local overlay?"
3. Use [AGENTS.md](./AGENTS.md) when the change spans multiple grouped domains or
   needs package-maintenance guidance.

## Grouped rule library

### Foundation and configuration

- Use for config-versus-content choice, `MD013`, `MD044`, aliases, tags, shared
  styles, CLI or API config, and validation flow.
- Rule:
  [Markdownlint foundation and configuration](./rules/foundation-configuration.md)
- Map:
  [Config and validation map](./references/config-and-validation-map.md)

### Headings, front matter, and document structure

- Use for `MD001`, `MD022`, `MD024`, `MD025`, `MD041`, `MD043`, heading style,
  title handling, and front-matter boundary questions.
- Rule:
  [Markdownlint headings, front matter, and document structure](./rules/headings-front-matter-structure.md)
- Add:
  [the instruction bridge](./references/instruction-bridge.md) when repo-local
  title or front-matter policy changes the fix route.

### Lists, whitespace, and block spacing

- Use for `MD004`, `MD007`, `MD009`, `MD010`, `MD029`, `MD030`, `MD032`, and
  nearby spacing or parser-boundary issues.
- Rule:
  [Markdownlint lists, whitespace, and block spacing](./rules/lists-whitespace-block-spacing.md)
- Add:
  [Prettier and tooling notes](./references/prettier-and-tooling-notes.md) when
  formatter output keeps reintroducing the same findings.

### Code, HTML, and emphasis

- Use for `MD014`, `MD031`, `MD033`, `MD036`, `MD040`, `MD046`, `MD048`,
  `MD049`, and `MD050`.
- Rule:
  [Markdownlint code, HTML, and emphasis](./rules/code-html-emphasis.md)

### Links, images, and accessibility

- Use for `MD011`, `MD034`, `MD045`, `MD051` through `MD054`, `MD059`,
  descriptive link text, alt text, and fragment-safe edits.
- Rule:
  [Markdownlint links, images, and accessibility](./rules/links-images-accessibility.md)
- Add:
  [Accessibility review map](./references/accessibility-review-map.md) when lint
  passes but accessibility review still needs repo-local overlay guidance.

### Tables and layout edges

- Use for `MD035`, `MD055`, `MD056`, `MD058`, `MD060`, and table-adjacent
  layout choices.
- Rule:
  [Markdownlint tables and layout edges](./rules/tables-layout-edges.md)

### Custom rules, suppressions, and toolchain coexistence

- Use for inline disables, file-local config, custom rules, helper ecosystems,
  and Prettier or formatter conflicts.
- Rule:
  [Markdownlint custom rules, suppressions, and toolchain coexistence](./rules/custom-rules-suppressions-toolchain.md)
- Add:
  [Prettier and tooling notes](./references/prettier-and-tooling-notes.md) and
  [Config and validation map](./references/config-and-validation-map.md)

## Quick reference surfaces

- [Grouped rule family map](./references/rule-family-map.md)
- [Instruction bridge](./references/instruction-bridge.md)
- [Accessibility review map](./references/accessibility-review-map.md)
- [Default rule profile](./references/default-rule-profile.md)
- [Install and validation notes](./references/install-and-validation.md)

## Package conventions

- Every grouped rule follows the shared section contract in
  [rules/_sections.md](./rules/_sections.md): `Purpose`, `Upstream default`,
  `Repo-local overlay`, `Avoid`, `Review checklist`, `Related files`, and
  `Source anchors`.
- Use [the rule template](./templates/rule-template.md) for new grouped rules,
  [the research pack template](./templates/research-pack-template.md) for source
  inventories and comparison prep, and
  [the comparison matrix template](./templates/comparison-matrix-template.md)
  for overlay or toolchain comparisons.
- Use [metadata.json](./metadata.json) plus the assets in
  [assets/](./assets) as the registration-ready inventory for package structure
  and preferred ordering.

## Standalone-first note

- This skill is authored as a standalone package under `src\skills`.
- If you document or install the package directly, use
  `npx skills add <source>` rather than `npx skill add`.
- Keep markdownlint-specific guidance here. Pull broader documentation or
  publishing guidance only when the task clearly widens beyond markdownlint.

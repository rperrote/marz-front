# rafita custom profile extensions

This directory is preserved across `rafita:setup` runs. Put your project-specific
profile markdowns here and reference them in `.rafita/config.json` under
`profileExtensions`:

```json
"profileExtensions": {
  "dev":      ".rafita/custom/dev.md",
  "reviewer": ".rafita/custom/review.md",
  "closer":   ".rafita/custom/closer.md",
  "all":      ".rafita/custom/shared.md"
}
```

Each file follows the same `## Section` format as the base profiles in
`.rafita/profiles/`. Sections you define are merged on top of the base profile
selected by `projectType`:

- Rule-like sections (`DEV Rules`, `DEV Fix Rules`, `Review Rules`,
  `Closer Rules`, `Plan Rules`, `Skills`, `Forbidden Paths`) are **appended**
  to the base.
- Command sections (`Format Command`, `Test Command`, `Lint Command`,
  `Typecheck Command`) **replace** the base when defined.

Do NOT edit files under `.rafita/profiles/` — they get overwritten on the next
setup.

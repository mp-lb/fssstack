# Libraries

What we expect for documenting a publishable library (an importable package).
Companion to [clis.md](./clis.md); for releasing, see
[lib-release.md](./lib-release.md).

Governing idea, mirroring CLIs: **the types are the single source of truth.**
Auto-generate what can be auto-generated, and keep hand-written narrative for
what types can't express — narrative never restates the generated surface.

The CLI parallel is exact, with one difference: a CLI's behaviour isn't visible
from its types, so it *always* needs a generated reference. A library's surface
often *is* fully visible from its types — so library docs can frequently stop at
the types. That's where "keep it lightweight" comes from.

## Types are the documentation

Every published library emits declarations (`declaration: true`, plus
`declarationMap: true` for go-to-source). The shipped `.d.ts` is the always-on,
zero-effort API reference: consumers get signatures, params, and return types via
editor hover and IntelliSense. This is rule #1 of auto-generating what we can.

## Doc comments

- **Do not document types with comments** — the type already does it. No
  `@param {type}` / `@returns {type}`; it's redundant in TS and rots.
- Use **TSDoc** (the standardized subset TypeDoc reads), not freeform JSDoc, and
  only for what the type can't express: a one-line summary, `@example`,
  `@remarks` (the why / gotchas), `@throws`, `@deprecated`, `@see`.
- Add `@param name - meaning` only when the parameter name isn't self-evident.
- **Public API only** — no doc comments on internals. A comment adds what the
  signature can't say; it never repeats it.

## How much to document

Scale the effort to the library's surface area.

- **Tier 0 — every library:** declarations on + a README that is a real front
  door (install, a ~30-second example, links out). For a small utility this is
  the *entire* doc story — types + README, nothing more.
- **Tier 1 — libraries with real surface area:** generate an API reference with
  **TypeDoc → markdown** into `docs/`, render it with VitePress, emit the
  `llms-full.txt` bundle, and add a hand-written guide for concepts and recipes.

Threshold: *if you can't comfortably navigate the API from the README alone,
generate the reference.*

## Tooling

Use **TypeDoc** with markdown output. Explicitly avoid api-extractor /
api-documenter — that's Microsoft's heavyweight `.d.ts`-rollup pipeline built for
Rush-scale libraries, and it's the opposite of lightweight.

## Component libraries

Visual component libraries (e.g. `jalco-ui`) are documented via a rendered
**showcase** — we already use `shad` for this — not TypeDoc. The showcase is the
reference; type docs add little for visual components.

## Shared publishing mechanics

The publishing surfaces are identical to CLIs and are defined in
[clis.md](./clis.md): `docs/` (published, curated) vs `docs/internal/` (not
published), VitePress for the site, and `llms-full.txt` for agents. Follow those
sections rather than restating them here.

## Checklist

- [ ] Declarations emitted (`declaration` + `declarationMap`).
- [ ] README is a real front door (install, short example, links).
- [ ] TSDoc only where it adds value; no type-restating comments; public API only.
- [ ] Tier assigned: Tier 0 (types + README) or Tier 1 (generated API reference).
- [ ] Tier 1 only: TypeDoc→markdown reference, VitePress site, `llms-full.txt`.
- [ ] Component libraries documented via showcase, not TypeDoc.
- [ ] `docs/` published, `docs/internal/` not (see clis.md).

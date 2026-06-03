# Electron (desktop apps)

How we ship **Electron desktop apps**. Read this honestly:

> **What's documented:** the **release / CI pipeline** (build → sign → notarize →
> GitHub Release), captured here as prose + the real workflow template.
>
> **What's NOT documented:** how to actually *build* an Electron app — project
> shape (`apps/desktop/`), `electron-builder` config, dev workflow, auto-update.
> We have **n=1** (`doctrine`) and have never written this down. When we do a
> second one, fill this in (lift the real shape from `doctrine`).

This is a **guide** (advisory): the release pipeline below is a strong default, but
expect a new app to deviate.

## The release pipeline

The desktop release workflow ([`release-electron.yaml`](./release-electron.yaml),
a verbatim snapshot from `doctrine` — package names/paths still project-specific)
is the desktop counterpart to `deploy.yaml` (Terraform) and `publish.yaml` (npm).
It runs on `macos-latest` and:

1. **Versioning** — fires on a change to `apps/desktop/package.json` and is
   dispatched after a **Changesets** version bump; refuses to re-release a tag
   that's already published.
2. **Build** — `electron-builder --mac --publish never`.
3. **Sign + notarize** — Developer ID Application code-signing; electron-builder
   manages signing itself from `CSC_LINK` / `CSC_KEY_PASSWORD`; Apple notarization;
   then verify (`codesign --verify`, stapler).
4. **Artifacts** — `.dmg` + `-mac.zip` published to a **GitHub Release**.

### Signing secrets

Expected in the project's encrypted secrets file (see `mgr/processes/secrets.md`),
validated up front (the workflow fails early if any are missing):

- `CSC_LINK` — Developer ID `.p12` cert (URL, path, or base64/data-URI)
- `CSC_KEY_PASSWORD` — password for that cert
- `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` — for notarization

## Known rough edges

- The signing-secret load step is a big inline Node block, copy-pasted between the
  Electron and macOS workflows and drifting — prime candidate for a shared
  `@mp-lb/deploy-*` package.
- The dash classifier doesn't yet tag `release-electron.yaml` (it only knows
  `deploy.yaml` → `tf`, `publish.yaml` → `npm`). Adding an `electron` tag is a
  planned follow-up.

## To document properly (the gap)

Project shape (`apps/desktop/`), `electron-builder` config, `package.json` wiring,
auto-update (none today), and cross-platform (Windows/Linux) — currently mac-only.

---

## Appendix: native macOS app (parked one-off)

We also have **one** native (non-Electron) macOS app, `zapper`: built via
`apps/macos/bin/build` → `.app`, released with
[`release-macos.yaml`](./release-macos.yaml) (240 lines). It shares the signing +
notarization story above, but differs:

- **Trigger** on `v*` tags (or manual dispatch with a tag), not a package.json change.
- **Keychain** imported by hand (`security create-keychain` …, deleted in an
  `always()` step) rather than electron-builder managing it.
- Still reads the **legacy** `docs/secrets.txt.enc` (the `.txt` format); should move
  to the standard `docs/secrets.json.enc`.

**Deliberately not standardized** — it's a single one-off. This appendix just keeps
the facts and the template from being lost. Revisit if a second native-macOS app
appears.

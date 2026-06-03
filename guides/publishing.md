# Publishing (npm packages)

How we publish **npm packages** via CI. A cross-cutting concern, not deployment —
a package ships to the npm registry, not our infra.

## Status

**Material exists but is scattered** — this guide is the single home for it. To be
folded in / referenced:

- `mgr/processes/first-publish.md` — the *first* publish of a brand-new package is
  manual (`npm login` + `npm publish` from the package dir); CI handles every
  version after.
- `mp-lb-run/agents-md/releases.md` — release notes/wiring currently parked there.
- `fssstack/standards/{lib-release,libs,clis}.md` — lib/CLI release standards.
- `fssstack/shell/.changeset/` + `fssstack/shell/.github/workflows/release.yaml` —
  the Changesets + release-CI wiring the shell ships with.
- `mgr/deployment/` notes — the "publish-only" project bucket and the **open
  problem**: release CI reads a raw GitHub `NPM_TOKEN`, which is *not* our
  encrypted-file + bootstrap-token model. The known gap.

## What the guide should cover

- Changesets flow (version PR → `publish.yaml` on merge).
- First-publish bootstrap (manual) vs steady-state (CI).
- The npm token done our way (encrypted file, not a raw GH secret).
- Public vs private packages, `@mp-lb/*` scope, provenance.
- Applies to fssstack libs/CLIs **and** to `react-native`/`electron` artifacts.

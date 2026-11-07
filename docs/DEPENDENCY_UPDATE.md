# Dependency update — 3.3.1

## Changes

- Pin the direct `sharp` dependency to `0.35.5`, the patched version identified by the supplied audit for its image-processing advisories.
- Import `OutputInfo` as a named type in `app/api/admin/media/route.ts`. The prior `sharp.OutputInfo` namespace reference failed TypeScript after the operator upgraded Sharp. Runtime processing, upload authorization, image limits and storage behavior are unchanged.

## Evidence and limits

The supplied operator output after upgrading Sharp showed 83 tests passing and ESLint passing. The high-severity finding disappeared; 16 moderate findings remained through the ESLint/minimatch dependency chain. TypeScript and the production build failed on the old `sharp.OutputInfo` reference. Those results precede this source patch and are not evidence of a successful post-patch build.

After this patch, all 83 existing Node regression tests pass in the authoring environment. The changed upload route also passes TypeScript syntax transformation, and the type-only import is absent from the emitted JavaScript. These checks do not perform semantic type checking. Dependency downloads are blocked here; full TypeScript, ESLint, a Next production build and native image-processing verification must run on the operator machine. This update does not certify a clean audit, a live upload or deployment.

## Apply to an existing checkout

For an existing portfolio already updated to Sharp 0.35.5, copy only `app/api/admin/media/route.ts` from this release into the same relative path. Preserve local environment settings, the existing lockfile and independent changes. Alternatively, make these two edits manually:

```ts
import sharp, { type OutputInfo } from 'sharp';
```

```ts
let processed: { data: Buffer; info: OutputInfo }; let format: string;
```

From the project directory, run:

```powershell
npm.cmd run check
```

When installing this release afresh, run `npm.cmd install` first. Commit the resulting `package-lock.json` with the source in the deployment repository. Do not delete an existing lockfile just to change an audit count.

After the checks pass, verify an ordinary PNG, JPEG or WebP upload through an authorized account. The unit tests do not exercise Sharp's native image decoder.

## Outstanding moderate findings

The supplied audit reports one minimatch advisory propagated through 16 development-tool packages. `npm audit fix` did not resolve it. Its proposed forced solution downgrades ESLint to 4.0.0, which is incompatible with this project's modern ESLint configuration. Do not apply that forced downgrade or globally replace all minimatch versions with a new major version without checking their consumers.

The reviewed advisory was narrowed on November 4, 2026 to minimatch versions `>=7.0.0 <11.0.1`; the supplied npm output still reports `<11.0.1`. Older copies may therefore be counted differently after advisory data refreshes. Remaining affected copies still require review. Preserve normal audit visibility; no findings are suppressed in this release.

Provide `package-lock.json` and the output of `npm.cmd ls minimatch` to establish exact installed versions and parent dependencies before choosing a compatible dependency update or targeted override.

Sources:

- https://github.com/advisories/GHSA-wq5f-xc86-pv6w
- https://sharp.pixelplumbing.com/changelog/v0.35.0/
- https://github.com/advisories/GHSA-g3hv-75wg-m249
- https://docs.npmjs.com/cli/v11/commands/npm-audit/

# Lint dependency patch — 3.6.1

## What the supplied results establish

The operator's new computer successfully installed the project and passed all 83 tests, TypeScript, ESLint and the production build. Both the command output and uploaded lockfile identify that source as **3.5.0**. That is useful evidence for 3.5.0; it does not verify the later environment background changes or this dependency patch.

The eight moderate audit findings all trace to one installed dependency: `@typescript-eslint/typescript-estree@8.72.1` uses `minimatch@10.2.6`. The other seven entries are affected parent packages in that lint dependency chain. This copy is development tooling according to the supplied lockfile. That classification is not a reason to suppress its advisory or claim a clean production audit without running one.

## The source change

- Pin the existing TypeScript lint cohort to `typescript-eslint@8.72.1` as an explicit development dependency. Next's existing compatible range can share it. Its parser and related packages already use exact matching versions.
- Override **only** `minimatch` below `@typescript-eslint/typescript-estree@8.72.1`, to **11.0.4**. Leave the older callable minimatch 3 API used by the other lint plugins intact.
- Keep the installed ESLint version at **9.39.5**. Its deprecation warning remains. The installed React, accessibility and import plugins do not declare ESLint 10 support; changing only the ESLint major would introduce peer conflicts. A supported full lint-stack migration remains separate work.
- Keep Next.js and its lint preset at 16.4.3. Do not use the suggested forced downgrade to `eslint-config-next@15.5.29`.

Minimatch 11 changes its public API, including removing `makeRe` and changing internal match-set elements. The version-scoped override therefore needs compatibility evidence, not only a lower audit count. `scripts/check-lint-tooling.mjs` checks the actual resolved matcher and parser versions, common project/ignore/Windows patterns, real TypeScript project-glob resolution and the parser's default-project matcher. The script uses disposable local TypeScript fixtures, clears parser caches and removes them afterward. No network call, account access, site data mutation or email is involved.

The probe runs before ESLint in `npm run check` and `npm run lint`. A failure stops the lint gate; no rules, audit findings or failed checks are suppressed. It can also be run directly with `npm.cmd run lint:tooling`.

## Apply on the new computer

Merge the complete ZIP into the existing folder. Preserve `.env.local`, the existing `package-lock.json` and independent local changes. A newly resolved lockfile is not bundled: downloading the required package metadata here returned HTTP 403, and lockfile versions/integrities were not invented or edited by hand.

```powershell
Set-Location 'C:\Users\ljsalvador\Downloads\Lorenz Portfolio\zelda-portfolio'
npm.cmd install
npm.cmd audit
npm.cmd run check
```

`npm install` must update the existing lockfile to the new manifest before `npm ci` or deployment. Confirm the header reports **3.6.1**, the matcher/project-resolution probe passes, all four check gates pass and the audit no longer reports this vulnerable nested minimatch copy. An audit can report new issues later; this source patch does not promise a permanent zero finding count.

Commit the updated manifest and generated lockfile together in the deployment repository. This chat has not pushed or deployed the update. To view the latest pages locally after checking, run `npm.cmd run dev` and open `http://localhost:3000`.

If installation, the compatibility probe or any gate fails, retain and share the exact output. Do not bypass it with `--force`, `--legacy-peer-deps` or disabled rules. Restore the preceding manifest and lockfile together if a rollback is needed; that also restores the known audit finding.

## Verification boundary

The 3.5.0 operator results are all passing. Here, all 83 existing Node regression tests pass for 3.6.1, all 122 TS/TSX/MJS files pass syntax parsing, and isolated component checks still confirm the distinct PNG backgrounds, route inheritance, skeleton states, private navigation and audio controls. Runtime dependency declarations match the uploaded lockfile; the override is restricted to the identified parser version. These are source-level checks, not browser or installed-dependency compatibility evidence.

The new matcher/parser compatibility probe, a post-patch audit, full semantic TypeScript, ESLint, the Next production build and browser/live-service checks still need execution on the operator computer because package downloads are blocked in the authoring environment. A configured override is not evidence of a successfully installed or audited dependency tree.

The full ZIP also includes the five distinct page backgrounds and PNG illustrations from 3.6.0. The local folder path is only used in these instructions; application source uses project-relative paths.

## Primary references

- Reviewed advisory and patched minimum: https://github.com/advisories/GHSA-g3hv-75wg-m249
- Maintainer's major-version API changes: https://github.com/isaacs/minimatch/blob/main/changelog.md
- ESLint support status: https://eslint.org/version-support/
- React plugin's published peer ranges: https://github.com/jsx-eslint/eslint-plugin-react/blob/master/package.json
- Import plugin's release history and unreleased ESLint 10 support: https://github.com/import-js/eslint-plugin-import/blob/main/CHANGELOG.md
- npm's scoped override syntax: https://docs.npmjs.com/cli/v11/configuring-npm/package-json#overrides

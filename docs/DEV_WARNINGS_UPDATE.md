# Development warnings — 3.11.1

The supplied log shows a successful development server and successful page responses, with two warnings. Its package banner says 3.9.0, so its manifest is older than the latest archive. Applying the complete update avoids a folder with mixed source versions.

## Changes

The same sky PNG is used by two Image components: Home's hero and the shared fixed backdrop. The backdrop previously used default lazy loading, despite being visible at the top of the page. It now declares `loading="eager"`. Home's hero uses `loading="eager"` and `fetchPriority="high"`, replacing its deprecated `priority` prop. Only the selected route backdrop mounts. Footer and other below-the-fold illustrations retain their normal lazy loading.

The root HTML element now declares `data-scroll-behavior="smooth"`, matching the existing CSS. Next can temporarily coordinate router scrolling without changing same-page smooth scrolling or the explicit motion preference.

These follow the official references:

- https://nextjs.org/docs/app/api-reference/components/image#loading
- https://nextjs.org/docs/messages/missing-data-scroll-behavior

The Turbopack line about waiting for the filesystem means it detected frequent updates; the following Compiled/200 messages show that it continued in the supplied run. Copying/extracting source while the server watches the folder can cause repeated rebuilds. Stop it before applying an archive.

## Apply the complete update

1. In the running terminal press Ctrl+C.
2. Extract the latest complete ZIP over the existing project and choose Replace for its source files. Preserve `.env.local` and `package-lock.json`.
3. In the project folder run:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

The dev banner should show `lorenz-zelda-portfolio@3.11.1`. If it still says 3.9.0, a different or older folder is being run. Open http://localhost:3000 and reload the page. Use Replay welcome to see the current intro. For a phone on the same network, the supplied run's network URL was http://10.22.87.6:3000; use the address printed by the current run because it can change.

This archive includes the prior mobile, fairy, mist/mural/Triforce and curved-paper changes. It does not deploy Vercel or change backend configuration.

## Verification

The 105 existing Node tests, existing isolated structure checks and 132 source syntax transforms pass. Full TypeScript, ESLint and the production build remain blocked by absent dependencies in the authoring workspace. A real Next development-browser run and confirmation that the warnings disappear remain local verification steps; no LCP metric or Lighthouse improvement is claimed.

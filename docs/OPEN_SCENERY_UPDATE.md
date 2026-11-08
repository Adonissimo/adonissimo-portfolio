# Remove green reading panels — 3.14.2

The owner's current screenshots show a dark rectangular column between bright fog banks, plus horizontal bands across the welcome. The previous patch reduced the wash but left its shape and the reading masks in place. This patch removes those mechanisms and keeps contrast close to the lettering.

## Changes

- Remove the full-page reading wash from the shared backdrop component and stylesheet, including compact/day/private variants.
- Remove the copy-bound masks from cloud compositing, CSS rays and fallback fog. Fog no longer measures headings or the main column. Natural cloud density can vary, but layout bounds do not create a separate dark rectangle.
- Use the same cloud strength across the viewport, with a lower uniform level for private pages. Retain the cached texture, configured pixel/paint budgets, calm movement, pause/hidden handling and fallback.
- Remove the welcome mural wash, opaque title-scene fill and title's horizontal bars. Actual film letterboxing remains part of the cutscenes. Remove the film's broad green shade; captions retain text shadows.
- Keep fog and light behind the title/page content. Welcome murals and the existing animated symbols stay visible; the shared fog continues behind them. The cutscenes keep their own light/haze effects.
- Give letters a tighter dark edge by night, a pale edge around dark text by day, and a restrained gold heading accent. There is no background panel around whole paragraphs or sections. Controls keep their existing purposeful fills.
- Add soft green contact shadows that follow the PNGs' real alpha silhouettes, including the backdrop, main scenery and welcome mural art. These follow painted contours instead of filling rectangular image containers. Use a smaller backdrop shadow on phones.
- Match welcome image size hints to their actual responsive mural widths.

Existing opening timing, Skip/Escape, silent entry, fairy movement, page turns, audio preferences, routing and backend behavior are preserved. Quiet auth/admin art stays at low opacity; inputs, buttons, status panels and data tables retain their functional surfaces. No new asset or dependency is added.

## Apply and preview

Stop the dev server with Ctrl+C. Copy the **contents** of the extracted `zelda-portfolio` folder into:

```text
C:\Users\Lorenz Salvador\source\repos\adonissimo-portfolio
```

Preserve `.git`, `.env.local` and your existing `package-lock.json`. Avoid creating a nested `zelda-portfolio` folder inside the Git clone. Then run:

```powershell
cd "C:\Users\Lorenz Salvador\source\repos\adonissimo-portfolio"
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

The terminal should report **3.14.2**. Use Replay welcome, then view Home, Projects, About, Contact, Field notes and detail pages in both themes and at phone width. Check that clouds/light continue across the composition without a layout-sized dark column, that the title has no horizontal bands, and that letter shadows remain readable against the brightest scenery. The green shadow should follow art edges. A real browser check is still needed; source verification is not visual approval.

## Commit and push

After checks pass, run in the same cloned repository:

```powershell
git status
git add .
git diff --cached --stat
git commit -m "Remove green backdrop panels and keep shadows close to text and PNGs"
git push origin main
```

Review the staged changes before committing. The archive does not push to GitHub or publish a deployment by itself.

## Verification

All **117 Node tests pass**. The fog tests now exercise continuous compositing without a copy-bound mask, uniform quiet-page dimming, cached textures, buffer limits, pause and disposal. Seven isolated actual-component fog lifecycle checks and 14 opening/readiness scenarios pass. Targeted source syntax transforms also pass. Project dependencies and a real browser are unavailable here, so semantic TypeScript, ESLint, the production build, rendered contrast and measured device performance remain local gates. The supplied screenshots are diagnosis evidence for the old appearance, not screenshots of this update.

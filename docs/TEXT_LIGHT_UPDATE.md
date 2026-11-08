# Text shadows and visible scenery — 3.14.1

This is the historical 3.14.1 record. The owner's screenshots showed that lightening the washes was insufficient. [Version 3.14.2](OPEN_SCENERY_UPDATE.md) removes them and the fog's text-column masks entirely.

The owner asks for text shadows or golden light so the existing PNG scenery, mist, rays and flares can show through. This is a styling refinement; it adds no dependency, media asset or scroll height.

Public page lettering gets a close dark shadow, and headings get a soft gold halo. Day mode uses a pale edge around dark lettering. Important descriptive copy uses the normal text color. Buttons, form inputs, code and status panels keep crisp lettering without the new shadow.

The public reading wash drops from 97% background color to 72% on desktop and 78% on compact screens; day mode uses 82%. The painted backdrops are more visible. Auth/private pages keep their quiet artwork and 97% wash. Page fog and light shafts now sit above the scenery but beneath main/footer content; opening fog retains its existing dialog layer.

The welcome mural panels are larger, less desaturated and more opaque, with a lighter central wash. Film shade is lighter too. The opening lettering has its own dark shadow and gold halo because the opening stays dark regardless of the page theme. Existing cutscene timing, fairy movement, fog motion, navigation and sound behavior are preserved.

## Apply on Windows

1. Stop the development server with Ctrl+C.
2. Copy the **contents** of the extracted `zelda-portfolio` folder into `C:\Users\Lorenz Salvador\source\repos\adonissimo-portfolio`. Avoid creating another nested project folder. Preserve `.git`, `.env.local` and your local `package-lock.json`.
3. Open a terminal in that cloned repository and run:

```powershell
npm.cmd install
npm.cmd run check
npm.cmd run dev
```

The terminal should show version **3.14.1**. Use Replay welcome to inspect the opening, then check Home, Projects, About, Contact and Field notes in both themes and on a narrow screen. Look for readable copy over the brightest light and densest mist. Check auth/admin retain their quiet background. Commit/push through your existing Git workflow after reviewing the changes; this archive does not publish itself.

## Verification

All **117 Node tests pass**, plus seven isolated fog lifecycle scenarios. No new implementation tests were added for these reversible CSS changes. Project dependencies and a real browser are unavailable in the authoring environment, so TypeScript, ESLint, the production build, rendered readability/contrast and actual device performance are not certified for this patch. Source/hook checks do not substitute for a browser review.

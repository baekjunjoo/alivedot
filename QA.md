# Visual validation — DotPad Motion Test

- Desktop rendering at 1440×960 displays the full live dot field, source controls, translation controls, output connection controls, transport controls, and status footer without clipping.
- Mobile rendering at 390×844 stacks the stage above controls, preserves legible dot-grid contrast, and retains Bluetooth, upload, speed, and playback controls.
- TypeScript validation and production build completed successfully on 2026-09-10.
- Interactive browser testing confirmed that the Play Stream button changes to Pause Stream, advances frames automatically, and clearly identifies the unconnected state as preview-only playback.
- The redesigned elementary playground presents four purpose-drawn, high-contrast tactile animal loops: fish swimming, bird flying, frog jumping, and rabbit hopping. Browser testing confirmed that selection updates the label, tactile prompt, and 60×40 animation.
- Desktop and 390×844 mobile screenshots confirmed legible animal cards, a prominent tactile preview, and responsive ordering of exploration controls.
- The playback control now initializes at 2.5 fps and exposes a 0.5–7.0 fps range. The updated desktop preview displays the 2.5 fps default and video export control.
- Auto Tactile source integration was tested with `mdi:fish` and `fa6-solid:frog`, fetching the Iconify SVGs used by Auto Tactile's own source pipeline, converting them to 60×40 tactile grids, and applying a six-frame motion loop.
- WebM export was tested in Chrome. A valid `tactile-motion.webm` file was downloaded and verified as a 120,094-byte WebM container.
- The expanded catalog displays 17 animals across water, sky, land, and small-friend categories. The water filter reduced the grid to fish, dolphin, whale, octopus, and turtle as expected.
- Selecting dolphin fetched `mdi:dolphin`, converted it to a recognizable 60×40 tactile dolphin, and updated the movement prompt. The movement quiz accepted the correct swimming answer, awarded one star, and showed the success feedback.
- Voice guidance uses the browser's Korean Web Speech API. The sandbox browser exposed no usable speech voice and returned the handled playback-failure message; the control remains browser-native and requires an installed/available Korean browser voice for audible output.
- A 390×844 full-page visual check confirmed a mobile-first reading order: tactile preview and oversized playback controls appear first, followed by the filterable catalog, the large audio button, quiz choices, source tools, and device controls.
- The sky filter correctly narrowed the catalog to bird, owl, butterfly, and bee. Selecting the built-in bird restored its dedicated wing-motion loop and reset the quiz. An intentionally incorrect swimming answer produced the supportive retry message without locking the learner out of a later correct choice.

## Generated-motion replacement validation — 2026-09-10

- Replaced the synthetic icon transformation path and removed the visible Auto Tactile import/conversion interface. The playground now uses a fixed **six-frame 60×40 tactile sequence** derived from generated source motion for each completed animal.
- Fish uses six independently generated high-contrast motion poses after two generated-video candidates failed movement-quality review. Bird, frog, and rabbit use six evenly spaced still frames extracted from their reviewed Seedance 2.0 videos and converted to monochrome tactile grids.
- `pnpm check` and `pnpm build` both completed successfully after the replacement.
- Browser playback verification: starting playback advanced the live label from `실제 동작 01 / 06` to `실제 동작 03 / 06` after 1.3 seconds at the default 2.5 fps setting.
- Browser visual checks confirmed distinct, readable fish, bird, and frog source silhouettes in the matrix. The frog preview presented the extended jump pose; the bird preview presented the wing-up pose.
- The generated WebM export was tested with the frog motion. It completed and created `frog-higgsfield-tactile-motion.webm` (141,033 bytes) in the browser downloads folder.
- The frog movement quiz was verified: selecting `깡충 뛰기` awarded one star and returned the positive feedback message.
- Full-page 390×844 mobile visual validation confirmed the matrix and play/export controls appear before the long catalog, and all catalog, explanation, quiz, pipeline, and connection controls remain legible and usable below it.

## Full 17-animal catalog and slow exploration validation — 2026-09-11

The catalog now contains six tactile pose frames for all seventeen animals. The existing fish, bird, frog, and rabbit sequences remain in place. Higgsfield GPT Image 2.5 produced a further seventy-eight high-contrast source poses for dolphin, whale, octopus, turtle, owl, butterfly, bee, cat, dog, lion, elephant, monkey, and snail. Each source was cropped around its black silhouette, resized to preserve a large touch-readable form, lightly thickened, and encoded as a 60×40 monochrome tactile grid. The conversion output reports a non-zero foreground-dot count for all 78 new frames.

| Verification area | Result |
|---|---|
| TypeScript and production build | Passed with `pnpm check` and `pnpm build` |
| Catalog availability | All 17 animal controls are active; no card remains marked as pending |
| Generated source coverage | 13 new animals × 6 frames = 78 converted tactile grids |
| Desktop visual review | The full catalog badge reads 17 and the 60×40 preview renders generated silhouettes clearly |
| Mobile visual review | The play, speed, and slow-exploration controls remain before the scrollable catalog at 390×844 |
| Dolphin selection | Selecting dolphin loaded its generated six-frame sequence and updated the learning prompt |
| Slow exploration mode | Starting manual mode changed the control to frame 1 replay, sent the first frame, and requested a Korean voice guide |
| Manual next frame | Moving from dolphin frame 1 to frame 2 updated the preview label and silhouette, while retaining voice guidance |
| Monkey selection | Selecting the newly generated monkey sequence loaded its hop-pose frame 1 without a pending-state message |

A physical DotPad was not available in the preview environment, so Bluetooth/USB pin output requires final hardware verification. The browser flow calls the same existing DotPad SDK graphic-output routine for automatic playback and each manual slow-exploration step.


## Frame-specific narration and motion-review quiz validation — 2026-09-11

- Added an explicit Korean tactile narration for every six-frame sequence across all 17 animals. The directions name concrete changing forms—such as a cat's left and right forepaws, a turtle's alternating flippers, a fish's left/right tail curve, or an elephant's forward foot and swinging trunk—rather than repeating a generic frame prompt.
- Slow exploration now records each uniquely visited frame. The motion-recall card remains locked at `0 / 6` and unlocks only after the learner has manually explored all six poses.
- The unlocked review UI presents four animal-name choices selected from the active animal's category first. It supports a retry after an incorrect answer and locks into a positive completion state after the correct answer.
- `pnpm check` and `pnpm build` passed after the update.
- Browser interaction test: manually advanced the fish sequence from frame 1 to frame 6; the review card changed from locked `0 / 6` through `5 / 6` to unlocked with fish, dolphin, whale, and octopus choices. Both wrong-answer hint and correct-answer completion feedback were verified.
- Full-page 390×844 visual review verified that the review card is directly below slow-exploration controls without horizontal overflow and remains legible before the catalog.


## SAM2-inspired research landing redesign — 2026-09-11

The interface was reworked around a clean research-landing visual system: an off-white canvas, cobalt-blue hero field, oversized Korean headline, restrained rounded controls, light card surfaces, and a high-contrast blue tactile-motion stage. The DotPad output, 17-animal catalog, voice guidance, motion quizzes, video export, and manual slow-exploration controls remain functionally unchanged.

| Validation area | Result |
|---|---|
| TypeScript and production build | Passed with `pnpm check` and `pnpm build` |
| Desktop visual review | At 1440×960, the blue hero, left catalog rail, prominent tactile stage, and white research-style control surfaces render without clipping |
| Mobile visual review | At 390×844, the page follows a clear sequence of hero, tactile animation, transport controls, slow exploration, catalog, learning prompt, quiz, pipeline, and connection controls |
| Catalog interaction | The Water filter reduced the catalog to fish, dolphin, whale, octopus, and turtle after the visual redesign |


## GitHub Pages root-route correction and AliveDot intro — 2026-09-11

The initial public-page failure was traced to client-side routing rather than an absent Pages artifact. GitHub Pages correctly serves the application from the `/alivedot/` project subpath, while the former Wouter configuration matched only `/` and therefore displayed the app’s 404 component. The router now uses Vite’s deployment base path, so `/alivedot/` resolves to the home screen in production while local development continues to use `/`.

The header is now simply **AliveDot**, and the intro states the product purpose directly: AliveDot converts animal movement into tactile frames that can be explored slowly on DotPad. The previous “동물놀이터” brand label has been removed from the product UI, document title, and project heading.


## Slow navigation and readability pass — 2026-09-11

The default automatic playback setting is now **0.5 fps**, allowing a full two seconds for each tactile frame. The DotPad SDK’s `keyCallBack` is registered for `PanningLeft` and `PanningRight`; while slow exploration is active, left moves to the preceding frame and right advances to the following frame, sends that frame to the connected DotPad, and speaks the matching frame-specific narration. When slow exploration has not started, panning keys provide a concise instruction rather than altering the automatic playback state.

A readability pass enlarged instructional labels, catalog text, quiz text, buttons, control labels, status text, and the purpose copy, while increasing the muted-text contrast. The desktop browser check confirmed that the UI displays **0.5 fps** by default and surfaces the panning-key instruction in the slow-exploration panel. TypeScript validation and the production build completed successfully.


## Simulator-to-DotPad graphic alignment correction — 2026-09-11

The visual mismatch was caused by sending the generated source frame bytes directly to the DotPad SDK. Those sources are stored as 64×40 row-packed data: 60 visible dots plus four end-of-row padding dots, which produces a 640-byte hexadecimal stream. The on-screen simulator correctly reads that row-packed source, but DotPad `GraphicMode` accepts 30×10 two-by-four tactile cells, or 600 bytes, with left-column bits 0–3 and right-column bits 4–7.

The simulator remains tied to the source-frame layout. Before every hardware transmission, the same 60×40 visible grid is now converted to the DotPad graphic-cell layout. A deterministic round-trip validation passed for all **102** motion frames: source row data → simulator grid → DotPad cells → device grid produced identical 60×40 tactile dots. TypeScript validation and the production build also passed.


## Tactile animal recognition enhancement — 2026-09-11

Eight visually ambiguous motion sets were revised directly in their existing 60×40 tactile frames; no additional generated media was used. **Elephant** now has a stronger long trunk, broad ear, and tusks; **monkey** has a separate curled tail; **lion** has a raised mane ring; **owl** has two recessed eyes and a pointed beak; **bee** has three abdomen bands and antennae; **butterfly** has a thin central body, separated wing edges, and antennae; **octopus** has eight distinct lower tentacles; and **turtle** has a segmented shell and extended head.

All 17 catalog entries retain six 60×40 frames, for 102 frames in total. The local browser check confirmed the updated octopus silhouette and its focused prompt, “아래로 갈라진 여덟 다리를 세어보세요.” TypeScript validation and the production build passed.


## Sparse tactile silhouette redesign — 2026-09-11

The eight ambiguous animals were rebuilt as native 60×40 tactile diagrams rather than downsampled AI silhouettes. Each drawing now uses a low-density, three-dot-thick outline and deliberately preserved empty space. The distinguishing structures are part of the primary outline: elephant trunk and ear, monkey’s curled tail, lion’s mane ring, owl’s paired eyes and beak, bee’s abdomen bands, butterfly’s separated wing pairs, octopus’s eight tentacles, and turtle’s segmented shell.

The sequences retain six distinct poses each and were verified frame by frame. Density ranges from 263 to 562 raised dots per 2,400-dot frame, leaving substantially more negative space than the prior filled forms. Every frame was also round-trip checked against the DotPad 30×10 graphic-cell encoding; the decoded DotPad grid exactly matches the simulator’s 60×40 grid. TypeScript validation and the production build passed.

# Higgsfield Motion Sources

The generated-motion prototype replaces synthetic shift/pulse animation with six tactile source frames per supported animal. Each sequence is encoded as 60×40 monochrome row-major frame data in `client/src/generatedMotionFrames.ts`.

| Animal | Source method | Validated motion result |
|---|---|---|
| Fish | Six individually generated pose frames derived from `gpt_image_2` reference `b54e8aff-3642-4291-b445-665e6e258ad3` because two video trials were unsuitable. | Alternating tail/body curvature across a forward-positioned six-frame sequence. |
| Bird | Six frames extracted at 0.15, 0.85, 1.50, 2.15, 2.80, and 3.45 seconds from [Seedance 2.0 video](https://d8j0ntlcm91z4.cloudfront.net/user_3CcWiPncoAiF9dchSMyN7go3kbf/hf_20260910_070632_3b47ddbd-e76b-4492-aebc-6f7d7aea7a50.mp4). | Three high-contrast wing-flap cycles with slight rightward motion. |
| Frog | Six frames extracted at the same timestamps from [Seedance 2.0 video](https://d8j0ntlcm91z4.cloudfront.net/user_3CcWiPncoAiF9dchSMyN7go3kbf/hf_20260910_070633_b60da754-80c8-46b8-8e2e-553c30707e03.mp4). | Crouch, push-off, airborne arc, landing, and return to crouch. |
| Rabbit | Six frames extracted at the same timestamps from [Seedance 2.0 video](https://d8j0ntlcm91z4.cloudfront.net/user_3CcWiPncoAiF9dchSMyN7go3kbf/hf_20260910_070632_3f225666-0d67-47e1-be62-848bf7e27e18.mp4). | Rhythmic in-place bounding with clearly changing leg positions. |

The initial fish [video](https://d8j0ntlcm91z4.cloudfront.net/user_3CcWiPncoAiF9dchSMyN7go3kbf/hf_20260910_070632_76f57d9c-3974-4a88-886d-84adfa349d91.mp4) was fully static. A regeneration [video](https://d8j0ntlcm91z4.cloudfront.net/user_3CcWiPncoAiF9dchSMyN7go3kbf/hf_20260910_074421_d87aac6e-c011-4156-a166-1d00aa34d787.mp4) only flipped orientation, so neither was used in the tactile sequence.

## Full catalog extension — 2026-09-11

The motion library now covers the complete seventeen-animal learning catalog. The original four prototype sequences—fish, bird, frog, and rabbit—remain unchanged. For the remaining thirteen animals, Higgsfield GPT Image 2.5 was used to generate one neutral reference pose and five reference-based motion poses per animal. The result is 78 source images covering dolphin and whale tail beats; octopus arm sweeps; turtle paddles; owl, butterfly, and bee wing cycles; cat, dog, lion, and elephant walk cycles; a monkey hop; and a snail crawl.

The source images are not displayed directly in the website. `/home/ubuntu/dotpad-motion-assets/build_catalog_frames.py` converts each source image into a 60×40 tactile silhouette by detecting the black foreground against the white background, adding a protective crop margin, fitting the silhouette within a 52×33-dot safe area, and lightly thickening it before hexadecimal DotPad encoding. The generated data is embedded in `client/src/generatedMotionFrames.ts`; image files remain outside the WebDev project under `/home/ubuntu/dotpad-motion-assets/catalog-generated-frames/`.

The user approved the planned 78-image Higgsfield generation budget of 117 credits before execution. The generated sources are recorded in `/home/ubuntu/dotpad-motion-assets/catalog-frame-conversion-report.json`, including the generation identifier, source URL, local cache path, and active-dot count for every frame.

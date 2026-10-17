# CLI recordings

[VHS](https://github.com/charmbracelet/vhs) drives the quickstart's keystrokes;
[asciinema](https://asciinema.org/) records the terminal output. Tapes live beside
the CLI examples and share settings via `Source packages/cli/demo/settings.tape`.
Run commands from the repository root.

## Record the quickstart

Install asciinema 3+, VHS, ffmpeg, ttyd, Chromium/Chrome, and the JetBrains Mono font.
Install workspace dependencies with `bun install --frozen-lockfile`, then run:

```sh
vhs validate packages/cli/demo/quickstart.tape
bash packages/cli/demo/record-quickstart.sh
```

This updates the versioned assets:

- `docs/public/demos/quickstart.cast` — terminal recording used by the website
- `docs/public/demos/quickstart.png` — poster for video exports
- `docs/public/demos/quickstart.webm` — optional video export

The tape pauses asciinema capture before exiting, so playback keeps the final
result rather than showing exit notifications or the restored shell. `cast.ts`
strips host metadata and input events, validates successful completion, and removes
any alternate-screen teardown. Temporary captures and frames are removed automatically.

For video exports, the shared settings render a 900 × 600 logical terminal at 2×
pixel density. The script encodes original PNG frames as lossless VP9 with full
color resolution (`yuv444p`). Keep its frame rate in sync with `settings.tape`.

## Website playback

The homepage loads the self-hosted asciinema player only in the browser and waits
for Geist Mono before measuring terminal cells. It autoplays once, hides controls,
and retains the final frame. The player determines its own height; the screenshot
isn't used by the website. Before playback loads, the terminal frame stays empty.
Reduced-motion visitors see the final terminal frame without animation.

The `.cast` contains text and ANSI instructions, not pixels; playback stays sharp
at any display density. The WebM export is retained for places that need video,
but isn't loaded by the homepage.

## Demo scenario

The clip starts zaly with `--yolo`, references a file with `@`, fixes a calculation
bug, and runs two tests. Model responses are **scripted**, not live inference; the
CLI, renderer, file reads, edit, and `bun test` are real. The demo refuses to report
success if a tool fails or the tests exit unsuccessfully.

`quickstart.ts` isolates config, credentials, plugins, and sessions in a fresh
temporary project, removed on exit. No API key or model service is needed:

```sh
bun packages/cli/demo/quickstart.ts --yolo
```

Regenerate manually when the demonstrated UI or workflow changes; there is no CI
recording job. Review the playback before committing sources and generated assets.
Keep intermediate frames and debugging captures outside the repository.

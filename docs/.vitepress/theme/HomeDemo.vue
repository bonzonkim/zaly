<script setup lang="ts">
import type { Player } from "asciinema-player"

import { onBeforeUnmount, onMounted, ref } from "vue"

const container = ref<HTMLElement>()
const failed = ref(false)
let player: Player | undefined
let disposed = false

onMounted(async () => {
  const reducedMotion = globalThis.matchMedia("(prefers-reduced-motion: reduce)").matches
  try {
    const [{ create }, response] = await Promise.all([
      import("asciinema-player"),
      fetch("/demos/quickstart.cast"),
      import("asciinema-player/dist/bundle/asciinema-player.css"),
      document.fonts.load('400 16px "Geist Mono"'),
      document.fonts.load('700 16px "Geist Mono"'),
    ])
    if (!response.ok) throw new Error("Could not load the terminal recording")
    const data = await response.text()
    if (disposed || !container.value) return
    const lines = data.trim().split("\n")
    const { width: cols, height: rows } = JSON.parse(lines[0])
    const [end] = JSON.parse(lines.at(-1)!)
    player = create({ data }, container.value, {
      autoplay: !reducedMotion,
      cols,
      controls: false,
      cursorMode: reducedMotion ? "steady" : "blinking",
      fit: "width",
      loop: false,
      poster: reducedMotion ? `npt:${end}` : undefined,
      rows,
      terminalFontFamily: '"Geist Mono", monospace',
      terminalLineHeight: 1.4,
      theme: "zaly",
    })
  } catch {
    player?.dispose()
    player = undefined
    if (!disposed) failed.value = true
  }
})

onBeforeUnmount(() => {
  disposed = true
  player?.dispose()
})
</script>

<template>
  <figure class="home-demo" aria-label="Zaly quickstart: fix a calculation bug and run its tests">
    <p v-if="failed" class="home-demo-error" role="status">Terminal demo unavailable.</p>
    <div v-else ref="container" class="home-demo-player" />
  </figure>
</template>

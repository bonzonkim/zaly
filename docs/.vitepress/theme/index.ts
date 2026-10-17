// oxlint-disable import/no-unassigned-import
import type { Theme } from "vitepress"

import DefaultTheme from "vitepress/theme-without-fonts"
// @ts-ignore -- Virtual stylesheet supplied by the group-icons Vite plugin.
import "virtual:group-icons.css"
import "./fonts.css"
import "./custom.css"
// @ts-ignore -- Vue SFC, no .d.ts generated.
import Layout from "./Layout.vue"

const theme: Theme = { extends: DefaultTheme, Layout }

export default theme

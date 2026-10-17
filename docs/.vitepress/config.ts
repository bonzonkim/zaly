import { defineConfig } from "vitepress"
import { groupIconMdPlugin, groupIconVitePlugin } from "vitepress-plugin-group-icons"

export default defineConfig({
  title: "zaly",
  description: "Hackable terminal coding agent.",
  cleanUrls: true,
  head: [
    ["link", { rel: "icon", type: "image/svg+xml", href: "/logo/mark.svg" }],
    [
      "link",
      {
        rel: "preload",
        href: "/fonts/geist-1.8.1/Geist-Variable.woff2",
        as: "font",
        type: "font/woff2",
        crossorigin: "anonymous",
      },
    ],
  ],
  srcExclude: ["nav.md"],
  sitemap: { hostname: "https://zaly.dev" },
  markdown: {
    // theme: { light: "github-light", dark: "tokyo-night" },
    config(md) {
      md.use(groupIconMdPlugin)
    },
  },
  vite: {
    plugins: [
      groupIconVitePlugin({
        customIcon: {
          bun: "logos:bun",
          npm: "logos:npm-icon",
          pnpm: "logos:pnpm",
          yarn: "logos:yarn",
        },
      }),
    ],
  },
  themeConfig: {
    logo: { light: "/logo/wordmark-light.svg", dark: "/logo/wordmark-dark.svg", alt: "zaly" },
    siteTitle: false,
    nav: [
      { text: "Guide", link: "/guide/" },
      { text: "Configuration", link: "/configuration/" },
      { text: "Extend", link: "/extend/" },
      { text: "Reference", link: "/reference/cli" },
      { text: "Developer", link: "/developer" },
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting started", link: "/guide/" },
          { text: "Installation & terminals", link: "/guide/installation" },
          { text: "Interface", link: "/guide/interface" },
          { text: "Conversation & tasks", link: "/guide/conversation" },
          { text: "Sessions & context", link: "/guide/sessions" },
          { text: "Troubleshooting", link: "/guide/troubleshooting" },
        ],
      },
      {
        text: "Configuration",
        items: [
          { text: "Configuration files", link: "/configuration/" },
          { text: "Authentication & models", link: "/configuration/models" },
          { text: "ChatGPT subscription / Codex", link: "/configuration/codex" },
          { text: "Permissions", link: "/configuration/permissions" },
          { text: "Resources & appearance", link: "/configuration/resources" },
        ],
      },
      {
        text: "Extend zaly",
        items: [
          { text: "Overview", link: "/extend/" },
          { text: "Project instructions", link: "/extend/instructions" },
          { text: "Custom commands", link: "/extend/commands" },
          { text: "Templates", link: "/extend/templates" },
          { text: "Skills", link: "/extend/skills" },
          { text: "Plugins & packs", link: "/extend/plugins" },
        ],
      },
      {
        text: "Reference",
        items: [
          { text: "CLI", link: "/reference/cli" },
          { text: "Slash commands", link: "/reference/commands" },
          { text: "Keybindings", link: "/reference/keybindings" },
          { text: "Settings", link: "/reference/settings" },
          { text: "Tools", link: "/reference/tools" },
          { text: "Paths & environment", link: "/reference/paths" },
        ],
      },
      { text: "Developer resources", link: "/developer" },
    ],
    search: { provider: "local" },
    socialLinks: [{ icon: "github", link: "https://github.com/folke/zaly" }],
    editLink: { pattern: "https://github.com/folke/zaly/edit/main/docs/:path" },
    footer: { message: "Released under the MIT License.", copyright: "Copyright © Folke Lemaitre" },
  },
})

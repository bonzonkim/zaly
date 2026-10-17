<script setup lang="ts">
import DefaultTheme from "vitepress/theme-without-fonts"
import HomeDemo from "./HomeDemo.vue"
import HomeInstall from "./HomeInstall.md"
</script>

<template>
  <DefaultTheme.Layout>
    <template #home-hero-actions-after>
      <div class="home-install vp-doc"><HomeInstall /></div>
    </template>
    <template #home-hero-image>
      <HomeDemo />
    </template>
  </DefaultTheme.Layout>
</template>

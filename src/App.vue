<template>
  <SkillManagePage />
</template>

<script setup lang="ts">
import SkillManagePage from '@/pages/SkillManagePage.vue'
</script>

<style>
:root {
  --bg-primary: #f5f7fa;
  --bg-card: #ffffff;
  --text-primary: #303133;
  --text-secondary: #606266;
  --text-tertiary: #909399;
  --border-color: #dcdfe6;
  --border-color-light: #e4e7ed;
  --color-primary: #409eff;
  --bg-hover: #f5f7fa;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
}

#app {
  min-height: 100vh;
}
</style>

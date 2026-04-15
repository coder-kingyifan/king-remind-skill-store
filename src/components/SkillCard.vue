<template>
  <div class="skill-card" :style="{ '--card-accent': categoryGradient(skill.category) }">
    <div class="card-bar" :style="{ background: categoryGradient(skill.category) }" />
    <div class="card-top">
      <div class="card-icon" :style="{ background: categoryGradient(skill.category) }">{{ skill.icon }}</div>
      <div class="card-type-tag">
        <el-tag v-if="skill.action_type === 'builtin'" size="small" type="info" effect="plain" round>待迁移</el-tag>
        <el-tag v-else-if="skill.action_type === 'api_call'" size="small" type="success" effect="plain" round>API</el-tag>
        <el-tag v-else-if="skill.action_type === 'ai_prompt'" size="small" type="warning" effect="plain" round>大模型</el-tag>
        <el-tag v-else-if="skill.action_type === 'search_and_summarize'" size="small" type="danger" effect="plain" round>搜索+大模型</el-tag>
      </div>
    </div>
    <div class="card-name">{{ skill.name }}</div>
    <div class="card-desc">{{ skill.description || '暂无描述' }}</div>
    <div class="card-tags">
      <el-tag size="small" effect="plain" round>{{ getCategoryLabel(skill.category) }}</el-tag>
      <el-tag v-if="skill.author" size="small" type="info" effect="plain" round>{{ skill.author }}</el-tag>
    </div>
    <div class="card-bottom">
      <div class="card-meta">v{{ skill.version }} · {{ skill.skill_key }}</div>
      <div class="card-btns">
        <span class="card-btn" title="编辑" @click="$emit('edit', skill)"><el-icon><Edit /></el-icon></span>
        <span class="card-btn" title="复制" @click="$emit('duplicate', skill.skill_key)"><el-icon><CopyDocument /></el-icon></span>
        <span class="card-btn danger" title="删除" @click="$emit('delete', skill)"><el-icon><Delete /></el-icon></span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Edit, Delete, CopyDocument } from '@element-plus/icons-vue'
import { SKILL_CATEGORIES } from '@/types/skill'
import type { StoreSkill } from '@/types/skill'

defineProps<{
  skill: StoreSkill
}>()

defineEmits<{
  (e: 'edit', skill: StoreSkill): void
  (e: 'delete', skill: StoreSkill): void
  (e: 'duplicate', skillKey: string): void
}>()

const GRADIENTS: Record<string, string> = {
  weather: 'linear-gradient(135deg, #74b9ff, #0984e3)',
  daily: 'linear-gradient(135deg, #ffeaa7, #f39c12)',
  health: 'linear-gradient(135deg, #55efc4, #00b894)',
  finance: 'linear-gradient(135deg, #fab1a0, #e17055)',
  study: 'linear-gradient(135deg, #a29bfe, #6c5ce7)',
  tools: 'linear-gradient(135deg, #81ecec, #00cec9)',
  custom: 'linear-gradient(135deg, #fd79a8, #e84393)'
}

function categoryGradient(key: string): string {
  return GRADIENTS[key] || GRADIENTS.custom
}

function getCategoryLabel(key: string): string {
  const cat = SKILL_CATEGORIES.find(c => c.key === key)
  return cat ? cat.label : key
}
</script>

<style scoped>
.skill-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  transition: box-shadow 0.2s, transform 0.2s;
  position: relative;
  overflow: hidden;
}

.skill-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--card-accent, linear-gradient(135deg, #fd79a8, #e84393));
}

.skill-card:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.07);
  transform: translateY(-1px);
}

.card-bar {
  display: none;
}

.card-top {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
}

.card-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

.card-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  line-height: 1.3;
}

.card-desc {
  font-size: 12px;
  color: var(--text-tertiary);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  flex: 1;
}

.card-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.card-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
}

.card-meta {
  font-size: 11px;
  color: var(--text-tertiary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 160px;
}

.card-btns {
  display: flex;
  gap: 2px;
}

.card-btn {
  width: 28px;
  height: 28px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  cursor: pointer;
  color: var(--text-tertiary);
  transition: all 0.15s;
  font-size: 14px;
}

.card-btn:hover {
  background: var(--bg-hover);
  color: var(--color-primary);
}

.card-btn.danger:hover {
  color: #F56C6C;
}
</style>

<template>
  <el-dialog
    :model-value="visible"
    title="迁移内置技能"
    width="720px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <div class="migration-intro">
      以下技能为 <code>builtin</code> 类型（应用内置逻辑），需要迁移为新的执行方式。请为每个技能选择目标类型，迁移后可再编辑具体配置。
    </div>

    <div class="migration-list">
      <div v-for="item in migrationItems" :key="item.skill.skill_key" class="migration-row">
        <div class="migration-info">
          <span class="migration-icon">{{ item.skill.icon }}</span>
          <span class="migration-name">{{ item.skill.name }}</span>
          <span class="migration-key">{{ item.skill.skill_key }}</span>
        </div>
        <div class="migration-action">
          <el-select v-model="item.targetType" placeholder="选择目标类型" style="width: 200px;">
            <el-option
              v-for="at in ACTION_TYPES"
              :key="at.value"
              :label="at.label"
              :value="at.value"
            />
          </el-select>
        </div>
      </div>
    </div>

    <div v-if="builtinSkills.length === 0" class="no-builtin">
      没有需要迁移的内置技能
    </div>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button
        type="primary"
        :loading="migrating"
        :disabled="!canMigrate"
        @click="handleMigrate"
      >
        迁移 {{ builtinSkills.length }} 个技能
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ACTION_TYPES } from '@/types/skill'
import type { StoreSkill } from '@/types/skill'

const props = defineProps<{
  visible: boolean
  builtinSkills: StoreSkill[]
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'migrated', updates: { skillKey: string; newType: string }[]): void
}>()

const migrating = ref(false)

interface MigrationItem {
  skill: StoreSkill
  targetType: string
}

const migrationItems = ref<MigrationItem[]>(
  props.builtinSkills.map(skill => ({
    skill,
    targetType: 'ai_prompt' // 默认推荐大模型对话
  }))
)

const canMigrate = computed(() => {
  return migrationItems.value.length > 0 &&
    migrationItems.value.every(item => item.targetType)
})

async function handleMigrate() {
  migrating.value = true
  try {
    const updates = migrationItems.value.map(item => ({
      skillKey: item.skill.skill_key,
      newType: item.targetType
    }))
    emit('migrated', updates)
  } finally {
    migrating.value = false
  }
}
</script>

<style scoped>
.migration-intro {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 16px;
  line-height: 1.6;
}

.migration-intro code {
  background: var(--bg-hover);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 12px;
}

.migration-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.migration-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: var(--bg-primary);
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
}

.migration-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.migration-icon {
  font-size: 18px;
}

.migration-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.migration-key {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-hover);
  padding: 1px 6px;
  border-radius: 4px;
}

.no-builtin {
  text-align: center;
  padding: 24px;
  color: var(--text-tertiary);
  font-size: 13px;
}
</style>

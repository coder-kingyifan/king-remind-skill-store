<template>
  <el-dialog
    :model-value="visible"
    :title="skill ? '编辑技能' : '新建技能'"
    width="700px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
    class="skill-form-dialog"
  >
    <el-form ref="formRef" :model="form" :rules="rules" label-position="top" size="default">
      <!-- 第一行：图标 + 名称 + skill_key -->
      <div class="section-header">
        <span class="section-title">基本信息</span>
      </div>
      <div class="row-basic">
        <el-popover placement="bottom-start" :width="300" trigger="click">
          <template #reference>
            <div class="icon-picker">
              <span class="icon-display">{{ form.icon }}</span>
              <span class="icon-label">图标</span>
            </div>
          </template>
          <div class="icon-grid">
            <span
              v-for="emoji in skillEmojis"
              :key="emoji"
              class="icon-option"
              :class="{ active: form.icon === emoji }"
              @click="form.icon = emoji"
            >{{ emoji }}</span>
          </div>
        </el-popover>
        <div class="basic-fields">
          <el-form-item label="技能名称" prop="name" class="field-name">
            <el-input v-model="form.name" placeholder="如：天气查询" maxlength="30" />
          </el-form-item>
          <el-form-item label="技能标识 (skill_key)" prop="skill_key" class="field-key">
            <el-input v-model="form.skill_key" :disabled="!!skill" placeholder="如：weather" maxlength="50" />
          </el-form-item>
        </div>
      </div>

      <el-form-item label="描述" prop="description">
        <el-input v-model="form.description" type="textarea" :rows="2" placeholder="简要描述技能功能" maxlength="200" show-word-limit />
      </el-form-item>

      <!-- 第二行：分类 + 类型 + 版本 + 作者 -->
      <div class="row-meta">
        <el-form-item label="分类" class="field-equal">
          <el-select v-model="form.category" style="width: 100%;">
            <el-option v-for="cat in SKILL_CATEGORIES" :key="cat.key" :label="cat.icon + ' ' + cat.label" :value="cat.key" />
          </el-select>
        </el-form-item>
        <el-form-item label="技能类型" prop="action_type" class="field-equal">
          <el-select v-model="form.action_type" style="width: 100%;">
            <el-option v-for="at in ACTION_TYPES" :key="at.value" :label="at.label" :value="at.value" />
          </el-select>
        </el-form-item>
        <el-form-item label="版本" class="field-version">
          <el-input v-model="form.version" placeholder="1.0.0" />
        </el-form-item>
        <el-form-item label="作者" class="field-author">
          <el-input v-model="form.author" placeholder="king-remind" />
        </el-form-item>
      </div>

      <!-- 标签 -->
      <el-form-item label="标签">
        <div class="tags-editor">
          <el-tag
            v-for="(tag, index) in form.tags"
            :key="index"
            closable
            size="small"
            @close="removeTag(index)"
          >{{ tag }}</el-tag>
          <el-input
            v-if="tagInputVisible"
            ref="tagInputRef"
            v-model="tagInputValue"
            size="small"
            style="width: 100px;"
            @keyup.enter="addTag"
            @blur="addTag"
          />
          <el-button v-else size="small" @click="showTagInput">+ 标签</el-button>
        </div>
      </el-form-item>

      <!-- 动作配置 -->
      <div class="section-header">
        <span class="section-title">动作配置</span>
        <span class="section-desc">根据技能类型配置具体执行逻辑</span>
      </div>
      <ActionConfigEditor v-model="form.action_config" :action-type="form.action_type" />

      <!-- 配置模式 -->
      <div class="section-header" style="margin-top: 16px;">
        <span class="section-title">用户配置项</span>
        <span class="section-desc">定义用户可自定义的配置字段</span>
      </div>
      <ConfigSchemaEditor v-model="form.config_schema" />
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" :loading="saving" @click="handleSave">
        {{ skill ? '保存修改' : '创建技能' }}
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, nextTick, watch } from 'vue'
import { SKILL_CATEGORIES, ACTION_TYPES } from '@/types/skill'
import type { StoreSkill } from '@/types/skill'
import ActionConfigEditor from './ActionConfigEditor.vue'
import ConfigSchemaEditor from './ConfigSchemaEditor.vue'

const props = defineProps<{
  visible: boolean
  skill: StoreSkill | null
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
  (e: 'saved', skillData: StoreSkill): void
}>()

const formRef = ref()
const saving = ref(false)
const tagInputVisible = ref(false)
const tagInputValue = ref('')
const tagInputRef = ref()

const skillEmojis = [
  '⚡', '🌤️', '💬', '⏳', '💧', '📜', '🍎', '🏃', '📚', '😄',
  '⭐', '🌙', '📝', '💰', '💱', '📈', '🔧', '🎯', '🔔', '🎵',
  '🏠', '✈️', '🎮', '🎨', '📸', '🍔', '☕', '🌍', '🔬', '📊',
  '💻', '📰', '💪', '🥗', '😴', '🌐', '🧊', '🛡️', '🎪', '🏆'
]

interface FormState {
  skill_key: string
  name: string
  description: string
  icon: string
  category: string
  action_type: 'builtin' | 'api_call' | 'ai_prompt' | 'search_and_summarize'
  action_config: string
  config_schema: string
  version: string
  author: string
  tags: string[]
}

function getDefaultForm(): FormState {
  return {
    skill_key: '',
    name: '',
    description: '',
    icon: '⚡',
    category: 'custom',
    action_type: 'api_call',
    action_config: '{}',
    config_schema: '[]',
    version: '1.0.0',
    author: 'king-remind',
    tags: []
  }
}

const form = ref<FormState>(getDefaultForm())

const rules = {
  skill_key: [{ required: true, message: '请输入技能标识', trigger: 'blur' }],
  name: [{ required: true, message: '请输入技能名称', trigger: 'blur' }],
  action_type: [{ required: true, message: '请选择技能类型', trigger: 'change' }]
}

// 组件创建时立即填充表单，以及 skill prop 变化时重新填充
watch(() => props.skill, (skill) => {
  if (skill) {
    form.value = {
      skill_key: skill.skill_key,
      name: skill.name,
      description: skill.description,
      icon: skill.icon,
      category: skill.category,
      action_type: skill.action_type,
      action_config: skill.action_config,
      config_schema: skill.config_schema,
      version: skill.version,
      author: skill.author,
      tags: [...skill.tags]
    }
  } else {
    form.value = getDefaultForm()
  }
}, { immediate: true })

function removeTag(index: number) {
  form.value.tags.splice(index, 1)
}

function showTagInput() {
  tagInputVisible.value = true
  tagInputValue.value = ''
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

function addTag() {
  const val = tagInputValue.value.trim()
  if (val && !form.value.tags.includes(val)) {
    form.value.tags.push(val)
  }
  tagInputVisible.value = false
  tagInputValue.value = ''
}

async function handleSave() {
  if (!formRef.value) return
  await formRef.value.validate(async (valid: boolean) => {
    if (!valid) return
    saving.value = true
    try {
      const skillData: StoreSkill = {
        skill_key: form.value.skill_key,
        name: form.value.name,
        description: form.value.description,
        icon: form.value.icon,
        category: form.value.category,
        action_type: form.value.action_type,
        action_config: form.value.action_config,
        config_schema: form.value.config_schema,
        version: form.value.version,
        author: form.value.author,
        tags: [...form.value.tags]
      }
      emit('saved', skillData)
      emit('update:visible', false)
    } finally {
      saving.value = false
    }
  })
}
</script>

<style scoped>
/* 分区标题 */
.section-header {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 12px;
  margin-top: 4px;
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.section-desc {
  font-size: 12px;
  color: var(--text-tertiary);
}

/* 第一行：图标 + 名称/key */
.row-basic {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 4px;
}

.icon-picker {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 72px;
  border: 1px solid var(--border-color-light);
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.15s;
  flex-shrink: 0;
  gap: 2px;
  margin-top: 4px;
}

.icon-picker:hover {
  border-color: var(--color-primary);
  background: var(--bg-hover);
}

.icon-display {
  font-size: 28px;
  line-height: 1;
}

.icon-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

.basic-fields {
  flex: 1;
  display: flex;
  gap: 12px;
}

.field-name {
  flex: 1;
}

.field-key {
  flex: 1;
}

/* 第二行：分类/类型/版本/作者 */
.row-meta {
  display: flex;
  gap: 12px;
}

.field-equal {
  flex: 2;
}

.field-version {
  flex: 1;
}

.field-author {
  flex: 1;
}

/* 图标选择器 */
.icon-grid {
  display: grid;
  grid-template-columns: repeat(8, 1fr);
  gap: 4px;
}

.icon-option {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 8px;
  font-size: 18px;
  transition: all 0.15s;
}

.icon-option:hover {
  background: var(--bg-hover);
  transform: scale(1.15);
}

.icon-option.active {
  background: var(--color-primary);
  color: #fff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

/* 标签编辑器 */
.tags-editor {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
</style>

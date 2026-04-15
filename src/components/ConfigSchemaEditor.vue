<template>
  <div class="config-schema-editor">
    <div class="field-list">
      <div v-for="(field, index) in fields" :key="index" class="field-item">
        <div class="field-row">
          <el-input v-model="field.key" placeholder="字段 key" style="width: 120px;" size="small" />
          <el-input v-model="field.label" placeholder="标签" style="width: 100px;" size="small" />
          <el-select v-model="field.type" style="width: 110px;" size="small" @change="onFieldTypeChange(field)">
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="下拉选择" value="select" />
          </el-select>
          <el-input v-model="field.default" :placeholder="field.type === 'number' ? '默认值(数字)' : '默认值'" style="width: 90px;" size="small" />
          <el-input v-model="field.placeholder" placeholder="提示文字" style="width: 100px;" size="small" />
          <el-checkbox v-model="field.required" label="必填" size="small" />
          <el-button type="danger" :icon="Delete" size="small" circle @click="removeField(index)" />
        </div>
        <!-- select 类型选项编辑 -->
        <div v-if="field.type === 'select'" class="options-editor">
          <span class="options-label">选项：</span>
          <div v-for="(opt, oi) in (field.options || [])" :key="oi" class="option-row">
            <el-input v-model="opt.label" placeholder="显示名" style="width: 100px;" size="small" />
            <el-input v-model="opt.value" placeholder="值" style="width: 100px;" size="small" />
            <el-button type="danger" :icon="Delete" size="small" circle @click="removeOption(field, oi)" />
          </div>
          <el-button size="small" @click="addOption(field)">+ 添加选项</el-button>
        </div>
      </div>
    </div>
    <el-button size="small" @click="addField">+ 添加配置字段</el-button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Delete } from '@element-plus/icons-vue'
import type { SkillConfigField } from '@/types/skill'

const props = defineProps<{
  modelValue: string
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

const fields = ref<SkillConfigField[]>([])

function parseFields(json: string): SkillConfigField[] {
  try {
    const arr = JSON.parse(json || '[]')
    return Array.isArray(arr) ? arr : []
  } catch {
    return []
  }
}

function syncToParent() {
  emit('update:modelValue', JSON.stringify(fields.value))
}

// 初始化
fields.value = parseFields(props.modelValue)

watch(() => props.modelValue, (val) => {
  const parsed = parseFields(val)
  if (JSON.stringify(parsed) !== JSON.stringify(fields.value)) {
    fields.value = parsed
  }
})

watch(fields, syncToParent, { deep: true })

function addField() {
  fields.value.push({
    key: '',
    label: '',
    type: 'string',
    required: false,
    placeholder: ''
  })
}

function removeField(index: number) {
  fields.value.splice(index, 1)
}

function onFieldTypeChange(field: SkillConfigField) {
  if (field.type === 'select' && !field.options) {
    field.options = []
  }
}

function addOption(field: SkillConfigField) {
  if (!field.options) field.options = []
  field.options.push({ label: '', value: '' })
}

function removeOption(field: SkillConfigField, index: number) {
  field.options?.splice(index, 1)
}
</script>

<style scoped>
.config-schema-editor {
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  padding: 12px;
}

.field-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 8px;
}

.field-item {
  background: var(--bg-primary);
  border-radius: 6px;
  padding: 8px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.options-editor {
  margin-top: 6px;
  padding-left: 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.options-label {
  font-size: 12px;
  color: var(--text-tertiary);
}

.option-row {
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>

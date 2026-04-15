<template>
  <div class="action-config-editor">
    <!-- builtin：待迁移提示 -->
    <div v-if="actionType === 'builtin'" class="builtin-hint">
      <el-text type="warning">此技能为内置类型，请迁移为 API 调用 / 大模型对话 / 联网搜索+大模型总结</el-text>
    </div>

    <!-- API 调用（支持 +AI 总结） -->
    <template v-if="actionType === 'api_call'">
      <div class="config-section">
        <div class="config-section-title">
          <span class="dot dot-api" />
          <span>API 请求配置</span>
        </div>
        <div class="config-row">
          <el-form-item label="请求方法" class="field-method">
            <el-radio-group v-model="form.method">
              <el-radio value="GET">GET</el-radio>
              <el-radio value="POST">POST</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="API 地址" class="flex-1">
            <el-input v-model="form.url" placeholder="https://api.example.com/data" />
          </el-form-item>
        </div>
        <el-form-item label="请求头（可选，JSON 格式）">
          <el-input v-model="form.headers" type="textarea" :rows="2" placeholder='如：{"Authorization": "Bearer xxx"}' />
        </el-form-item>
        <el-form-item label="响应模板">
          <el-input v-model="form.response_template" type="textarea" :rows="3" placeholder="用 {{key}} 引用返回数据字段，如：温度：{{main.temp}}°C" />
          <div class="form-tip">用 <code v-pre>{{key}}</code> 引用 JSON 返回中的字段，支持嵌套如 <code v-pre>{{rates.CNY}}</code></div>
        </el-form-item>
      </div>

      <div class="config-section">
        <div class="config-section-title">
          <span class="dot dot-ai" />
          <span>AI 总结（可选）</span>
          <el-switch v-model="form.enable_ai_summary" size="small" style="margin-left: auto;" />
        </div>
        <template v-if="form.enable_ai_summary">
          <el-form-item label="总结提示词">
            <el-input
              v-model="form.summary_prompt"
              type="textarea"
              :rows="3"
              placeholder="如：请根据以下 API 返回的数据，提取关键信息并用简洁的中文总结"
            />
          </el-form-item>
          <div class="form-tip">开启后，API 返回数据会经过 AI 总结再输出；不填提示词则使用默认总结逻辑</div>
        </template>
        <div v-else class="disabled-hint">未开启，API 返回数据将直接按模板或原始 JSON 展示</div>
      </div>
    </template>

    <!-- AI 提示词（大模型对话） -->
    <template v-if="actionType === 'ai_prompt'">
      <div class="config-section">
        <div class="config-section-title">
          <span class="dot dot-ai" />
          <span>大模型对话配置</span>
        </div>
        <el-form-item label="提示词模板">
          <el-input
            v-model="form.prompt_template"
            type="textarea"
            :rows="5"
            placeholder="如：请根据今天的日期，推荐一条适合今天的运动建议"
          />
        </el-form-item>
        <div class="form-tip">
          可用变量：<code v-pre>{{date}}</code>（当前日期）、<code v-pre>{{time}}</code>（当前时间）、<code v-pre>{{key}}</code>（用户配置项的 key）
        </div>
      </div>
    </template>

    <!-- 联网搜索+AI总结（大模型对话+联网搜索） -->
    <template v-if="actionType === 'search_and_summarize'">
      <div class="config-section">
        <div class="config-section-title">
          <span class="dot dot-search" />
          <span>联网搜索配置</span>
        </div>
        <el-form-item label="搜索问题">
          <el-input v-model="form.search_query" type="textarea" :rows="2" placeholder="如：今日热点新闻 {{date}}" />
        </el-form-item>
        <div class="form-tip">可用变量：<code v-pre>{{date}}</code>（当前日期）、<code v-pre>{{time}}</code>（当前时间）</div>
      </div>

      <div class="config-section">
        <div class="config-section-title">
          <span class="dot dot-ai" />
          <span>AI 总结配置</span>
        </div>
        <el-form-item label="总结提示词">
          <el-input
            v-model="form.summary_prompt"
            type="textarea"
            :rows="3"
            placeholder="如：请总结今日热点新闻，提炼3-5条要点，每条不超过20字"
          />
        </el-form-item>
        <div class="form-tip">不填则使用默认提示词对搜索结果进行总结</div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
  modelValue: string
  actionType: 'builtin' | 'api_call' | 'ai_prompt' | 'search_and_summarize'
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', val: string): void
}>()

interface ActionConfigForm {
  url: string
  method: string
  headers: string
  response_template: string
  enable_ai_summary: boolean
  summary_prompt: string
  prompt_template: string
  search_query: string
}

function parseConfig(json: string): ActionConfigForm {
  try {
    const obj = JSON.parse(json || '{}')
    return {
      url: obj.url || '',
      method: obj.method || 'GET',
      headers: typeof obj.headers === 'object' ? JSON.stringify(obj.headers, null, 2) : (obj.headers || ''),
      response_template: obj.response_template || '',
      enable_ai_summary: !!obj.enable_ai_summary,
      summary_prompt: obj.summary_prompt || '',
      prompt_template: obj.prompt_template || obj.prompt || '',
      search_query: obj.search_query || ''
    }
  } catch {
    return {
      url: '', method: 'GET', headers: '', response_template: '',
      enable_ai_summary: false, summary_prompt: '', prompt_template: '', search_query: ''
    }
  }
}

function buildConfig(): string {
  const config: Record<string, any> = {}
  if (props.actionType === 'api_call') {
    config.url = form.value.url
    config.method = form.value.method
    if (form.value.headers) {
      try { config.headers = JSON.parse(form.value.headers) } catch { /* ignore */ }
    }
    if (form.value.response_template) config.response_template = form.value.response_template
    config.enable_ai_summary = form.value.enable_ai_summary
    if (form.value.enable_ai_summary && form.value.summary_prompt) {
      config.summary_prompt = form.value.summary_prompt
    }
  } else if (props.actionType === 'ai_prompt') {
    config.prompt_template = form.value.prompt_template
  } else if (props.actionType === 'search_and_summarize') {
    config.search_query = form.value.search_query
    if (form.value.summary_prompt) config.summary_prompt = form.value.summary_prompt
  }
  return JSON.stringify(config)
}

const form = ref<ActionConfigForm>(parseConfig(props.modelValue))

watch(() => props.modelValue, (val) => {
  const parsed = parseConfig(val)
  form.value = parsed
})

watch(form, () => {
  emit('update:modelValue', buildConfig())
}, { deep: true })

watch(() => props.actionType, () => {
  form.value = {
    url: '', method: 'GET', headers: '', response_template: '',
    enable_ai_summary: false, summary_prompt: '', prompt_template: '', search_query: ''
  }
})
</script>

<style scoped>
.action-config-editor {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.builtin-hint {
  padding: 8px 0;
}

/* 配置分区 */
.config-section {
  border: 1px solid var(--border-color-light);
  border-radius: 8px;
  padding: 14px;
}

.config-section-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary);
}

.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-api { background: #67c23a; }
.dot-ai { background: #e6a23c; }
.dot-search { background: #409eff; }

/* API 配置行 */
.config-row {
  display: flex;
  gap: 12px;
}

.field-method {
  width: 160px;
  flex-shrink: 0;
}

.flex-1 {
  flex: 1;
}

.disabled-hint {
  font-size: 12px;
  color: var(--text-tertiary);
  padding: 4px 0;
}

.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
  line-height: 1.6;
}

.form-tip code {
  background: var(--bg-hover);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
  font-family: monospace;
}
</style>

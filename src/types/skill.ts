export interface StoreSkill {
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

export interface StoreManifest {
  version: number
  updated_at: string
  skills: StoreSkill[]
}

export interface SkillConfigField {
  key: string
  label: string
  type: 'string' | 'number' | 'select'
  default?: string | number
  options?: { label: string; value: string | number }[]
  required?: boolean
  placeholder?: string
}

export const SKILL_CATEGORIES = [
  { key: 'weather', label: '天气环境', icon: '🌤️' },
  { key: 'daily', label: '每日内容', icon: '📰' },
  { key: 'health', label: '健康生活', icon: '🍎' },
  { key: 'finance', label: '财经理财', icon: '💰' },
  { key: 'study', label: '学习成长', icon: '📚' },
  { key: 'tools', label: '实用工具', icon: '🔧' },
  { key: 'custom', label: '自定义', icon: '⚡' }
] as const

export const ACTION_TYPES = [
  { value: 'api_call', label: 'API 调用', description: '通过 HTTP 请求获取外部数据，可搭配 AI 总结' },
  { value: 'ai_prompt', label: '大模型对话', description: '通过 AI 大模型生成内容' },
  { value: 'search_and_summarize', label: '联网搜索+大模型总结', description: '先联网搜索获取信息，再用大模型总结' }
] as const

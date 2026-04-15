<template>
  <div class="manage-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">King Remind 技能商店管理</h1>
        <p class="page-subtitle">管理技能定义，修改后推送到 GitHub 仓库自动生效</p>
      </div>
      <div class="header-actions">
        <el-button v-if="builtinSkills.length > 0" type="warning" @click="migrationDialogVisible = true">
          <el-icon><Switch /></el-icon>
          迁移内置技能 ({{ builtinSkills.length }})
        </el-button>
        <el-button @click="settingsDialogVisible = true">
          <el-icon><Setting /></el-icon>
          GitHub 配置
        </el-button>
        <el-button @click="handleRefresh" :loading="store.loading">
          <el-icon><Refresh /></el-icon>
          拉取
        </el-button>
        <el-button type="success" @click="handlePush" :loading="store.pushing" :disabled="!store.configured">
          <el-icon><Upload /></el-icon>
          推送到 GitHub
        </el-button>
        <el-button type="primary" @click="openCreateDialog">
          <el-icon><Plus /></el-icon>
          新建技能
        </el-button>
      </div>
    </div>

    <!-- 连接状态栏 -->
    <div class="status-bar" :class="{ connected: store.configured, error: !!store.error }">
      <template v-if="!store.configured">
        <span class="status-dot dot-off" />
        <span class="status-text">未配置 GitHub Token</span>
        <el-button type="primary" size="small" link @click="settingsDialogVisible = true">去配置</el-button>
      </template>
      <template v-else-if="store.error">
        <span class="status-dot dot-error" />
        <span class="status-text">{{ store.error }}</span>
      </template>
      <template v-else>
        <span class="status-dot dot-ok" />
        <span class="status-text">已连接 {{ store.repo }}</span>
        <span v-if="store.lastSyncAt" class="status-time">同步于 {{ formatTime(store.lastSyncAt) }}</span>
      </template>
    </div>

    <!-- 未配置时的引导 -->
    <div v-if="!store.configured" class="setup-guide">
      <div class="guide-icon">🔑</div>
      <h2 class="guide-title">配置 GitHub 连接</h2>
      <p class="guide-desc">需要配置 GitHub Personal Access Token 才能读取和推送技能商店数据</p>
      <el-button type="primary" @click="settingsDialogVisible = true">
        <el-icon><Setting /></el-icon>
        配置 GitHub Token
      </el-button>
    </div>

    <template v-else>
      <!-- 统计栏 -->
      <div class="stats-bar">
        <div class="stat-item">
          <span class="stat-value">{{ store.skills.length }}</span>
          <span class="stat-label">技能总数</span>
        </div>
        <div class="stat-item" v-for="cat in categoryStats" :key="cat.key">
          <span class="stat-value">{{ cat.count }}</span>
          <span class="stat-label">{{ cat.icon }} {{ cat.label }}</span>
        </div>
      </div>

      <!-- 过滤栏 -->
      <div class="filter-bar">
        <div class="filter-chips">
          <span
            class="chip"
            :class="{ active: activeCategory === 'all' }"
            @click="activeCategory = 'all'"
          >全部 {{ filteredSkills.length }}</span>
          <span
            v-for="cat in SKILL_CATEGORIES"
            :key="cat.key"
            class="chip"
            :class="{ active: activeCategory === cat.key }"
            @click="activeCategory = cat.key"
          >{{ cat.icon }} {{ cat.label }}</span>
        </div>
        <el-input
          v-model="searchText"
          placeholder="搜索技能名称、描述、标签..."
          prefix-icon="Search"
          clearable
          style="width: 260px;"
        />
      </div>

      <!-- 加载态 -->
      <div v-if="store.loading" class="loading-state">
        <el-icon class="is-loading" :size="24"><Loading /></el-icon>
        <span>从 GitHub 拉取数据中...</span>
      </div>

      <!-- 错误态 -->
      <div v-else-if="store.error && store.skills.length === 0" class="error-state">
        <div class="error-icon">⚠️</div>
        <p class="error-title">加载失败</p>
        <p class="error-text">{{ store.error }}</p>
        <el-button type="primary" @click="handleRefresh">重试</el-button>
      </div>

      <!-- 空态 -->
      <div v-else-if="filteredSkills.length === 0" class="empty-state">
        <div class="empty-icon">🏪</div>
        <p class="empty-title">暂无技能</p>
        <p class="empty-text">点击「新建技能」添加第一个技能</p>
      </div>

      <!-- 技能网格 -->
      <div v-else class="skill-grid">
        <SkillCard
          v-for="skill in filteredSkills"
          :key="skill.skill_key"
          :skill="skill"
          @edit="openEditDialog"
          @delete="handleDelete"
          @duplicate="handleDuplicate"
        />
      </div>

      <!-- 未推送提示 -->
      <div v-if="hasLocalChanges" class="unsaved-bar">
        <span class="unsaved-dot" />
        <span>有未推送的修改</span>
        <el-button type="success" size="small" @click="handlePush" :loading="store.pushing">推送到 GitHub</el-button>
      </div>
    </template>

    <!-- 新建/编辑对话框 -->
    <SkillForm
      v-if="formDialogVisible"
      v-model:visible="formDialogVisible"
      :skill="editingSkill"
      @saved="handleFormSaved"
    />

    <!-- GitHub 配置对话框 -->
    <GitHubSettingsDialog
      v-if="settingsDialogVisible"
      v-model:visible="settingsDialogVisible"
    />

    <!-- 内置技能迁移对话框 -->
    <BuiltinMigrationDialog
      v-if="migrationDialogVisible"
      v-model:visible="migrationDialogVisible"
      :builtin-skills="builtinSkills"
      @migrated="handleMigrated"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useSkillStoreManage } from '@/stores/skill-store'
import { SKILL_CATEGORIES } from '@/types/skill'
import type { StoreSkill } from '@/types/skill'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Loading, Plus, Refresh, Setting, Switch, Upload } from '@element-plus/icons-vue'
import SkillCard from '@/components/SkillCard.vue'
import SkillForm from '@/components/SkillForm.vue'
import GitHubSettingsDialog from '@/components/GitHubSettingsDialog.vue'
import BuiltinMigrationDialog from '@/components/BuiltinMigrationDialog.vue'

const store = useSkillStoreManage()
const searchText = ref('')
const activeCategory = ref('all')
const formDialogVisible = ref(false)
const editingSkill = ref<StoreSkill | null>(null)
const settingsDialogVisible = ref(false)
const migrationDialogVisible = ref(false)
const hasLocalChanges = ref(false)

const builtinSkills = computed(() => store.skills.filter(s => s.action_type === 'builtin'))

const filteredSkills = computed(() => {
  let list = store.skills
  if (activeCategory.value !== 'all') {
    list = list.filter(s => s.category === activeCategory.value)
  }
  if (searchText.value) {
    const q = searchText.value.toLowerCase()
    list = list.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q) ||
      s.skill_key.toLowerCase().includes(q) ||
      s.tags.some(t => t.toLowerCase().includes(q))
    )
  }
  return list
})

const categoryStats = computed(() => {
  return SKILL_CATEGORIES.map(cat => ({
    ...cat,
    count: store.skills.filter(s => s.category === cat.key).length
  }))
})

function formatTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('zh-CN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
}

function openCreateDialog() {
  editingSkill.value = null
  formDialogVisible.value = true
}

function openEditDialog(skill: StoreSkill) {
  editingSkill.value = skill
  formDialogVisible.value = true
}

function handleFormSaved(skillData: StoreSkill) {
  if (editingSkill.value) {
    store.updateSkill(editingSkill.value.skill_key, skillData)
    ElMessage.success('技能已更新（本地），记得推送到 GitHub')
  } else {
    if (store.skills.some(s => s.skill_key === skillData.skill_key)) {
      ElMessage.error(`技能标识「${skillData.skill_key}」已存在，请使用其他标识`)
      return
    }
    store.addSkill(skillData)
    ElMessage.success('技能已创建（本地），记得推送到 GitHub')
  }
  hasLocalChanges.value = true
}

function handleDelete(skill: StoreSkill) {
  ElMessageBox.confirm(
    `确定要删除技能「${skill.name}」吗？删除后需推送到 GitHub 才会生效。`,
    '删除确认',
    { confirmButtonText: '删除', cancelButtonText: '取消', type: 'warning' }
  ).then(() => {
    store.deleteSkill(skill.skill_key)
    hasLocalChanges.value = true
    ElMessage.success('已删除（本地），记得推送到 GitHub')
  }).catch(() => {})
}

function handleDuplicate(skillKey: string) {
  store.duplicateSkill(skillKey)
  hasLocalChanges.value = true
  ElMessage.success('已复制（本地），记得推送到 GitHub')
}

async function handleRefresh() {
  await store.init()
  hasLocalChanges.value = false
}

function handleMigrated(updates: { skillKey: string; newType: string }[]) {
  for (const { skillKey, newType } of updates) {
    store.updateSkill(skillKey, {
      action_type: newType as any,
      action_config: '{}'
    })
  }
  hasLocalChanges.value = true
  migrationDialogVisible.value = false
  ElMessage.success(`已迁移 ${updates.length} 个技能，请编辑补充具体配置后推送到 GitHub`)
}

async function handlePush() {
  try {
    await store.pushToGitHub(`Update skill-store.json - ${new Date().toLocaleString('zh-CN')}`)
    hasLocalChanges.value = false
    ElMessage.success('已成功推送到 GitHub')
  } catch (e: any) {
    ElMessage.error(`推送失败: ${e.message}`)
  }
}

onMounted(() => {
  if (store.configured) {
    store.init()
  }
})
</script>

<style scoped>
.manage-page {
  max-width: 1100px;
  margin: 0 auto;
  padding: 24px;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: 4px;
}

.page-subtitle {
  font-size: 13px;
  color: var(--text-tertiary);
}

.header-actions {
  display: flex;
  gap: 8px;
}

/* 连接状态栏 */
.status-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  border-radius: 10px;
  margin-bottom: 16px;
  font-size: 13px;
}

.status-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.dot-ok { background: #67c23a; }
.dot-off { background: #909399; }
.dot-error { background: #f56c6c; }

.status-text {
  color: var(--text-secondary);
}

.status-time {
  color: var(--text-tertiary);
  font-size: 12px;
  margin-left: auto;
}

/* 未配置引导 */
.setup-guide {
  background: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: 16px;
  padding: 60px 40px;
  text-align: center;
  max-width: 480px;
  margin: 80px auto;
}

.guide-icon { font-size: 48px; margin-bottom: 16px; }
.guide-title { font-size: 18px; font-weight: 600; color: var(--text-primary); margin-bottom: 8px; }
.guide-desc { font-size: 13px; color: var(--text-tertiary); margin-bottom: 20px; line-height: 1.6; }

/* 统计栏 */
.stats-bar {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 14px 16px;
  background: var(--bg-card);
  border-radius: 10px;
  border: 1px solid var(--border-color-light);
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  min-width: 60px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: var(--color-primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-tertiary);
}

/* 过滤栏 */
.filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}

.filter-chips {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 10px;
  border-radius: 16px;
  font-size: 12px;
  cursor: pointer;
  background: var(--bg-card);
  border: 1px solid var(--border-color-light);
  color: var(--text-secondary);
  transition: all 0.15s;
  user-select: none;
}

.chip:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
}

.chip.active {
  background: var(--color-primary);
  border-color: var(--color-primary);
  color: #fff;
}

/* 技能网格 */
.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

/* 加载态 */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 60px;
  color: var(--text-tertiary);
}

/* 错误态 */
.error-state {
  background: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
}

.error-icon { font-size: 48px; margin-bottom: 16px; }
.error-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.error-text { font-size: 13px; color: var(--text-tertiary); margin-bottom: 16px; word-break: break-all; }

/* 空状态 */
.empty-state {
  background: var(--bg-card);
  border: 1px dashed var(--border-color);
  border-radius: 12px;
  padding: 60px 40px;
  text-align: center;
}

.empty-icon { font-size: 48px; margin-bottom: 16px; }
.empty-title { font-size: 16px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px; }
.empty-text { font-size: 13px; color: var(--text-tertiary); }

/* 未推送提示栏 */
.unsaved-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px;
  background: #fdf6ec;
  border-top: 1px solid #f5dab5;
  font-size: 13px;
  color: #b8860b;
  z-index: 100;
}

.unsaved-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #e6a23c;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.4; }
}
</style>

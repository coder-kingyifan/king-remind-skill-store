<template>
  <el-dialog
    :model-value="visible"
    title="GitHub 配置"
    width="480px"
    :close-on-click-modal="false"
    @update:model-value="$emit('update:visible', $event)"
  >
    <el-form label-position="top">
      <el-form-item label="GitHub Personal Access Token">
        <el-input
          v-model="formToken"
          type="password"
          show-password
          placeholder="ghp_xxxxxxxxxxxx"
        />
        <div class="form-tip">
          需要 <code>repo</code> 权限（完整控制私有仓库）或 <code>public_repo</code> 权限（仅公开仓库）。
          <a href="https://github.com/settings/tokens/new" target="_blank" rel="noopener">前往创建 Token</a>
        </div>
      </el-form-item>

      <el-form-item label="仓库 (owner/repo)">
        <el-input
          v-model="formRepo"
          placeholder="coder-kingyifan/king-remind-skill-store"
        />
        <div class="form-tip">技能商店 JSON 文件所在仓库</div>
      </el-form-item>

      <el-form-item label="文件路径">
        <el-input value="skill-store.json" disabled />
      </el-form-item>

      <el-form-item label="分支">
        <el-input value="main" disabled />
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:visible', false)">取消</el-button>
      <el-button type="primary" @click="handleSave">保存配置</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useSkillStoreManage } from '@/stores/skill-store'
import { ElMessage } from 'element-plus'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', val: boolean): void
}>()

const store = useSkillStoreManage()
const formToken = ref(store.token)
const formRepo = ref(store.repo)

function handleSave() {
  if (!formToken.value.trim()) {
    ElMessage.error('请输入 GitHub Token')
    return
  }
  if (!formRepo.value.trim()) {
    ElMessage.error('请输入仓库地址')
    return
  }
  store.saveToken(formToken.value.trim())
  store.saveRepo(formRepo.value.trim())
  ElMessage.success('配置已保存')
  emit('update:visible', false)
}
</script>

<style scoped>
.form-tip {
  font-size: 12px;
  color: var(--text-tertiary);
  margin-top: 4px;
  line-height: 1.6;
}

.form-tip a {
  color: var(--color-primary);
  text-decoration: none;
}

.form-tip code {
  background: var(--bg-hover);
  padding: 1px 4px;
  border-radius: 3px;
  font-size: 11px;
}
</style>

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { StoreSkill, StoreManifest } from '@/types/skill'

const TOKEN_KEY = 'king-remind-github-token'
const REPO_KEY = 'king-remind-github-repo'
const FILE_PATH = 'skill-store.json'
const BRANCH = 'main'

// 默认仓库
const DEFAULT_REPO = 'coder-kingyifan/king-remind-skill-store'

export const useSkillStoreManage = defineStore('skill-store-manage', () => {
  const skills = ref<StoreSkill[]>([])
  const loading = ref(false)
  const pushing = ref(false)
  const error = ref<string | null>(null)
  const lastSyncAt = ref<string | null>(null)

  // GitHub 配置
  const token = ref(localStorage.getItem(TOKEN_KEY) || '')
  const repo = ref(localStorage.getItem(REPO_KEY) || DEFAULT_REPO)

  const configured = computed(() => !!token.value)

  function saveToken(val: string) {
    token.value = val
    localStorage.setItem(TOKEN_KEY, val)
  }

  function saveRepo(val: string) {
    repo.value = val
    localStorage.setItem(REPO_KEY, val)
  }

  // GitHub API: 获取文件内容和 SHA
  async function fetchFileFromGitHub(): Promise<{ content: string; sha: string }> {
    const url = `https://api.github.com/repos/${repo.value}/contents/${FILE_PATH}?ref=${BRANCH}`
    const resp = await fetch(url, {
      headers: {
        'Authorization': `token ${token.value}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    })
    if (!resp.ok) {
      const body = await resp.text()
      throw new Error(`GitHub API 错误 (${resp.status}): ${body}`)
    }
    const data = await resp.json()
    // content 是 base64 编码，需要正确处理 UTF-8
    const binaryStr = atob(data.content.replace(/\n/g, ''))
    const bytes = new Uint8Array(binaryStr.length)
    for (let i = 0; i < binaryStr.length; i++) bytes[i] = binaryStr.charCodeAt(i)
    const content = new TextDecoder('utf-8').decode(bytes)
    return { content, sha: data.sha }
  }

  // UTF-8 字符串转 base64
  function utf8ToBase64(str: string): string {
    const bytes = new TextEncoder().encode(str)
    let binary = ''
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
    return btoa(binary)
  }

  // GitHub API: 推送文件
  async function pushFileToGitHub(content: string, sha: string, message: string): Promise<string> {
    const url = `https://api.github.com/repos/${repo.value}/contents/${FILE_PATH}`
    const body = {
      message,
      content: utf8ToBase64(content),
      sha,
      branch: BRANCH
    }
    const resp = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `token ${token.value}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    if (!resp.ok) {
      const errBody = await resp.text()
      throw new Error(`GitHub 推送失败 (${resp.status}): ${errBody}`)
    }
    const result = await resp.json()
    return result.content.sha
  }

  // 当前文件的 SHA（用于后续 push）
  let currentSha = ''

  // 从 GitHub 拉取数据
  async function init() {
    if (!token.value) {
      error.value = '请先配置 GitHub Token'
      return
    }
    loading.value = true
    error.value = null
    try {
      const { content, sha } = await fetchFileFromGitHub()
      currentSha = sha
      const manifest: StoreManifest = JSON.parse(content)
      skills.value = manifest.skills || []
      lastSyncAt.value = new Date().toISOString()
    } catch (e: any) {
      error.value = e.message
      skills.value = []
    } finally {
      loading.value = false
    }
  }

  // 生成 JSON 字符串
  function buildJSON(): string {
    const manifest: StoreManifest = {
      version: 1,
      updated_at: new Date().toISOString(),
      skills: JSON.parse(JSON.stringify(skills.value))
    }
    return JSON.stringify(manifest, null, 2)
  }

  // 推送到 GitHub
  async function pushToGitHub(message: string) {
    if (!token.value) throw new Error('未配置 GitHub Token')
    if (!currentSha) throw new Error('尚未从 GitHub 拉取数据，请先刷新')

    pushing.value = true
    try {
      const json = buildJSON()
      const newSha = await pushFileToGitHub(json, currentSha, message)
      currentSha = newSha
      lastSyncAt.value = new Date().toISOString()
    } finally {
      pushing.value = false
    }
  }

  // 本地操作（修改后需手动 push）
  function addSkill(skill: StoreSkill) {
    skills.value.push(skill)
  }

  function updateSkill(skillKey: string, data: Partial<StoreSkill>) {
    const idx = skills.value.findIndex(s => s.skill_key === skillKey)
    if (idx !== -1) {
      skills.value[idx] = { ...skills.value[idx], ...data }
    }
  }

  function deleteSkill(skillKey: string) {
    skills.value = skills.value.filter(s => s.skill_key !== skillKey)
  }

  function duplicateSkill(skillKey: string) {
    const original = skills.value.find(s => s.skill_key === skillKey)
    if (!original) return
    const newKey = `${skillKey}_copy_${Date.now()}`
    const copy: StoreSkill = {
      ...JSON.parse(JSON.stringify(original)),
      skill_key: newKey,
      name: `${original.name} (副本)`
    }
    skills.value.push(copy)
  }

  return {
    skills,
    loading,
    pushing,
    error,
    lastSyncAt,
    token,
    repo,
    configured,
    saveToken,
    saveRepo,
    init,
    pushToGitHub,
    addSkill,
    updateSkill,
    deleteSkill,
    duplicateSkill
  }
})

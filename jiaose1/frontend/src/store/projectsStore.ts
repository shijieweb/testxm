import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Project, CreateProjectInput } from '../types'
import { fetchProjects, createProjectAPI, deleteProjectAPI } from '../lib/projectApi'

interface ProjectsState {
  projects: Project[]
  loading: boolean
  error: string | null

  getProjects: () => Promise<Project[]>
  createProject: (input: CreateProjectInput) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useProjectsStore = create<ProjectsState>()(
  persist(
    (set, get) => ({
      projects: [],
      loading: false,
      error: null,

      getProjects: async () => {
        set({ loading: true, error: null })
        try {
          const projects = await fetchProjects()
          set({ projects, loading: false })
          return projects
        } catch (err) {
          const message = err instanceof Error ? err.message : '获取项目列表失败'
          set({ error: message, loading: false, projects: [] })
          return []
        }
      },

      createProject: async (input) => {
        set({ loading: true, error: null })
        try {
          const project = await createProjectAPI(input)
          set((state) => ({
            projects: [...state.projects, project],
            loading: false,
          }))
          return project
        } catch (err) {
          const message = err instanceof Error ? err.message : '创建项目失败'
          set({ error: message, loading: false })
          throw err
        }
      },

      deleteProject: async (id) => {
        try {
          await deleteProjectAPI(id)
          set((state) => ({
            projects: state.projects.filter((p) => p.id !== id),
          }))
        } catch (err) {
          const message = err instanceof Error ? err.message : '删除项目失败'
          set({ error: message })
          throw err
        }
      },

      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),
    }),
    {
      name: 'projects-storage',
      // 注意：persist 只持久化 projects 数组，不持久化 loading/error 状态
      partialize: (state) => ({ projects: state.projects }),
    }
  )
)

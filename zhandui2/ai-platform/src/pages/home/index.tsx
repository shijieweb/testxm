import { useState } from 'react'
import { motion } from 'framer-motion'
import { Plus, LayoutDashboard, Trash2, FolderOpen, Calendar } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useStore } from '../../store'
import type { Project } from '../../store'

export default function HomePage() {
  const { projects, deleteProject } = useStore()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleDelete = (id: string) => {
    deleteProject(id)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">项目列表</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {projects.length} 个项目 · 点击创建新项目开始协作
          </p>
        </div>
        <Link
          to="/create"
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          新建项目
        </Link>
      </div>

      {/* Empty State */}
      {projects.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <LayoutDashboard className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">还没有项目</h3>
          <p className="text-sm text-muted-foreground max-w-sm mb-6">
            创建一个新项目，AI 将帮你自动初始化架构、生成开发文档，开启高效协作。
          </p>
          <Link to="/create" className="btn-primary">
            <Plus className="w-4 h-4" />
            创建第一个项目
          </Link>
        </motion.div>
      ) : (
        /* Project Grid */
        <div className="grid gap-3">
          {projects.map((project, index) => (
            <ProjectCard
              key={project.id}
              project={project}
              index={index}
              confirmDelete={confirmDelete}
              onToggleConfirm={() =>
                setConfirmDelete(confirmDelete === project.id ? null : project.id)
              }
              onDelete={() => handleDelete(project.id)}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  index,
  confirmDelete,
  onToggleConfirm,
  onDelete,
}: {
  project: Project
  index: number
  confirmDelete: string | null
  onToggleConfirm: () => void
  onDelete: () => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="card group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
          <FolderOpen className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-foreground truncate">{project.name}</h3>
              <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                {project.description}
              </p>
            </div>
            {/* Delete button */}
            <div className="relative shrink-0">
              <button
                onClick={onToggleConfirm}
                className="btn-ghost p-2 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20"
                aria-label="删除项目"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {confirmDelete === project.id && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute right-0 top-full mt-2 z-20 w-44 bg-card border border-border rounded-lg shadow-lg p-3 text-xs space-y-2"
                >
                  <p className="text-foreground font-medium">确认删除此项目？</p>
                  <div className="flex gap-2">
                    <button
                      onClick={onDelete}
                      className="flex-1 btn-primary bg-red-500 hover:bg-red-600 border-0 text-xs py-1.5"
                    >
                      确认删除
                    </button>
                    <button
                      onClick={onToggleConfirm}
                      className="flex-1 btn-outline text-xs py-1.5"
                    >
                      取消
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Meta */}
          <div className="flex items-center gap-3 mt-3 flex-wrap">
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="w-3 h-3" />
              {new Date(project.createdAt).toLocaleDateString('zh-CN')}
            </span>
            {project.coreFunctions.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {project.coreFunctions.slice(0, 3).map((f, i) => (
                  <span key={i} className="badge badge-green text-xs">{f}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Open project link */}
      <Link
        to={`/project/${project.id}`}
        className="mt-3 text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
      >
        进入项目 →
      </Link>
    </motion.div>
  )
}

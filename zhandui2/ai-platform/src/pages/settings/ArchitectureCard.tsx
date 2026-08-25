import React, { useState } from 'react'
import { Layers, ChevronRight, ChevronDown, Folder, FileText } from 'lucide-react'
import { useStore } from '../../store'

interface TreeNode {
  name: string
  type: 'folder' | 'file'
  children?: TreeNode[]
}

function TreeItem({ node, depth }: { node: TreeNode; depth: number }) {
  const [expanded, setExpanded] = useState(depth < 1)
  const isFolder = node.type === 'folder'

  return (
    <div>
      <div
        className="flex items-center gap-1.5 py-1 px-2 rounded-md hover:bg-accent cursor-pointer transition-colors"
        style={{ paddingLeft: depth * 16 + 8 }}
        onClick={() => isFolder && setExpanded(!expanded)}
      >
        {isFolder ? (
          expanded ? (
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
          )
        ) : (
          <span className="w-3.5 h-3.5 shrink-0" />
        )}
        {isFolder ? (
          <Folder className="w-3.5 h-3.5 text-blue-500 shrink-0" />
        ) : (
          <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
        )}
        <span className="text-sm text-foreground font-mono">{node.name}</span>
      </div>
      {isFolder && expanded && node.children?.map((child) => (
        <TreeItem key={child.name} node={child} depth={depth + 1} />
      ))}
    </div>
  )
}

export function ArchitectureCard() {
  const { architecture } = useStore()

  return (
    <div className="card animate-fade-in">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Layers className="w-4 h-4 text-primary" />
        </div>
        <h2 className="card-title">默认架构技术栈</h2>
        <span className="badge badge-muted ml-auto">只读</span>
      </div>

      <div className="space-y-3 mb-6">
        {[
          { label: '前端', value: architecture.frontend, color: 'blue' },
          { label: '后端', value: architecture.backend, color: 'green' },
          { label: '数据库', value: architecture.database, color: 'yellow' },
          { label: '测试', value: architecture.testing, color: 'purple' },
          { label: '部署', value: architecture.deployment, color: 'gray' },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
            <span className="text-sm font-medium text-muted-foreground w-16 shrink-0 pt-0.5">{label}</span>
            <span className="text-sm text-foreground">{value}</span>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-medium text-foreground mb-3">目录结构</h3>
        <div className="bg-muted/50 rounded-lg p-3 max-h-72 overflow-y-auto scrollbar-hide">
          {architecture.directoryTree.map((node) => (
            <TreeItem key={node.name} node={node} depth={0} />
          ))}
        </div>
      </div>
    </div>
  )
}

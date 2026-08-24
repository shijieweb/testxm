import { useState } from 'react'
import { motion } from 'framer-motion'
import type { TreeNode } from '../../types'

interface TreeNodeProps {
  node: TreeNode
  depth?: number
  expandedIds: Set<string>
  onToggle: (id: string) => void
}

function TreeNodeItem({ node, depth = 0, expandedIds, onToggle }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0
  const isExpanded = expandedIds.has(node.id)

  const handleClick = () => {
    if (hasChildren) {
      onToggle(node.id)
    }
  }

  return (
    <div className="select-none">
      <div
        className={`flex items-center gap-1 py-1 px-2 rounded ${
          hasChildren ? 'cursor-pointer hover:bg-gray-100' : 'cursor-default'
        }`}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={handleClick}
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onKeyDown={(e) => {
          if (hasChildren && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleClick()
          }
        }}
      >
        {hasChildren ? (
          <span className="w-4 h-4 flex items-center justify-center text-gray-400 text-xs shrink-0">
            {isExpanded ? '▼' : '▶'}
          </span>
        ) : (
          <span className="w-4 shrink-0" />
        )}
        <span className="text-sm font-mono text-gray-700">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.15 }}
        >
          {node.children!.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
            />
          ))}
        </motion.div>
      )}
    </div>
  )
}

export function DirectoryTree({
  nodes,
  defaultExpanded = true,
}: {
  nodes: TreeNode[]
  defaultExpanded?: boolean
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() =>
    defaultExpanded ? new Set(nodes.map((n) => n.id)) : new Set<string>()
  )

  const handleToggle = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  return (
    <div className="font-mono text-sm bg-gray-50 rounded-lg p-3">
      {nodes.map((node) => (
        <TreeNodeItem
          key={node.id}
          node={node}
          expandedIds={expandedIds}
          onToggle={handleToggle}
        />
      ))}
    </div>
  )
}

export default DirectoryTree

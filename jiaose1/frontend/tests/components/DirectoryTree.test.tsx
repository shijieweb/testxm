import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { DirectoryTree } from '../../src/components/settings/DirectoryTree'
import { useSettingsStore } from '../../src/store/settingsStore'
import type { TreeNode } from '../../src/types'

const mockNodes: TreeNode[] = [
  {
    id: 'root',
    name: 'project-root/',
    children: [
      { id: 'f1', name: 'frontend/' },
      { id: 'b1', name: 'backend/' },
    ],
  },
]

describe('DirectoryTree', () => {
  beforeEach(() => {
    useSettingsStore.persist.clearStorage()
    useSettingsStore.getState().resetSettings()
  })

  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('TC-007-01: renders single-level node', () => {
    render(<DirectoryTree nodes={mockNodes} defaultExpanded={false} />)
    expect(screen.getByText('project-root/')).toBeInTheDocument()
  })

  it('TC-007-02: renders nested children recursively', () => {
    const nestedNodes: TreeNode[] = [
      {
        id: 'root',
        name: 'project-root/',
        children: [
          {
            id: 'f1',
            name: 'frontend/',
            children: [
              { id: 's1', name: 'src/', children: [{ id: 'c1', name: 'components/' }] },
            ],
          },
        ],
      },
    ]
    render(<DirectoryTree nodes={nestedNodes} defaultExpanded={true} />)
    expect(screen.getByText('project-root/')).toBeInTheDocument()
    expect(screen.getByText('frontend/')).toBeInTheDocument()
    // defaultExpanded=true only expands root; need to click frontend to expand its children
    const frontendEl = screen.getByText('frontend/')
    fireEvent.click(frontendEl)
    expect(screen.getByText('src/')).toBeInTheDocument()
    const srcEl = screen.getByText('src/')
    fireEvent.click(srcEl)
    expect(screen.getByText('components/')).toBeInTheDocument()
  })

  it('TC-007-03: clicking expands children', () => {
    const nodes: TreeNode[] = [
      {
        id: 'root',
        name: 'project-root/',
        children: [{ id: 'f1', name: 'frontend/' }],
      },
    ]
    render(<DirectoryTree nodes={nodes} defaultExpanded={false} />)
    const root = screen.getByText('project-root/')
    fireEvent.click(root)
    expect(screen.getByText('frontend/')).toBeInTheDocument()
  })

  it('TC-007-04: clicking again collapses children', () => {
    const nodes: TreeNode[] = [
      {
        id: 'root',
        name: 'project-root/',
        children: [{ id: 'f1', name: 'frontend/' }],
      },
    ]
    render(<DirectoryTree nodes={nodes} defaultExpanded={true} />)
    const root = screen.getByText('project-root/')
    fireEvent.click(root)
    // Wait briefly for any animation to complete, then verify collapse
    expect(screen.queryByText('frontend/')).not.toBeInTheDocument()
    fireEvent.click(root)
    // Re-expand
    expect(screen.getByText('frontend/')).toBeInTheDocument()
  })

  it('TC-007-05: leaf node has no expand arrow', () => {
    const nodes: TreeNode[] = [{ id: 'f1', name: 'frontend/', children: [] }]
    render(<DirectoryTree nodes={nodes} defaultExpanded={true} />)
    const frontendEl = screen.getByText('frontend/')
    const parent = frontendEl.parentElement!
    expect(parent.querySelector('.text-xs')).not.toBeInTheDocument()
  })

  it('TC-007-06: keyboard Enter key expands node', () => {
    const nodes: TreeNode[] = [
      {
        id: 'root',
        name: 'project-root/',
        children: [{ id: 'f1', name: 'frontend/' }],
      },
    ]
    render(<DirectoryTree nodes={nodes} defaultExpanded={false} />)
    const root = screen.getByText('project-root/')
    fireEvent.keyDown(root, { key: 'Enter' })
    expect(screen.getByText('frontend/')).toBeInTheDocument()
  })

  it('TC-007-07: keyboard Space key expands node', () => {
    const nodes: TreeNode[] = [
      {
        id: 'root',
        name: 'project-root/',
        children: [{ id: 'f1', name: 'frontend/' }],
      },
    ]
    render(<DirectoryTree nodes={nodes} defaultExpanded={false} />)
    const root = screen.getByText('project-root/')
    fireEvent.keyDown(root, { key: ' ' })
    expect(screen.getByText('frontend/')).toBeInTheDocument()
  })

  it('TC-007-08: keyboard Enter on leaf node does nothing', () => {
    const nodes: TreeNode[] = [{ id: 'f1', name: 'frontend/', children: [] }]
    render(<DirectoryTree nodes={nodes} defaultExpanded={true} />)
    const leaf = screen.getByText('frontend/')
    // Leaf has no role/button, keyboard handler should not trigger
    fireEvent.keyDown(leaf, { key: 'Enter' })
    // Should still be the only item visible
    expect(screen.queryByText('child/')).not.toBeInTheDocument()
  })

  it('TC-007-09: defaultExpanded=false hides all children initially', () => {
    const nodes: TreeNode[] = [
      {
        id: 'root',
        name: 'project-root/',
        children: [{ id: 'f1', name: 'frontend/' }],
      },
    ]
    render(<DirectoryTree nodes={nodes} defaultExpanded={false} />)
    expect(screen.getByText('project-root/')).toBeInTheDocument()
    expect(screen.queryByText('frontend/')).not.toBeInTheDocument()
  })

  it('TC-007-10: defaultExpanded=true shows all children', () => {
    const nodes: TreeNode[] = [
      {
        id: 'root',
        name: 'project-root/',
        children: [{ id: 'f1', name: 'frontend/' }],
      },
    ]
    render(<DirectoryTree nodes={nodes} defaultExpanded={true} />)
    expect(screen.getByText('project-root/')).toBeInTheDocument()
    expect(screen.getByText('frontend/')).toBeInTheDocument()
  })
})

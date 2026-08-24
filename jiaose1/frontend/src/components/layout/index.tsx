import { useMediaQuery } from '../../hooks/useMediaQuery'
import type { ReactNode } from 'react'

export function Header({ title, onMenuClick }: { title: string; onMenuClick?: () => void }) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  return (
    <header className="sticky top-0 z-10 bg-white border-b border-gray-200 h-14 flex items-center px-4">
      {!isDesktop && (
        <button
          type="button"
          className="mr-3 p-1 rounded hover:bg-gray-100"
          onClick={onMenuClick}
          aria-label="Open menu"
        >
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}
      <h1 className="text-base font-semibold text-gray-900">{title}</h1>
    </header>
  )
}

export function Sidebar({
  activeItem,
  onItemClick,
}: {
  activeItem: string
  onItemClick: (item: string) => void
}) {
  const items = [
    { id: 'settings', label: '设置' },
    { id: 'create-project', label: '创建项目' },
    { id: 'team', label: '专家协作' },
  ]

  return (
    <aside className="w-56 bg-white border-r border-gray-200 flex flex-col">
      <div className="h-14 flex items-center px-4 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-900">AI 需求平台</span>
      </div>
      <nav className="flex-1 p-2">
        {items.map((item) => (
          <button
            key={item.id}
            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
              activeItem === item.id
                ? 'bg-primary-50 text-primary-700 font-medium'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
            onClick={() => onItemClick(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  )
}

export function Layout({
  children,
  title,
  activeItem = 'settings',
  onNavigate,
}: {
  children: ReactNode
  title: string
  activeItem?: string
  onNavigate?: (item: string) => void
}) {
  const isDesktop = useMediaQuery('(min-width: 1024px)')

  if (isDesktop) {
    return (
      <div className="min-h-screen bg-gray-50 flex">
        {onNavigate && <Sidebar activeItem={activeItem} onItemClick={onNavigate} />}
        <div className="flex-1 flex flex-col">
          <Header title={title} />
          <main className="flex-1 p-4 max-w-[900px] w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header title={title} />
      <main className="flex-1 p-4 pb-20">
        {children}
      </main>
    </div>
  )
}

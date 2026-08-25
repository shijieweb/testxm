import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { Settings, Plus, ChevronLeft, LayoutDashboard, Moon, Sun } from 'lucide-react'
import { useStore } from '../store'

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDarkMode, toggleDarkMode } = useStore()

  const isActive = (path: string) => location.pathname === path

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-10 bg-card/80 backdrop-blur-md border-b border-border md:hidden">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-2">
            {location.pathname !== '/' && (
              <button onClick={() => navigate(-1)} className="btn-ghost p-1.5 -ml-1">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            <span className="font-semibold text-foreground">AI 研发协作平台</span>
          </div>
          <button
            onClick={toggleDarkMode}
            className="btn-ghost p-2 rounded-lg"
            aria-label="切换主题"
          >
            {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex fixed left-0 top-0 bottom-0 w-56 bg-card border-r border-border flex-col">
          <div className="px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold text-sm text-foreground">AI 研发协作</span>
            </div>
          </div>
          <nav className="flex-1 p-3 space-y-1">
            <Link
              to="/"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              项目列表
            </Link>
            <Link
              to="/settings"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/settings')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Settings className="w-4 h-4" />
              设置
            </Link>
            <Link
              to="/create"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive('/create')
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              }`}
            >
              <Plus className="w-4 h-4" />
              创建项目
            </Link>
          </nav>
          <div className="p-3 border-t border-border">
            <button
              onClick={toggleDarkMode}
              className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:bg-accent hover:text-foreground transition-all"
            >
              {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              {isDarkMode ? '浅色模式' : '深色模式'}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 md:ml-56">
          <div className="max-w-3xl mx-auto px-4 py-6 md:py-10 pb-24 md:pb-10">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card/80 backdrop-blur-md border-t border-border z-10">
        <div className="flex items-center justify-around h-16">
          <Link
            to="/"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              isActive('/') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-xs font-medium">项目</span>
          </Link>
          <Link
            to="/create"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              isActive('/create') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Plus className="w-5 h-5" />
            <span className="text-xs font-medium">创建</span>
          </Link>
          <Link
            to="/settings"
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-all ${
              isActive('/settings') ? 'text-primary' : 'text-muted-foreground'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="text-xs font-medium">设置</span>
          </Link>
        </div>
      </nav>
    </div>
  )
}

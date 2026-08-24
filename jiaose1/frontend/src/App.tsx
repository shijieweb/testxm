import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ErrorBoundary } from './components/shared/ErrorBoundary'
import { SettingsPage } from './pages/SettingsPage'
import { CreateProjectPage } from './pages/CreateProjectPage'
import { TeamPage } from './pages/TeamPage'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Navigate to="/settings" replace />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/projects/create" element={<CreateProjectPage />} />
            <Route path="/team" element={<TeamPage />} />
            <Route path="/projects" element={
              <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">故事列表页（后续功能）</p>
              </div>
            } />
          </Routes>
        </AnimatePresence>
      </BrowserRouter>
    </ErrorBoundary>
  )
}

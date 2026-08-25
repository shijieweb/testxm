import { BrowserRouter, Routes, Route } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import HomePage from './pages/home'
import SettingsPage from './pages/settings'
import CreateProjectPage from './pages/create'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainLayout />}>
          <Route index element={<HomePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="create" element={<CreateProjectPage />} />
          <Route path="project/:id" element={<div className="text-center py-20 text-muted-foreground">项目详情页（开发中）</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

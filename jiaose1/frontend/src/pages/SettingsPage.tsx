import { motion, AnimatePresence } from 'framer-motion'
import { useSettingsStore } from '../store/settingsStore'
import { Layout } from '../components/layout'
import { AiModelConfigCard } from '../components/settings/AiModelConfigCard'
import { ArchitectureDisplay } from '../components/settings/ArchitectureDisplay'
import { PromptTemplatesDisplay } from '../components/settings/PromptTemplatesDisplay'

export function SettingsPage() {
  useSettingsStore()

  return (
    <Layout title="设置" activeItem="settings">
      <AnimatePresence mode="wait">
        <motion.div
          key="settings"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.3 }}
          className="space-y-4"
        >
          <AiModelConfigCard />
          <ArchitectureDisplay />
          <PromptTemplatesDisplay />
        </motion.div>
      </AnimatePresence>
    </Layout>
  )
}

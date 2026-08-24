import { motion, AnimatePresence } from 'framer-motion'
import { Card } from '../ui'
import type { OptimizedResult } from '../../types'

interface AiOptimizeSectionProps {
  result: OptimizedResult | null
  loading: boolean
}

export function AiOptimizeSection({ result, loading }: AiOptimizeSectionProps) {
  if (!result && !loading) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2 }}
      >
        <Card title="AI 优化结果" subtitle="以下为 AI 自动生成的项目描述和标签">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin w-6 h-6 border-2 border-primary-500 border-t-transparent rounded-full" />
            </div>
          ) : result ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-1">项目简介</p>
                <p className="text-sm text-gray-600 bg-gray-50 rounded-lg p-3">{result.description}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">目标用户</p>
                <div className="flex flex-wrap gap-2">
                  {result.targetUsers.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-blue-50 text-blue-700 border border-blue-200">{tag}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">核心功能</p>
                <div className="flex flex-wrap gap-2">
                  {result.coreFunctions.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-green-50 text-green-700 border border-green-200">{tag}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">关键场景</p>
                <div className="flex flex-wrap gap-2">
                  {result.keyScenarios.map((tag, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-xs bg-yellow-50 text-yellow-700 border border-yellow-200">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </motion.div>
    </AnimatePresence>
  )
}

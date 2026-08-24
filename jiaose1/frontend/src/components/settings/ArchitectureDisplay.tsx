import { useSettingsStore } from '../../store/settingsStore'
import { Card } from '../ui'
import { DirectoryTree } from './DirectoryTree'

export function ArchitectureDisplay() {
  const { defaultArchitecture } = useSettingsStore()

  const layers = [
    { label: '前端', value: defaultArchitecture.frontend },
    { label: '后端', value: defaultArchitecture.backend },
    { label: '数据库', value: defaultArchitecture.database },
    { label: '测试', value: defaultArchitecture.testing },
    { label: '部署', value: defaultArchitecture.deployment },
  ]

  return (
    <Card title="默认架构技术栈" subtitle="创建项目时将使用以下默认架构">
      <div className="space-y-4">
        <table className="w-full text-sm">
          <tbody>
            {layers.map((layer) => (
              <tr key={layer.label} className="border-b border-gray-100 last:border-0">
                <td className="py-2 px-3 font-medium text-gray-600 w-24">{layer.label}</td>
                <td className="py-2 px-3 text-gray-900">{layer.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div>
          <p className="text-sm text-gray-500 mb-2">目录结构</p>
          <DirectoryTree nodes={defaultArchitecture.directoryTree} defaultExpanded={false} />
        </div>
      </div>
    </Card>
  )
}

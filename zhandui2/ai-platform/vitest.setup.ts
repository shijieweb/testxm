import '@testing-library/jest-dom/vitest'
import { vi } from 'vitest'

// Mock lucide-react icons to avoid SVG issues in tests
vi.mock('lucide-react', () => ({
  __esModule: true,
  default: (props: any) => require('react').createElement('svg', props),
  Bot: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'bot-icon' }),
  Key: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'key-icon' }),
  Server: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'server-icon' }),
  Loader2: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'loader-icon' }),
  CheckCircle2: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'check-circle-icon' }),
  XCircle: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'x-circle-icon' }),
  Layers: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'layers-icon' }),
  ChevronRight: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'chevron-right-icon' }),
  ChevronDown: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'chevron-down-icon' }),
  ChevronUp: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'chevron-up-icon' }),
  Folder: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'folder-icon' }),
  FileText: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'file-text-icon' }),
  Copy: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'copy-icon' }),
  Check: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'check-icon' }),
  Sparkles: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'sparkles-icon' }),
  Plus: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'plus-icon' }),
  Settings: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'settings-icon' }),
  LayoutDashboard: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'dashboard-icon' }),
  Trash2: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'trash-icon' }),
  FolderOpen: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'folder-open-icon' }),
  Calendar: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'calendar-icon' }),
  Moon: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'moon-icon' }),
  Sun: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'sun-icon' }),
  ChevronLeft: (props: any) => require('react').createElement('svg', { ...props, 'data-testid': 'chevron-left-icon' }),
}))

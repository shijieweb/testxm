import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, cleanup } from '@testing-library/react'
import { Card, Button, Input, Textarea, Badge, TagList } from '../../src/components/ui'

describe('Card', () => {
  beforeEach(() => cleanup)
  afterEach(() => cleanup())

  it('TC-022-01: renders title and subtitle', () => {
    render(
      <Card title="测试卡片" subtitle="副标题">
        <div>内容</div>
      </Card>
    )
    expect(screen.getByText('测试卡片')).toBeInTheDocument()
    expect(screen.getByText('副标题')).toBeInTheDocument()
    expect(screen.getByText('内容')).toBeInTheDocument()
  })

  it('TC-022-02: renders without title/subtitle', () => {
    render(
      <Card>
        <div>裸内容</div>
      </Card>
    )
    expect(screen.getByText('裸内容')).toBeInTheDocument()
  })

  it('TC-022-03: accepts custom className', () => {
    const { container } = render(
      <Card className="custom-class">内容</Card>
    )
    expect(container.firstChild).toHaveClass('custom-class')
  })
})

describe('Button', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  it('TC-022-04: default variant', () => {
    render(<Button>点击</Button>)
    const btn = screen.getByText('点击').closest('button')!
    expect(btn).toHaveClass('bg-primary-600')
  })

  it('TC-022-05: outline variant', () => {
    render(<Button variant="outline">次要按钮</Button>)
    const btn = screen.getByText('次要按钮').closest('button')!
    expect(btn).toHaveClass('border-gray-300')
  })

  it('TC-022-06: destructive variant', () => {
    render(<Button variant="destructive">删除</Button>)
    const btn = screen.getByText('删除').closest('button')!
    expect(btn).toHaveClass('bg-red-600')
  })

  it('TC-022-07: click calls onClick', () => {
    const handleClick = vi.fn()
    render(<Button onClick={handleClick}>提交</Button>)
    fireEvent.click(screen.getByText('提交'))
    expect(handleClick).toHaveBeenCalled()
  })

  it('TC-022-08: disabled state', () => {
    render(<Button disabled>禁用</Button>)
    const btn = screen.getByText('禁用').closest('button')!
    expect(btn).toBeDisabled()
  })
})

describe('Input', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  it('TC-022-09: renders and handles change', () => {
    const handleChange = vi.fn()
    render(<Input value="" onChange={handleChange} placeholder="请输入" />)
    const input = screen.getByPlaceholderText('请输入') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'hello' } })
    expect(handleChange).toHaveBeenCalledWith('hello')
  })

  it('TC-022-10: password type', () => {
    render(<Input type="password" value="" onChange={() => {}} />)
    const input = document.querySelector('input[type="password"]')
    expect(input).toBeInTheDocument()
  })
})

describe('Textarea', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  it('TC-022-11: renders and handles change', () => {
    const handleChange = vi.fn()
    render(<Textarea value="" onChange={handleChange} placeholder="多行输入" />)
    const textarea = screen.getByPlaceholderText('多行输入') as HTMLTextAreaElement
    fireEvent.change(textarea, { target: { value: 'line1\nline2' } })
    expect(handleChange).toHaveBeenCalledWith('line1\nline2')
  })
})

describe('Badge', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  it('TC-022-12: default variant', () => {
    render(<Badge>默认</Badge>)
    expect(screen.getByText('默认')).toBeInTheDocument()
  })

  it('TC-022-13: gray variant', () => {
    render(<Badge variant="gray">灰色</Badge>)
    const el = screen.getByText('灰色')
    expect(el).toHaveClass('bg-gray-100')
  })

  it('TC-022-14: blue variant', () => {
    render(<Badge variant="blue">蓝色</Badge>)
    expect(screen.getByText('蓝色')).toHaveClass('bg-blue-100')
  })

  it('TC-022-15: yellow variant', () => {
    render(<Badge variant="yellow">黄色</Badge>)
    expect(screen.getByText('黄色')).toHaveClass('bg-yellow-100')
  })

  it('TC-022-16: green variant', () => {
    render(<Badge variant="green">绿色</Badge>)
    expect(screen.getByText('绿色')).toHaveClass('bg-green-100')
  })

  it('TC-022-17: red variant', () => {
    render(<Badge variant="red">红色</Badge>)
    expect(screen.getByText('红色')).toHaveClass('bg-red-100')
  })
})

describe('TagList', () => {
  beforeEach(() => cleanup())
  afterEach(() => cleanup())

  it('TC-022-18: renders existing tags', () => {
    const handleChange = vi.fn()
    render(<TagList tags={['React', 'TypeScript']} onChange={handleChange} />)
    expect(screen.getByText('React')).toBeInTheDocument()
    expect(screen.getByText('TypeScript')).toBeInTheDocument()
  })

  it('TC-022-19: remove tag calls onChange', () => {
    const handleChange = vi.fn()
    render(
      <TagList
        tags={['Tag1', 'Tag2']}
        onChange={handleChange}
        key="tc-022-19"
      />
    )
    const removeButtons = document.querySelectorAll('[aria-label^="Remove"]')
    expect(removeButtons.length).toBe(2)
    fireEvent.click(removeButtons[0]!)
    expect(handleChange).toHaveBeenCalledWith(['Tag2'])
  })

  it('TC-022-20: add tag on Enter key', () => {
    const handleChange = vi.fn()
    render(
      <TagList tags={[]} onChange={handleChange} placeholder="添加标签" key="tc-022-20" />
    )
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    fireEvent.change(input!, { target: { value: 'NewTag' } })
    fireEvent.keyDown(input!, { key: 'Enter' })
    expect(handleChange).toHaveBeenCalledWith(['NewTag'])
  })

  it('TC-022-21: ignores duplicate tags', () => {
    const handleChange = vi.fn()
    render(
      <TagList tags={['Existing']} onChange={handleChange} key="tc-022-21" />
    )
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    fireEvent.change(input!, { target: { value: 'Existing' } })
    fireEvent.keyDown(input!, { key: 'Enter' })
    expect(handleChange).not.toHaveBeenCalled()
  })

  it('TC-022-22: trims whitespace from tags', () => {
    const handleChange = vi.fn()
    render(
      <TagList tags={[]} onChange={handleChange} key="tc-022-22" />
    )
    const input = document.querySelector('input[type="text"]') as HTMLInputElement
    fireEvent.change(input!, { target: { value: '  Trimmed  ' } })
    fireEvent.keyDown(input!, { key: 'Enter' })
    expect(handleChange).toHaveBeenCalledWith(['Trimmed'])
  })
})

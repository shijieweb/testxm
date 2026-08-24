import React from 'react'

export function Card({
  children,
  className = '',
  title,
  subtitle,
}: {
  children: React.ReactNode
  className?: string
  title?: string
  subtitle?: string
}) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-4 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="text-base font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  )
}

export function Button({
  children,
  onClick,
  variant = 'default',
  disabled = false,
  type = 'button',
  className = '',
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'outline' | 'destructive'
  disabled?: boolean
  type?: 'button' | 'submit'
  className?: string
}) {
  const base = 'inline-flex items-center justify-center rounded-lg font-medium transition-all active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:pointer-events-none px-4 py-2.5 text-sm'
  const variants = {
    default: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500',
    outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-gray-400',
    destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  }
  return (
    <button
      type={type}
      className={`${base} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  )
}

export function Input({
  value,
  onChange,
  placeholder,
  type = 'text',
  className = '',
  name,
  id,
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  type?: string
  className?: string
  name?: string
  id?: string
}) {
  return (
    <input
      id={id}
      type={type}
      name={name}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 ${className}`}
    />
  )
}

export function Textarea({
  value,
  onChange,
  placeholder,
  className = '',
  rows = 4,
  id,
}: {
  value: string
  onChange: (val: string) => void
  placeholder?: string
  className?: string
  rows?: number
  id?: string
}) {
  return (
    <textarea
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent placeholder:text-gray-400 resize-none ${className}`}
    />
  )
}

export function Badge({
  children,
  variant = 'default',
  className = '',
}: {
  children: React.ReactNode
  variant?: 'default' | 'gray' | 'blue' | 'yellow' | 'green' | 'red'
  className?: string
}) {
  const variants = {
    default: 'bg-primary-100 text-primary-700',
    gray: 'bg-gray-100 text-gray-700',
    blue: 'bg-blue-100 text-blue-700',
    yellow: 'bg-yellow-100 text-yellow-700',
    green: 'bg-green-100 text-green-700',
    red: 'bg-red-100 text-red-700',
  }
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  )
}

export function TagList({
  tags,
  onChange,
  placeholder,
}: {
  tags: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}) {
  const addTag = (tag: string) => {
    const trimmed = tag.trim()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
  }

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag, index) => (
        <span
          key={index}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm bg-primary-50 text-primary-700 border border-primary-200"
        >
          {tag}
          <button
            type="button"
            onClick={() => removeTag(index)}
            className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-primary-200 text-primary-500"
            aria-label={`Remove ${tag}`}
          >
            x
          </button>
        </span>
      ))}
      <input
        type="text"
        placeholder={placeholder || '输入标签后回车'}
        className="flex-1 min-w-[120px] text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-primary-500"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault()
            addTag((e.target as HTMLInputElement).value)
            ;(e.target as HTMLInputElement).value = ''
          }
        }}
      />
    </div>
  )
}

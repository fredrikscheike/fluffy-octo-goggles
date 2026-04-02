import { type ReactNode, useId } from 'react'

interface Props {
  title: string
  isExpanded: boolean
  onToggle: () => void
  badge?: ReactNode
  children: ReactNode
}

export function SectionAccordion({ title, isExpanded, onToggle, badge, children }: Props) {
  const contentId = useId()

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-800">{title}</span>
          {badge}
        </div>
        <svg
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          viewBox="0 0 20 20" fill="currentColor"
        >
          <path fillRule="evenodd" clipRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.085l3.71-3.856a.75.75 0 111.08 1.04l-4.25 4.42a.75.75 0 01-1.08 0L5.21 8.27a.75.75 0 01.02-1.06z" />
        </svg>
      </button>

      {/* CSS max-height transition — content stays in DOM for accessibility */}
      <div
        id={contentId}
        style={{
          maxHeight:  isExpanded ? '2000px' : '0',
          overflow:   'hidden',
          transition: 'max-height 0.25s ease',
        }}
      >
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  )
}

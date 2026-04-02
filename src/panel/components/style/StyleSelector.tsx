import type { WritingStylePreset } from '../../../shared/types/domain.types'
import { useStyleStore } from '../../store/style.store'
import { useWritingStyle } from '../../hooks/useWritingStyle'

const PRESETS: { value: WritingStylePreset; label: string; description: string }[] = [
  {
    value: 'match_my_style',
    label: 'Match my style',
    description: 'Learns from your sent emails',
  },
  {
    value: 'formal',
    label: 'Formal',
    description: 'Professional, structured tone',
  },
  {
    value: 'casual',
    label: 'Casual',
    description: 'Friendly, conversational tone',
  },
  {
    value: 'concise',
    label: 'Concise',
    description: 'Short and to the point',
  },
  {
    value: 'detailed',
    label: 'Detailed',
    description: 'Thorough with full context',
  },
]

export function StyleSelector() {
  const store  = useStyleStore()
  const { selectPreset } = useWritingStyle()

  return (
    <div className="space-y-1.5">
      {PRESETS.map((p) => (
        <button
          key={p.value}
          onClick={() => selectPreset(p.value)}
          className={[
            'w-full flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors',
            store.preset === p.value
              ? 'border-brand-400 bg-brand-50'
              : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50',
          ].join(' ')}
        >
          <div className={[
            'h-3.5 w-3.5 rounded-full border-2 shrink-0 transition-colors',
            store.preset === p.value
              ? 'border-brand-500 bg-brand-500'
              : 'border-gray-300',
          ].join(' ')} />
          <div className="flex-1 min-w-0">
            <p className={`text-sm font-medium ${store.preset === p.value ? 'text-brand-800' : 'text-gray-700'}`}>
              {p.label}
            </p>
            <p className="text-xs text-gray-400 truncate">{p.description}</p>
          </div>
        </button>
      ))}
    </div>
  )
}

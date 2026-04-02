import { useState, useRef, type KeyboardEvent } from 'react'
import type { Recipient } from '../../../shared/types/domain.types'
import { RecipientChip } from './RecipientChip'

interface Props {
  label: string
  recipients: Recipient[]
  onAdd: (email: string) => boolean
  onRemove: (email: string) => void
}

export function RecipientField({ label, recipients, onAdd, onRemove }: Props) {
  const [inputValue, setInputValue] = useState('')
  const [invalid, setInvalid] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  function commitInput(value: string) {
    const trimmed = value.trim().replace(/,+$/, '')
    if (!trimmed) return
    const ok = onAdd(trimmed)
    if (ok) {
      setInputValue('')
      setInvalid(false)
    } else {
      setInvalid(true)
    }
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      commitInput(inputValue)
    }
    if (e.key === 'Backspace' && inputValue === '' && recipients.length > 0) {
      onRemove(recipients[recipients.length - 1].email)
    }
  }

  return (
    <div className="mb-2">
      <label className="mb-1 block text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </label>
      <div
        onClick={() => inputRef.current?.focus()}
        className={[
          'flex flex-wrap gap-1 rounded-lg border px-2 py-1.5 min-h-[36px] cursor-text',
          invalid ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus-within:border-brand-400',
        ].join(' ')}
      >
        {recipients.map((r) => (
          <RecipientChip key={r.email} recipient={r} onRemove={onRemove} />
        ))}
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => { setInputValue(e.target.value); setInvalid(false) }}
          onKeyDown={handleKeyDown}
          onBlur={() => commitInput(inputValue)}
          placeholder={recipients.length === 0 ? 'Add email…' : ''}
          className="min-w-[120px] flex-1 bg-transparent text-xs outline-none placeholder-gray-400"
        />
      </div>
      {invalid && (
        <p className="mt-0.5 text-xs text-red-500">Enter a valid email address</p>
      )}
    </div>
  )
}

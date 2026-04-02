type Status = 'transcript' | 'crm' | 'inferred' | 'sent' | 'created' | 'error'

const styles: Record<Status, string> = {
  transcript: 'bg-blue-100 text-blue-700',
  crm:        'bg-purple-100 text-purple-700',
  inferred:   'bg-gray-100 text-gray-600',
  sent:       'bg-emerald-100 text-emerald-700',
  created:    'bg-emerald-100 text-emerald-700',
  error:      'bg-red-100 text-red-700',
}

const labels: Record<Status, string> = {
  transcript: 'from transcript',
  crm:        'from CRM',
  inferred:   'inferred',
  sent:       'sent',
  created:    'created',
  error:      'error',
}

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded px-1.5 py-0.5 text-xs font-medium ${styles[status]}`}>
      {labels[status]}
    </span>
  )
}

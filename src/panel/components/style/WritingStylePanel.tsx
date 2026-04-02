import { useState } from 'react'
import { useStyleStore } from '../../store/style.store'
import { useWritingStyle } from '../../hooks/useWritingStyle'
import { SectionAccordion } from '../layout/SectionAccordion'
import { StyleSelector } from './StyleSelector'
import { Button } from '../shared/Button'
import { ErrorBanner } from '../shared/ErrorBanner'

export function WritingStylePanel() {
  const store  = useStyleStore()
  const { buildStyleProfile } = useWritingStyle()
  const [expanded, setExpanded] = useState(false)

  const badge = (
    <span className={`text-xs font-medium ${
      store.preset === 'match_my_style' && store.learnedStyle
        ? 'text-emerald-600'
        : 'text-gray-400'
    }`}>
      {store.preset === 'match_my_style' && store.learnedStyle
        ? 'Profile ready'
        : store.preset.replace(/_/g, ' ')}
    </span>
  )

  return (
    <SectionAccordion
      title="Writing Style"
      isExpanded={expanded}
      onToggle={() => setExpanded((v) => !v)}
      badge={badge}
    >
      <div className="space-y-3">
        <StyleSelector />

        {store.preset === 'match_my_style' && (
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-3 space-y-2">
            {store.learnedStyle ? (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-700">Style Profile</p>
                  <span className="text-xs text-gray-400">
                    {store.learnedStyle.sampleSize} emails analysed
                  </span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">
                  {store.learnedStyle.summary}
                </p>
                {store.learnedStyle.greeting && (
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span className="font-medium">Greeting:</span>
                    <span className="italic">"{store.learnedStyle.greeting}"</span>
                  </div>
                )}
                {store.learnedStyle.signOff && (
                  <div className="flex gap-2 text-xs text-gray-500">
                    <span className="font-medium">Sign-off:</span>
                    <span className="italic">"{store.learnedStyle.signOff}"</span>
                  </div>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  loading={store.profileLoadStatus === 'loading'}
                  onClick={buildStyleProfile}
                >
                  Refresh profile
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-gray-600">
                  Analyses your last sent emails to match your writing patterns, greetings, and sign-offs.
                </p>
                <Button
                  variant="secondary"
                  size="sm"
                  loading={store.profileLoadStatus === 'loading'}
                  onClick={buildStyleProfile}
                >
                  {store.profileLoadStatus === 'loading' ? 'Analysing emails…' : 'Build style profile'}
                </Button>
              </>
            )}

            {store.profileError && (
              <ErrorBanner message={store.profileError} onRetry={buildStyleProfile} />
            )}
          </div>
        )}
      </div>
    </SectionAccordion>
  )
}

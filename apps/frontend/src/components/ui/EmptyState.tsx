'use client'

import Link from 'next/link'
import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  secondaryAction?: {
    label: string
    href: string
  }
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
}: EmptyStateProps) {
  return (
    <div className="rounded-2xl bg-white border border-slate-200 p-10 sm:p-16 text-center">
      <div className="mx-auto w-14 h-14 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center mb-5">
        <Icon size={24} className="text-slate-400" strokeWidth={1.5} />
      </div>
      <h3 className="font-display text-xl text-slate-900 tracking-tight mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-sm text-slate-500 leading-relaxed max-w-sm mx-auto mb-6">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
          {action && (
            <button
              type="button"
              onClick={action.onClick}
              className="inline-flex items-center justify-center px-5 py-2.5 rounded-full bg-slate-900 text-white text-sm font-semibold hover:bg-slate-800 transition-colors"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            // Use Next Link for internal paths so we don't full-reload
            // the app shell. External URLs (rare here) still work via
            // Link's anchor fallback.
            secondaryAction.href.startsWith('/') ? (
              <Link
                href={secondaryAction.href}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <a
                href={secondaryAction.href}
                className="inline-flex items-center justify-center px-5 py-2.5 rounded-full border border-slate-200 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                {secondaryAction.label}
              </a>
            )
          )}
        </div>
      )}
    </div>
  )
}

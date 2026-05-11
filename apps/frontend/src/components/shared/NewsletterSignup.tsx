'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ArrowRight, Check, Loader2 } from 'lucide-react'

export default function NewsletterSignup() {
  const { i18n } = useTranslation()
  const lang = i18n.language

  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (status === 'submitting' || !email) return

    setStatus('submitting')
    setErrorMsg('')
    try {
      const res = await fetch('/api/email/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'failed')
      }
      setStatus('done')
      setEmail('')
    } catch {
      setStatus('error')
      setErrorMsg(lang === 'th' ? 'ลองใหม่อีกครั้ง' : 'Please try again')
    }
  }

  if (status === 'done') {
    return (
      <p className="text-xs sm:text-sm text-white/70 flex items-center gap-2">
        <Check size={14} className="text-white" />
        {lang === 'th' ? 'ขอบคุณ! เราจะส่งข่าวสารให้คุณ' : 'Thanks! We\'ll be in touch.'}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md">
      <label className="sr-only" htmlFor="newsletter-email">
        {lang === 'th' ? 'อีเมลของคุณ' : 'Your email'}
      </label>
      <input
        id="newsletter-email"
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={lang === 'th' ? 'อีเมลของคุณ' : 'your@email.com'}
        className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 text-sm focus:outline-none focus:border-white/30 focus:bg-white/10 transition-colors"
      />
      <button
        type="submit"
        disabled={status === 'submitting'}
        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-950 text-sm font-semibold hover:bg-white/90 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {status === 'submitting' ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <>
            {lang === 'th' ? 'สมัคร' : 'Subscribe'}
            <ArrowRight size={14} />
          </>
        )}
      </button>
      {status === 'error' && (
        <p className="text-xs text-red-400 sm:absolute sm:translate-y-12">{errorMsg}</p>
      )}
    </form>
  )
}

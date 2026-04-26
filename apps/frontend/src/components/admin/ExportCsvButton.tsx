/**
 * ============================================================
 * ExportCsvButton — admin CSV download trigger
 * ============================================================
 *
 * Click → fetches the given endpoint as a Blob → triggers a
 * synthetic anchor click to save the file with the right
 * filename. Avoids window.location = url which would replace
 * the page with the CSV in some browsers.
 *
 * Cookies are forwarded so the admin auth cookie reaches the
 * backend through the next.config rewrite. Errors surface via
 * the toast system rather than breaking the admin's flow.
 * ============================================================
 */

'use client'

import { useState } from 'react'
import { Download, Loader2 } from 'lucide-react'
import { useToast } from '@/components/shared/Toast'

interface ExportCsvButtonProps {
  /** Endpoint path, e.g. '/api/admin/bookings/export' */
  endpoint: string
  /** Visible label (default "ส่งออก CSV"). */
  label?: string
  /** Optional query string to append (without the leading ?). */
  query?: string
}

export default function ExportCsvButton({
  endpoint,
  label = 'ส่งออก CSV',
  query,
}: ExportCsvButtonProps) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)

  const handleClick = async () => {
    setBusy(true)
    try {
      const url = query ? `${endpoint}?${query}` : endpoint
      const res = await fetch(url, { credentials: 'include' })
      if (!res.ok) {
        const txt = await res.text().catch(() => '')
        throw new Error(txt || `Export failed with status ${res.status}`)
      }

      const blob = await res.blob()

      // Pull filename out of Content-Disposition. Browsers are
      // surprisingly inconsistent here, so try filename* first
      // (RFC 5987 — handles UTF-8) then fall back to filename=.
      const cd = res.headers.get('Content-Disposition') || ''
      const match =
        /filename\*=UTF-8''([^;]+)/i.exec(cd) || /filename="([^"]+)"/i.exec(cd)
      const filename = match
        ? decodeURIComponent(match[1])
        : `export-${Date.now()}.csv`

      const blobUrl = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = blobUrl
      a.download = filename
      a.style.display = 'none'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(blobUrl)

      toast.success('ส่งออก CSV สำเร็จ')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'ส่งออกไม่สำเร็จ')
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 hover:border-indigo-300 hover:text-indigo-700 disabled:opacity-60"
    >
      {busy ? (
        <Loader2 size={14} className="animate-spin" />
      ) : (
        <Download size={14} />
      )}
      {label}
    </button>
  )
}

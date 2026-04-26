/**
 * ============================================================
 * Partner Layout - Layout สำหรับ Partner Dashboard
 * ============================================================
 *
 * วัตถุประสงค์:
 *   - กำหนด layout สำหรับ partner pages
 *   - Mount ToastProvider + ConfirmDialogProvider เพื่อแทน
 *     window.alert() / window.confirm() แบบมีสไตล์
 *
 * ============================================================
 */

import { ReactNode } from 'react'
import { ToastProvider } from '@/components/shared/Toast'
import { ConfirmDialogProvider } from '@/components/shared/ConfirmDialog'

export default function PartnerLayout({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <ConfirmDialogProvider>{children}</ConfirmDialogProvider>
    </ToastProvider>
  )
}

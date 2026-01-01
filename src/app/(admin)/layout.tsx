import I18nProvider from '@/i18n/client'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <I18nProvider>
      <div className="min-h-screen bg-slate-50">
        {children}
      </div>
    </I18nProvider>
  )
}

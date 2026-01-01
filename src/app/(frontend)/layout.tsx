import Navbar from '@/components/shared/Navbar'
import Footer from '@/components/shared/Footer'
import I18nProvider from '@/i18n/client'

export default function FrontendLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <I18nProvider>
      <div className="min-h-screen flex flex-col selection:bg-indigo-600 selection:text-white bg-[#fafbfc]">
        <Navbar />
        <main className="flex-1 flex flex-col">
          {children}
        </main>
        <Footer />
      </div>
    </I18nProvider>
  )
}

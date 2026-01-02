'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Compass } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

const NAVIGATION = [
  { key: 'home', path: '/' },
  { key: 'packages', path: '/hotels' },
  { key: 'cars', path: '/cars' },
  { key: 'contact', path: '/contact' },
]

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const { t } = useTranslation()

  const isAdmin = pathname?.startsWith('/admin')
  const isHome = pathname === '/'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10)
    handleScroll() // Check initial scroll position
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  if (isAdmin) return null

  const activeLightMode = scrolled || !isHome

  // Default Thai translations for SSR to prevent hydration mismatch
  const defaultLabels: Record<string, string> = {
    home: 'หน้าแรก',
    packages: 'แพ็คเกจ',
    cars: 'รถเช่า',
    contact: 'ติดต่อ',
    bookNow: 'จองเลย',
    bookPackage: 'จองแพ็คเกจ',
  }

  const getLabel = (key: string) => {
    if (!mounted) return defaultLabels[key] || key
    return t(`navbar.${key}`)
  }

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          activeLightMode
            ? 'bg-white/95 backdrop-blur-md shadow-sm py-3'
            : 'bg-transparent py-5 md:py-8'
        }`}
      >
        <div className="max-w-7xl mx-auto px-6 sm:px-8">
          <div className="flex justify-between items-center">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div
                className={`p-2 rounded-xl transition-all duration-300 ${
                  activeLightMode
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100'
                    : 'bg-white/10 text-white backdrop-blur-lg border border-white/20'
                }`}
              >
                <Compass size={20} strokeWidth={2.5} />
              </div>
              <span
                className={`text-xl font-extrabold tracking-tight transition-all duration-300 ${
                  activeLightMode ? 'text-slate-900' : 'text-white'
                }`}
              >
                Got Journey
                <span className={activeLightMode ? 'text-indigo-600' : 'text-indigo-400'}>
                  {' '}Thailand
                </span>
              </span>
            </Link>

            <div className="hidden lg:flex items-center gap-1 xl:gap-2">
              {NAVIGATION.map((item) => (
                <Link
                  key={item.key}
                  href={item.path}
                  className={`px-3 xl:px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap ${
                    pathname === item.path
                      ? activeLightMode
                        ? 'text-indigo-600 bg-indigo-50/80'
                        : 'text-white bg-white/20'
                      : activeLightMode
                      ? 'text-slate-500 hover:text-indigo-600 hover:bg-slate-50'
                      : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {getLabel(item.key)}
                </Link>
              ))}
              <div
                className={`w-px h-5 mx-1 xl:mx-2 ${
                  activeLightMode ? 'bg-slate-200' : 'bg-white/20'
                }`}
              ></div>
              <LanguageSwitcher light={activeLightMode} />
              <Link
                href="/hotels"
                className={`ml-1 px-4 xl:px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-all active:scale-95 whitespace-nowrap ${
                  activeLightMode ? 'bg-indigo-600 text-white' : 'bg-white text-slate-900'
                }`}
              >
                {getLabel('bookNow')}
              </Link>
            </div>

            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 rounded-xl transition-colors"
            >
              {isOpen ? (
                <X size={24} className={activeLightMode ? 'text-slate-900' : 'text-white'} />
              ) : (
                <Menu size={24} className={activeLightMode ? 'text-slate-900' : 'text-white'} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`lg:hidden fixed inset-0 bg-white z-40 transition-transform duration-500 ease-in-out ${
            isOpen ? 'translate-y-0' : '-translate-y-full'
          }`}
        >
          <div className="pt-24 px-8 flex flex-col gap-8">
            {NAVIGATION.map((item) => (
              <Link
                key={item.key}
                href={item.path}
                className="text-3xl font-black text-slate-900 hover:text-indigo-600 transition-colors"
              >
                {getLabel(item.key)}
              </Link>
            ))}
            <div className="mt-4 flex justify-center">
              <LanguageSwitcher light={true} />
            </div>
            <Link
              href="/hotels"
              className="mt-4 bg-indigo-600 text-white py-6 rounded-3xl font-black text-xl text-center shadow-xl active:scale-95 transition-all"
            >
              {getLabel('bookPackage')}
            </Link>
          </div>
        </div>
      </nav>
    </>
  )
}

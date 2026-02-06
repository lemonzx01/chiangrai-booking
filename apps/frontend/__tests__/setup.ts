import { vi } from 'vitest'
import '@testing-library/jest-dom/vitest'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
    prefetch: vi.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => '/',
}))

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, ...props }: { children: React.ReactNode; href: string }) => {
    return children
  },
}))

// Mock react-i18next
let mockLanguage = 'th'
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: mockLanguage,
      changeLanguage: (lang: string) => {
        mockLanguage = lang
      },
    },
  }),
}))

// Export helper to change mock language in tests
export function setMockLanguage(lang: string) {
  mockLanguage = lang
}

// Mock fetch
global.fetch = vi.fn()

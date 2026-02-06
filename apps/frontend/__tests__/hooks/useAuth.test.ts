import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useAuth } from '@/hooks/useAuth'

const mockPush = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
    back: vi.fn(),
  }),
}))

beforeEach(() => {
  vi.clearAllMocks()
  ;(global.fetch as any) = vi.fn()
})

describe('useAuth', () => {
  it('should start with loading true and user null', () => {
    ;(global.fetch as any).mockResolvedValueOnce({ ok: false })
    const { result } = renderHook(() => useAuth())
    expect(result.current.loading).toBe(true)
    expect(result.current.user).toBeNull()
  })

  it('should set user after successful checkAuth', async () => {
    const mockUser = { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toEqual(mockUser)
    expect(result.current.isAuthenticated).toBe(true)
  })

  it('should set user to null when checkAuth fails', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({ ok: false })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  it('should login and redirect to dashboard', async () => {
    // First call: checkAuth (on mount)
    ;(global.fetch as any).mockResolvedValueOnce({ ok: false })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    // Setup login response
    const mockUser = { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    })

    await act(async () => {
      await result.current.login('admin@test.com', 'password')
    })

    expect(result.current.user).toEqual(mockUser)
    expect(mockPush).toHaveBeenCalledWith('/admin/dashboard')
  })

  it('should throw on login failure', async () => {
    ;(global.fetch as any).mockResolvedValueOnce({ ok: false })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.loading).toBe(false)
    })

    ;(global.fetch as any).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Invalid credentials' }),
    })

    await expect(
      act(async () => {
        await result.current.login('bad@test.com', 'wrong')
      })
    ).rejects.toThrow('Invalid credentials')
  })

  it('should logout and redirect to login page', async () => {
    const mockUser = { id: '1', email: 'admin@test.com', name: 'Admin', role: 'admin' }
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: mockUser }),
    })

    const { result } = renderHook(() => useAuth())

    await waitFor(() => {
      expect(result.current.user).toEqual(mockUser)
    })

    ;(global.fetch as any).mockResolvedValueOnce({ ok: true })

    await act(async () => {
      await result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(mockPush).toHaveBeenCalledWith('/admin/login')
  })
})

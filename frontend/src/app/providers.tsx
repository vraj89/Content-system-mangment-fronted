import { useEffect } from 'react'
import { ToastContainer } from '@/components/feedback/Toast'
import { useAuthStore } from '@/stores/auth.store'

export function AppProviders({ children }: { children: React.ReactNode }) {
  const logout = useAuthStore((s) => s.logout)

  useEffect(() => {
    const handler = () => {
      void logout()
      window.location.assign('/login')
    }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [logout])

  return (
    <>
      {children}
      <ToastContainer />
    </>
  )
}

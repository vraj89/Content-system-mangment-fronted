import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Menu, X, LogOut, ChevronDown, Settings } from 'lucide-react'
import { useAuthStore } from '@/stores/auth.store'
import { useUIStore } from '@/stores/ui.store'
import { getNavigation, type NavItem, type NavSection } from '@/lib/navigation'

function isNavActive(
  item: NavItem,
  location: { pathname: string; search: string },
  nav: NavSection[],
): boolean {
  const full = location.pathname + location.search
  if (item.path.includes('?')) {
    return full === item.path
  }
  if (location.pathname === item.path) {
    const claimedBySibling = nav.some(
      (s) => s.items.some((it) => it !== item && it.path === full),
    )
    return !claimedBySibling
  }
  if (location.pathname.startsWith(item.path + '/')) {
    const childIsSibling = nav.some((s) => s.items.some((it) => it.path === location.pathname))
    return !childIsSibling
  }
  return false
}
import { ROLE_LABELS } from '@/lib/permissions'
import { Avatar } from '@/components/ui/Avatar'
import { cn } from '@/utils/cn'
import { NotificationBell } from '@/features/notifications/components/NotificationBell'
import { images } from '@/assets/images'

export function DashboardLayout() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const addToast = useUIStore((s) => s.addToast)
  const nav = getNavigation(user)

  const handleLogout = async () => {
    await logout()
    addToast({ type: 'info', title: 'Logged out' })
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-border bg-card lg:flex">
        <div className="flex h-16 items-center gap-2.5 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary">
            <img src={images.dashboardClient} alt="" className="h-full w-full object-cover" />
          </div>
          <div>
            <p className="text-sm font-bold leading-none tracking-tight">CSM</p>
            <p className="text-xs text-muted-foreground">Content Operations</p>
          </div>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
          {nav.map((section, i) => (
            <div key={i} className="space-y-1">
              {section.title && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {section.title}
                </p>
              )}
              {section.items.map((item, idx) => {
                const active = isNavActive(item, location, nav)
                return (
                  <button
                    key={`${i}-${idx}-${item.path}`}
                    onClick={() => navigate(item.path)}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
                    )}
                  >
                    <item.icon className="h-4.5 w-4.5" style={{ width: 18, height: 18 }} />
                    {item.label}
                  </button>
                )
              })}
            </div>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <button
            onClick={() => navigate('/profile')}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <Settings className="h-4 w-4" /> Profile & Settings
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-card/80 px-4 backdrop-blur-xl sm:px-6">
          <div className="flex items-center gap-3">
            <button
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary lg:hidden"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="lg:hidden">
              <p className="text-sm font-bold tracking-tight">CSM</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <NotificationBell />
            <div className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition-colors hover:bg-secondary"
              >
                <Avatar name={user?.name} size="sm" />
                <div className="hidden text-left sm:block">
                  <p className="text-sm font-medium leading-none">{user?.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{ROLE_LABELS[user?.role ?? 'CLIENT']}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </button>
              {menuOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border border-border bg-card shadow-xl"
                  >
                    <button
                      onClick={() => {
                        setMenuOpen(false)
                        navigate('/profile')
                      }}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-secondary"
                    >
                      <Settings className="h-4 w-4" /> Profile
                    </button>
                    <button
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-destructive hover:bg-rose-50"
                    >
                      <LogOut className="h-4 w-4" /> Log out
                    </button>
                  </motion.div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <motion.div
          className="fixed inset-0 z-50 lg:hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.25 }}
            className="absolute inset-y-0 left-0 flex w-72 flex-col bg-card shadow-2xl"
          >
            <div className="flex h-16 items-center justify-between border-b border-border px-5">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-xl bg-primary">
                  <img src={images.dashboardClient} alt="" className="h-full w-full object-cover" />
                </div>
                <p className="text-sm font-bold tracking-tight">CSM</p>
              </div>
              <button onClick={() => setMobileOpen(false)} className="rounded-lg p-1.5 text-muted-foreground hover:bg-secondary">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-5">
              {nav.map((section, i) => (
                <div key={i} className="space-y-1">
                  {section.title && (
                    <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                      {section.title}
                    </p>
                  )}
                  {section.items.map((item, idx) => {
                    const active = isNavActive(item, location, nav)
                    return (
                      <button
                        key={`${i}-${idx}-${item.path}`}
                        onClick={() => {
                          navigate(item.path)
                          setMobileOpen(false)
                        }}
                        aria-current={active ? 'page' : undefined}
                        className={cn(
                          'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                          active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-secondary',
                        )}
                      >
                        <item.icon style={{ width: 18, height: 18 }} />
                        {item.label}
                      </button>
                    )
                  })}
                </div>
              ))}
            </nav>
          </motion.aside>
        </motion.div>
      )}
    </div>
  )
}

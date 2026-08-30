import { Outlet } from 'react-router-dom'
import { motion } from 'framer-motion'
import { images } from '@/assets/images'

export function AuthLayout() {
  return (
    <div className="flex min-h-screen">
      <div className="relative hidden w-1/2 overflow-hidden bg-primary lg:block">
        <img
          src={images.dashboardAndClient}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/85 via-slate-900/55 to-primary/70" />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="relative z-10 flex h-full flex-col justify-between p-12 text-white"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <span className="text-lg font-bold">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight">CSM Platform</span>
          </div>
          <div>
            <h1 className="max-w-md text-4xl font-bold leading-tight tracking-tight">
              Orchestrate content operations across every team.
            </h1>
            <p className="mt-4 max-w-md text-base text-white/80">
              A unified workspace for marketing, content, media, task management and clients —
              with approvals, revisions, payments and publishing under one roof.
            </p>
          </div>
          <p className="text-sm text-white/60">© {new Date().getFullYear()} CSM. Enterprise Content Operations.</p>
        </motion.div>
      </div>

      <div className="flex w-full items-center justify-center bg-background px-4 py-10 lg:w-1/2">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-white">
                <span className="text-lg font-bold">C</span>
              </div>
              <span className="text-lg font-bold tracking-tight text-foreground">CSM Platform</span>
            </div>
          </div>
          <Outlet />
        </motion.div>
      </div>
    </div>
  )
}

import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})

export const queryKeys = {
  me: ['me'] as const,
  dashboard: (role?: string) => ['dashboard', role] as const,
  dashboardActivity: (projectId?: string) => ['dashboard', 'activity', projectId] as const,
  clients: (params?: unknown) => ['clients', params] as const,
  client: (id: string) => ['clients', id] as const,
  projects: (params?: unknown) => ['projects', params] as const,
  project: (id: string) => ['projects', id] as const,
  products: (params?: unknown) => ['products', params] as const,
  product: (id: string) => ['products', id] as const,
  tasks: (params?: unknown) => ['tasks', params] as const,
  task: (id: string) => ['tasks', id] as const,
  content: (params?: unknown) => ['content', params] as const,
  contentItem: (id: string) => ['content', id] as const,
  contentVersions: (id: string) => ['content', id, 'versions'] as const,
  media: (params?: unknown) => ['media', params] as const,
  mediaItem: (id: string) => ['media', id] as const,
  approvals: (params?: unknown) => ['approvals', params] as const,
  approval: (id: string) => ['approvals', id] as const,
  revisions: (params?: unknown) => ['revisions', params] as const,
  revision: (id: string) => ['revisions', id] as const,
  payments: (params?: unknown) => ['payments', params] as const,
  payment: (id: string) => ['payments', id] as const,
  notifications: (params?: unknown) => ['notifications', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  comments: (params?: unknown) => ['comments', params] as const,
  users: (params?: unknown) => ['users', params] as const,
  user: (id: string) => ['users', id] as const,
  auditLogs: (params?: unknown) => ['audit-logs', params] as const,
}

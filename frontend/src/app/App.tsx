import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthLayout } from '@/layouts/AuthLayout'
import { DashboardLayout } from '@/layouts/DashboardLayout'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { PermissionRoute } from '@/routes/PermissionRoute'
import { RoleRoute } from '@/routes/RoleRoute'

import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from '@/features/auth'
import { DashboardPage } from '@/features/dashboard/pages/DashboardPage'
import { ClientsListPage, ClientDetailPage, ClientOnboardingPage } from '@/features/clients'
import { ProjectsListPage, ProjectDetailPage } from '@/features/projects'
import { ProductsPage } from '@/features/products'
import { TasksPage } from '@/features/tasks'
import { ContentListPage, ContentEditorPage } from '@/features/content'
import { MediaListPage, MediaDetailPage } from '@/features/media'
import { CreateTaskPage } from '@/features/tasks/pages/CreateTaskPage'
import { KanbanPage } from '@/features/tasks/pages/KanbanPage'
import { TeamWorkloadPage } from '@/features/tasks/pages/TeamWorkloadPage'
import { OverdueTasksPage, CalendarPage } from '@/features/tasks/pages/TaskViewsPage'
import { LeadsPage } from '@/features/marketing/pages/LeadsPage'
import { PipelinePage } from '@/features/marketing/pages/PipelinePage'
import { ReadyToPublishPage } from '@/features/admin/pages/ReadyToPublishPage'
import { EscalationsPage } from '@/features/admin/pages/EscalationsPage'
import { ReportsPage } from '@/features/admin/pages/ReportsPage'
import { ApprovalsPage } from '@/features/approvals'
import { RevisionsPage } from '@/features/revisions'
import { PaymentsPage, PaymentDetailPage } from '@/features/payments'
import { UsersPage } from '@/features/users'
import { AuditLogsPage } from '@/features/auditLogs'
import { NotificationsPage } from '@/features/notifications'
import { ProfilePage } from '@/features/auth/pages/ProfilePage'

export function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/clients" element={<ClientsListPage />} />
        <Route path="/clients/new" element={<ClientOnboardingPage />} />
        <Route path="/clients/:id" element={<ClientDetailPage />} />
        <Route path="/projects" element={<ProjectsListPage />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        <Route path="/products" element={<ProductsPage />} />
        <Route path="/tasks" element={<TasksPage />} />
        <Route path="/content" element={<ContentListPage />} />
        <Route path="/content/:id" element={<ContentEditorPage />} />
        <Route path="/media" element={<MediaListPage />} />
        <Route path="/media/:id" element={<MediaDetailPage />} />
        <Route path="/tasks/new" element={<CreateTaskPage />} />
        <Route path="/kanban" element={<KanbanPage />} />
        <Route path="/team-workload" element={<TeamWorkloadPage />} />
        <Route path="/overdue-tasks" element={<OverdueTasksPage />} />
        <Route path="/calendar" element={<CalendarPage />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/pipeline" element={<PipelinePage />} />
        <Route path="/ready-to-publish" element={<ReadyToPublishPage />} />
        <Route path="/escalations" element={<EscalationsPage />} />
        <Route path="/reports/:type" element={<ReportsPage />} />
        <Route path="/overdue" element={<OverdueTasksPage />} />
        <Route
          path="/approvals"
          element={
            <RoleRoute roles={['ADMIN', 'CONTENT_TEAM', 'MEDIA_TEAM', 'CLIENT']}>
              <ApprovalsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/revisions"
          element={
            <RoleRoute roles={['ADMIN', 'CONTENT_TEAM', 'MEDIA_TEAM', 'CLIENT', 'TASK_MANAGEMENT']}>
              <RevisionsPage />
            </RoleRoute>
          }
        />
        <Route
          path="/payments"
          element={
            <PermissionRoute permission="PAYMENT_VIEW">
              <PaymentsPage />
            </PermissionRoute>
          }
        />
        <Route path="/payments/:id" element={<PermissionRoute permission="PAYMENT_UPDATE"><PaymentDetailPage /></PermissionRoute>} />
        <Route
          path="/users"
          element={
            <PermissionRoute permission="USER_VIEW">
              <UsersPage />
            </PermissionRoute>
          }
        />
        <Route
          path="/audit-logs"
          element={
            <PermissionRoute permission="AUDIT_VIEW">
              <AuditLogsPage />
            </PermissionRoute>
          }
        />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

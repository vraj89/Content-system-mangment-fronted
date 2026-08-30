import { useParams } from 'react-router-dom'
import { BarChart3 } from 'lucide-react'
import { PageHeader } from '@/components/common/PageHeader'
import { Card } from '@/components/ui/Card'
import { images } from '@/assets/images'

const TITLES: Record<string, string> = {
  projects: 'Project Reports',
  team: 'Team Performance',
  clients: 'Client Reports',
  financial: 'Financial Reports',
}

export function ReportsPage() {
  const { type } = useParams()
  const title = TITLES[type ?? ''] ?? 'Reports'
  return (
    <div className="space-y-6">
      <PageHeader title={title} description="Reporting workspace for the selected area." image={images.dashboardClient} />
      <Card className="p-6 text-sm text-muted-foreground">
        <BarChart3 className="mb-3 h-6 w-6 text-primary" />
        This report area aggregates data from Projects, Tasks, Content, Media and Approvals. Detailed charts and exports can be built on top of the existing dashboard APIs ({'{ role }'}-scoped counts are already available server-side).
      </Card>
    </div>
  )
}

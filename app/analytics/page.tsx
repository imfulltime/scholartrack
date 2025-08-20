import StaticAnalyticsDashboard from '@/components/analytics/StaticAnalyticsDashboard'
import PageWrapper from '@/components/layout/PageWrapper'
import { FileText, Download } from 'lucide-react'

export default function AnalyticsPage() {
  return (
    <PageWrapper
      title="Analytics Dashboard"
      subtitle="Comprehensive insights into student performance and class analytics"
      actions={[
        {
          label: 'View Reports',
          href: '/reports',
          variant: 'secondary',
          icon: <FileText className="h-4 w-4" />
        },
        {
          label: 'Export Data',
          href: '/reports',
          variant: 'primary',
          icon: <Download className="h-4 w-4" />
        }
      ]}
    >
      <StaticAnalyticsDashboard />
    </PageWrapper>
  )
}

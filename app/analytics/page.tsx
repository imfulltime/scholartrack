import { Suspense } from 'react'
import AdvancedAnalyticsDashboard from '@/components/analytics/AdvancedAnalyticsDashboard'
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
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <AdvancedAnalyticsDashboard />
      </Suspense>
    </PageWrapper>
  )
}

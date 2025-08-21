import { GradingPeriodsManager } from '@/components/grading/GradingPeriodsManager'
import PageWrapper from '@/components/layout/PageWrapper'
import { BarChart3, BookOpen, Calculator } from 'lucide-react'

export default function GradingSettingsPage() {
  return (
    <PageWrapper
      title="Grading System Settings"
      subtitle="Philippine K-12 grading system with 4 grading periods per school year"
      actions={[
        {
          label: 'View Classes',
          href: '/classes',
          variant: 'secondary',
          icon: <BookOpen className="h-4 w-4" />
        },
        {
          label: 'View Reports',
          href: '/reports',
          variant: 'secondary',
          icon: <BarChart3 className="h-4 w-4" />
        },
        {
          label: 'Analytics',
          href: '/analytics',
          variant: 'secondary',
          icon: <Calculator className="h-4 w-4" />
        }
      ]}
    >
      <GradingPeriodsManager />
    </PageWrapper>
  )
}

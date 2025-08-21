import { AssessmentTypesManager } from '@/components/assessments/AssessmentTypesManager'
import PageWrapper from '@/components/layout/PageWrapper'
import { BarChart3, BookOpen, Calculator } from 'lucide-react'

export default function GradingSettingsPage() {
  return (
    <PageWrapper
      title="Grading Settings"
      subtitle="Configure assessment types and grade calculation methods"
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
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-indigo-50 to-blue-100 rounded-lg p-6 border border-indigo-200">
          <div className="flex items-center mb-4">
            <Calculator className="h-6 w-6 text-indigo-600 mr-3" />
            <h3 className="text-lg font-semibold text-indigo-900">Grade Calculation System</h3>
          </div>
          <div className="text-sm text-indigo-700 space-y-2">
            <p>
              <strong>Weighted Grading:</strong> Final grades are calculated based on the percentage weights you assign to each assessment type.
            </p>
            <p>
              <strong>Total Must Equal 100%:</strong> All active assessment types must add up to exactly 100% for accurate grade calculations.
            </p>
            <p>
              <strong>Flexible Categories:</strong> Create custom assessment types like "Participation", "Projects", "Midterms", etc.
            </p>
          </div>
        </div>

        <AssessmentTypesManager />
      </div>
    </PageWrapper>
  )
}

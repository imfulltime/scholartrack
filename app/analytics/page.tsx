import { Suspense } from 'react'
import AdvancedAnalyticsDashboard from '@/components/analytics/AdvancedAnalyticsDashboard'

export default function AnalyticsPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Comprehensive insights into student performance and class analytics
        </p>
      </div>

      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }>
        <AdvancedAnalyticsDashboard />
      </Suspense>
    </div>
  )
}

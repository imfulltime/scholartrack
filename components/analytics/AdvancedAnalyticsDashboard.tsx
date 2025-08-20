'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'
import { toast } from 'react-hot-toast'

interface AnalyticsData {
  overview: {
    totalStudents: number
    totalAssessments: number
    averageGrade: number
    completionRate: number
  }
  gradeDistribution: Array<{
    grade: string
    count: number
    percentage: number
  }>
  performanceTrends: Array<{
    date: string
    average: number
    assessmentCount: number
  }>
  classComparison: Array<{
    className: string
    average: number
    studentCount: number
  }>
  topPerformers: Array<{
    studentName: string
    average: number
    improvementRate: number
  }>
  strugglingStudents: Array<{
    studentName: string
    average: number
    risksFailure: boolean
  }>
}

interface AdvancedAnalyticsDashboardProps {
  classId?: string
}

export default function AdvancedAnalyticsDashboard({ classId }: AdvancedAnalyticsDashboardProps) {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [timeRange, setTimeRange] = useState('30d')
  const [selectedMetric, setSelectedMetric] = useState('performance')

  useEffect(() => {
    fetchAnalyticsData()
  }, [classId, timeRange])

  const fetchAnalyticsData = async () => {
    setIsLoading(true)
    try {
      const params = new URLSearchParams({
        timeRange,
        ...(classId && { classId }),
      })

      const response = await fetch(`/api/analytics?${params}`)
      if (!response.ok) throw new Error('Failed to fetch analytics')

      const analyticsData = await response.json()
      setData(analyticsData)
    } catch (error) {
      toast.error('Failed to load analytics data')
      console.error('Analytics error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">No analytics data available</p>
      </div>
    )
  }

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6']

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h2 className="text-2xl font-bold text-gray-900">Advanced Analytics</h2>
        
        <div className="flex gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>

          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="performance">Performance</option>
            <option value="participation">Participation</option>
            <option value="improvement">Improvement</option>
          </select>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl font-semibold text-gray-900">{data.overview.totalStudents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assessments</p>
              <p className="text-2xl font-semibold text-gray-900">{data.overview.totalAssessments}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Average Grade</p>
              <p className="text-2xl font-semibold text-gray-900">{data.overview.averageGrade.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <svg className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Completion Rate</p>
              <p className="text-2xl font-semibold text-gray-900">{data.overview.completionRate.toFixed(1)}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.performanceTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="average" 
                stroke="#3B82F6" 
                strokeWidth={2}
                name="Average Grade (%)"
              />
              <Line 
                type="monotone" 
                dataKey="assessmentCount" 
                stroke="#10B981" 
                strokeWidth={2}
                name="Assessments"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.gradeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ grade, percentage }) => `${grade}: ${percentage.toFixed(1)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Class Comparison */}
      {data.classComparison.length > 1 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.classComparison}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="className" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="average" fill="#3B82F6" name="Average Grade (%)" />
              <Bar dataKey="studentCount" fill="#10B981" name="Student Count" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Performance Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Performers */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performers</h3>
          <div className="space-y-3">
            {data.topPerformers.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{student.studentName}</p>
                  <p className="text-sm text-gray-600">
                    {student.improvementRate > 0 ? 
                      `↗ ${student.improvementRate.toFixed(1)}% improvement` : 
                      'Consistent performance'
                    }
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-green-600">{student.average.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Students Needing Support */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Students Needing Support</h3>
          <div className="space-y-3">
            {data.strugglingStudents.map((student, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{student.studentName}</p>
                  <p className="text-sm text-gray-600">
                    {student.risksFailure ? '⚠️ At risk of failing' : 'Below average performance'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-red-600">{student.average.toFixed(1)}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Items */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">📊 Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Performance Insights</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Class average is {data.overview.averageGrade.toFixed(1)}%</li>
              <li>• {data.overview.completionRate.toFixed(1)}% completion rate</li>
              <li>• {data.strugglingStudents.length} students need additional support</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-blue-800 mb-2">Recommended Actions</h4>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Schedule one-on-one sessions with struggling students</li>
              <li>• Consider peer tutoring partnerships</li>
              <li>• Review assessment difficulty and pacing</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

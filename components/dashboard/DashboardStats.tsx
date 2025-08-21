import Link from 'next/link'
import { Users, BookOpen, FileText, Eye, ArrowUpRight } from 'lucide-react'

interface StatsProps {
  stats: {
    totalClasses: number
    totalStudents: number
    draftAssessments: number
    publishedAssessments: number
  }
}

export function DashboardStats({ stats }: StatsProps) {
  const statItems = [
    {
      name: 'Total Classes',
      value: stats.totalClasses,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
      borderColor: 'border-blue-200',
      hoverBg: 'hover:bg-blue-50',
      href: '/classes',
      description: 'Manage your classes'
    },
    {
      name: 'Total Students',
      value: stats.totalStudents,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
      borderColor: 'border-green-200',
      hoverBg: 'hover:bg-green-50',
      href: '/students',
      description: 'View all students'
    },
    {
      name: 'Draft Assessments',
      value: stats.draftAssessments,
      icon: FileText,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
      borderColor: 'border-amber-200',
      hoverBg: 'hover:bg-amber-50',
      href: '/assessments?status=draft',
      description: 'Unpublished assessments'
    },
    {
      name: 'Published Assessments',
      value: stats.publishedAssessments,
      icon: Eye,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
      borderColor: 'border-purple-200',
      hoverBg: 'hover:bg-purple-50',
      href: '/assessments?status=published',
      description: 'Live assessments'
    },
  ]

  return (
    <div className="space-y-6">
      {/* Overview Header */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 rounded-xl p-6 border border-indigo-200 shadow-lg">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-indigo-900 mb-2">
            📚 Welcome to ScholarTrack
          </h2>
          <p className="text-indigo-600 max-w-2xl mx-auto">
            Your comprehensive classroom management dashboard. Track student progress, manage assessments, and streamline your teaching workflow.
          </p>
        </div>
      </div>

      {/* Interactive Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statItems.map((item) => (
          <Link key={item.name} href={item.href}>
            <div className={`group bg-white overflow-hidden shadow-sm rounded-xl border ${item.borderColor} ${item.hoverBg} transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer`}>
              <div className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-3">
                      <div className={`p-2 rounded-lg ${item.bgColor} shadow-sm`}>
                        <item.icon className={`h-5 w-5 ${item.color}`} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-gray-600">
                        {item.name}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {item.value.toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
              </div>
              
              {/* Progress indicator */}
              <div className={`h-1 ${item.bgColor} opacity-50`}></div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

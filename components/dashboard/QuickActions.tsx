'use client'

import Link from 'next/link'
import { 
  Plus, 
  Users, 
  BookOpen, 
  FileText, 
  Megaphone, 
  BarChart3, 
  Settings,
  Calendar,
  ClipboardList,
  GraduationCap,
  Bell,
  TrendingUp
} from 'lucide-react'

interface QuickActionsProps {
  classes: any[]
  students: any[]
  announcements: any[]
}

export function QuickActions({ classes, students, announcements }: QuickActionsProps) {
  const quickActionCards = [
    {
      title: 'Create Assessment',
      description: 'Add a new quiz, exam, or assignment',
      icon: Plus,
      href: classes.length > 0 ? `/classes/${classes[0]?.id}/assessments/new` : '/classes',
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      disabled: classes.length === 0,
      disabledMessage: 'Create a class first'
    },
    {
      title: 'Add Students',
      description: 'Enroll new students to your classes',
      icon: Users,
      href: '/students',
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      title: 'Make Announcement',
      description: 'Share important updates',
      icon: Megaphone,
      href: '/announcements',
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      textColor: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    {
      title: 'View Reports',
      description: 'Generate student performance reports',
      icon: BarChart3,
      href: '/reports',
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    {
      title: 'Manage Classes',
      description: 'Create and organize your classes',
      icon: BookOpen,
      href: '/classes',
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    {
      title: 'Grade Settings',
      description: 'Configure grading periods & types',
      icon: Settings,
      href: '/settings/grading',
      color: 'bg-gray-500',
      hoverColor: 'hover:bg-gray-600',
      textColor: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ]

  const recentStats = [
    {
      label: 'Active Classes',
      value: classes.length,
      icon: BookOpen,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      label: 'Total Students',
      value: students.length,
      icon: Users,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      label: 'Recent Announcements',
      value: announcements.length,
      icon: Bell,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ]

  return (
    <div className="space-y-8">
      {/* Quick Actions Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <div className="w-1 h-6 bg-indigo-500 rounded-full mr-3"></div>
            Quick Actions
          </h3>
          <p className="text-sm text-gray-500 ml-4">Fast access to common tasks</p>
        </div>
        <div className="hidden sm:flex items-center space-x-4">
          {recentStats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${stat.bgColor} mb-1`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div className="text-sm font-semibold text-gray-900">{stat.value}</div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {quickActionCards.map((action, index) => {
          if (action.disabled) {
            return (
              <div
                key={index}
                className="group relative cursor-not-allowed"
              >
                <div className="bg-white rounded-xl border-2 border-gray-200 p-4 transition-all duration-200 opacity-50 grayscale">
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="p-3 rounded-lg bg-gray-100">
                      <action.icon className="h-6 w-6 text-gray-400" />
                    </div>
                    
                    <div className="space-y-1">
                      <h4 className="font-semibold text-sm text-gray-400">
                        {action.title}
                      </h4>
                      <p className="text-xs text-gray-500 leading-tight">
                        {action.disabledMessage}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          }

          return (
            <Link
              key={index}
              href={action.href}
              className="group relative cursor-pointer"
            >
              <div className={`bg-white rounded-xl border-2 ${action.borderColor} p-4 transition-all duration-200 hover:shadow-lg hover:scale-105 ${action.bgColor} hover:border-opacity-60`}>
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className={`p-3 rounded-lg transition-colors duration-200 ${action.color} group-hover:${action.hoverColor}`}>
                    <action.icon className="h-6 w-6 text-white" />
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className={`font-semibold text-sm ${action.textColor}`}>
                      {action.title}
                    </h4>
                    <p className="text-xs text-gray-500 leading-tight">
                      {action.description}
                    </p>
                  </div>
                </div>

                {/* Subtle animation indicator */}
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-30 transition-opacity rounded-b-xl" 
                     style={{ color: action.color.replace('bg-', '#') }}></div>
              </div>
            </Link>
          )
        })}
      </div>

      {/* Additional Resources */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-500 rounded-lg shadow-md">
              <TrendingUp className="h-5 w-5 text-white" />
            </div>
            <div className="ml-4">
              <h4 className="text-lg font-semibold text-indigo-900">Need Help Getting Started?</h4>
              <p className="text-sm text-indigo-600">
                {classes.length === 0 
                  ? "Create your first class to unlock all features"
                  : "Explore advanced features like analytics and grading periods"
                }
              </p>
            </div>
          </div>
          <div className="flex space-x-2">
            {classes.length === 0 ? (
              <Link 
                href="/classes" 
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Class
              </Link>
            ) : (
              <Link 
                href="/analytics" 
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                View Analytics
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

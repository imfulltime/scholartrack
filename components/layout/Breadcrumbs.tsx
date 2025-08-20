'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronRight, Home } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

interface BreadcrumbsProps {
  items?: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const pathname = usePathname()

  // Auto-generate breadcrumbs if not provided
  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const pathSegments = pathname.split('/').filter(Boolean)
    const breadcrumbs: BreadcrumbItem[] = [
      { label: 'Dashboard', href: '/dashboard' }
    ]

    let currentPath = ''
    
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`
      
      // Skip dashboard since it's already added
      if (segment === 'dashboard') return
      
      let label = segment.charAt(0).toUpperCase() + segment.slice(1)
      
      // Handle specific routes
      switch (segment) {
        case 'subjects':
          label = 'Subjects'
          break
        case 'students':
          label = 'Students'
          break
        case 'classes':
          label = 'Classes'
          break
        case 'reports':
          label = 'Reports'
          break
        case 'analytics':
          label = 'Analytics'
          break
        case 'announcements':
          label = 'Announcements'
          break
        case 'assessments':
          label = 'Assessments'
          break
        default:
          // For dynamic routes like [classId], [assessmentId]
          if (segment.length === 36 || segment.match(/^[a-f0-9-]{36}$/)) {
            // This is likely a UUID, try to get a more meaningful name
            const parentSegment = pathSegments[index - 1]
            if (parentSegment === 'classes') {
              label = 'Class Details'
            } else if (parentSegment === 'assessments') {
              label = 'Assessment'
            } else {
              label = 'Details'
            }
          }
          break
      }
      
      breadcrumbs.push({
        label,
        href: currentPath,
        current: index === pathSegments.length - 1
      })
    })

    return breadcrumbs
  }

  const breadcrumbItems = items || generateBreadcrumbs()

  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <nav className="flex" aria-label="Breadcrumb">
      <ol className="flex items-center space-x-4">
        <li>
          <div>
            <Link href="/dashboard" className="text-gray-400 hover:text-gray-500">
              <Home className="h-5 w-5" aria-hidden="true" />
              <span className="sr-only">Dashboard</span>
            </Link>
          </div>
        </li>
        
        {breadcrumbItems.slice(1).map((item, index) => (
          <li key={item.href}>
            <div className="flex items-center">
              <ChevronRight className="h-5 w-5 text-gray-400" aria-hidden="true" />
              <Link
                href={item.href}
                className={`ml-4 text-sm font-medium ${
                  item.current
                    ? 'text-gray-500 cursor-default'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                aria-current={item.current ? 'page' : undefined}
              >
                {item.label}
              </Link>
            </div>
          </li>
        ))}
      </ol>
    </nav>
  )
}

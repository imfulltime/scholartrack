'use client'

import { ReactNode } from 'react'
import Breadcrumbs from './Breadcrumbs'
import Link from 'next/link'
import { ArrowLeft, Plus } from 'lucide-react'

interface BreadcrumbItem {
  label: string
  href: string
  current?: boolean
}

interface ActionButton {
  label: string
  href?: string
  onClick?: () => void
  variant?: 'primary' | 'secondary'
  icon?: ReactNode
}

interface PageWrapperProps {
  title: string
  subtitle?: string
  breadcrumbs?: BreadcrumbItem[]
  backButton?: {
    label: string
    href: string
  }
  actions?: ActionButton[]
  children: ReactNode
}

export default function PageWrapper({
  title,
  subtitle,
  breadcrumbs,
  backButton,
  actions,
  children
}: PageWrapperProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <div className="mb-4">
          <Breadcrumbs items={breadcrumbs} />
        </div>

        {/* Header */}
        <div className="mb-8">
          {backButton && (
            <div className="mb-4">
              <Link
                href={backButton.href}
                className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                {backButton.label}
              </Link>
            </div>
          )}

          <div className="md:flex md:items-center md:justify-between">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
              )}
            </div>

            {actions && actions.length > 0 && (
              <div className="mt-4 flex md:ml-4 md:mt-0 space-x-3">
                {actions.map((action, index) => (
                  <div key={index}>
                    {action.href ? (
                      <Link
                        href={action.href}
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          action.variant === 'secondary'
                            ? 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300 focus:ring-blue-500'
                            : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </Link>
                    ) : (
                      <button
                        onClick={action.onClick}
                        className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          action.variant === 'secondary'
                            ? 'text-gray-700 bg-white hover:bg-gray-50 border-gray-300 focus:ring-blue-500'
                            : 'text-white bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
                        }`}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
  )
}

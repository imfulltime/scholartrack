'use client'

import { useState } from 'react'
import { toast } from 'react-hot-toast'
import { FileText, Download, Users, User, GraduationCap } from 'lucide-react'

interface PDFExportButtonsProps {
  studentId?: string
  classId?: string
  studentName?: string
  className?: string
}

export default function PDFExportButtons({ 
  studentId, 
  classId, 
  studentName, 
  className 
}: PDFExportButtonsProps) {
  const [isGenerating, setIsGenerating] = useState<string | null>(null)

  const generatePDF = async (type: 'student' | 'class' | 'transcript') => {
    if (isGenerating) return

    // Validate required parameters
    if (type === 'student' && (!studentId || !classId)) {
      toast.error('Student and class selection required for student report')
      return
    }
    if (type === 'class' && !classId) {
      toast.error('Class selection required for class summary')
      return
    }
    if (type === 'transcript' && !studentId) {
      toast.error('Student selection required for transcript')
      return
    }

    setIsGenerating(type)
    
    try {
      const response = await fetch('/api/reports/pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          studentId,
          classId,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate PDF')
      }

      // Get the PDF blob
      const blob = await response.blob()
      
      // Get filename from response headers or generate one
      const contentDisposition = response.headers.get('content-disposition')
      let filename = 'report.pdf'
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/)
        if (filenameMatch) {
          filename = filenameMatch[1].replace(/['"]/g, '')
        }
      }

      // Create download link
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      toast.success('PDF generated successfully!')
    } catch (error: any) {
      toast.error(error.message || 'Failed to generate PDF')
      console.error('PDF generation error:', error)
    } finally {
      setIsGenerating(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        <FileText className="h-5 w-5 mr-2" />
        PDF Export Options
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Student Report */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <User className="h-6 w-6 text-blue-600 mr-2" />
            <h4 className="font-medium text-gray-900">Student Report</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Detailed performance report for individual student including scores, trends, and comments.
          </p>
          {studentName && className && (
            <div className="text-xs text-gray-500 mb-3">
              <p><strong>Student:</strong> {studentName}</p>
              <p><strong>Class:</strong> {className}</p>
            </div>
          )}
          <button
            onClick={() => generatePDF('student')}
            disabled={!studentId || !classId || isGenerating === 'student'}
            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating === 'student' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Report
              </>
            )}
          </button>
        </div>

        {/* Class Summary */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <Users className="h-6 w-6 text-green-600 mr-2" />
            <h4 className="font-medium text-gray-900">Class Summary</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Comprehensive class overview with student roster, performance analytics, and assessment summary.
          </p>
          {className && (
            <div className="text-xs text-gray-500 mb-3">
              <p><strong>Class:</strong> {className}</p>
            </div>
          )}
          <button
            onClick={() => generatePDF('class')}
            disabled={!classId || isGenerating === 'class'}
            className="w-full flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating === 'class' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Summary
              </>
            )}
          </button>
        </div>

        {/* Academic Transcript */}
        <div className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center mb-3">
            <GraduationCap className="h-6 w-6 text-purple-600 mr-2" />
            <h4 className="font-medium text-gray-900">Academic Transcript</h4>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Official transcript with course history, final grades, and academic standing.
          </p>
          {studentName && (
            <div className="text-xs text-gray-500 mb-3">
              <p><strong>Student:</strong> {studentName}</p>
            </div>
          )}
          <button
            onClick={() => generatePDF('transcript')}
            disabled={!studentId || isGenerating === 'transcript'}
            className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating === 'transcript' ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Generate Transcript
              </>
            )}
          </button>
        </div>
      </div>

      {/* Usage Instructions */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">📋 Export Instructions</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Student Report:</strong> Select a student and class to generate an individual performance report</li>
          <li>• <strong>Class Summary:</strong> Generate a comprehensive overview of class performance and statistics</li>
          <li>• <strong>Academic Transcript:</strong> Create an official transcript for any student</li>
          <li>• All PDFs include school branding and are suitable for official use</li>
        </ul>
      </div>
    </div>
  )
}

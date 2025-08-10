'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Upload, Download, FileText } from 'lucide-react'
import Papa from 'papaparse'

interface CSVStudent {
  full_name: string
  year_level: string
  external_id?: string
}

export function ImportStudentsForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [preview, setPreview] = useState<CSVStudent[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const downloadTemplate = () => {
    const csvContent = 'full_name,year_level,external_id\nJohn Smith,8,STU001\nJane Doe,9,STU002'
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'students_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const data = results.data as CSVStudent[]
        const validData = data.filter(row => 
          row.full_name && 
          row.year_level && 
          !isNaN(Number(row.year_level)) &&
          Number(row.year_level) >= 1 && 
          Number(row.year_level) <= 12
        )
        
        if (validData.length === 0) {
          toast.error('No valid students found in CSV file')
          return
        }
        
        setPreview(validData)
        toast.success(`Found ${validData.length} valid students`)
      },
      error: () => {
        toast.error('Failed to parse CSV file')
      }
    })
  }

  const handleImport = async () => {
    if (preview.length === 0) {
      toast.error('No students to import')
      return
    }

    setIsLoading(true)

    try {
      const response = await fetch('/api/students/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ students: preview }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to import students')
      }

      const result = await response.json()
      toast.success(`Successfully imported ${result.imported} students`)
      setPreview([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to import students')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">Import Students from CSV</h3>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select CSV File
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
          />
          <p className="mt-1 text-xs text-gray-500">
            CSV file should have columns: full_name, year_level, external_id (optional)
          </p>
        </div>

        {preview.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Preview ({preview.length} students)
            </h4>
            <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-md">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Grade
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Student ID
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {preview.slice(0, 5).map((student, index) => (
                    <tr key={index}>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {student.full_name}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {student.year_level}
                      </td>
                      <td className="px-3 py-2 text-sm text-gray-900">
                        {student.external_id || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 5 && (
                <div className="px-3 py-2 text-sm text-gray-500 bg-gray-50">
                  ... and {preview.length - 5} more students
                </div>
              )}
            </div>
          </div>
        )}

        {preview.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleImport}
              disabled={isLoading}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <Upload className="h-4 w-4 mr-2" />
              {isLoading ? 'Importing...' : `Import ${preview.length} Students`}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

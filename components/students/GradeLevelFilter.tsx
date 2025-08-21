'use client'

import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'

interface GradeLevelFilterProps {
  selectedGrade: number | null
  onGradeChange: (grade: number | null) => void
  studentCounts: Record<number, number>
  className?: string
}

export function GradeLevelFilter({ 
  selectedGrade, 
  onGradeChange, 
  studentCounts,
  className = '' 
}: GradeLevelFilterProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Available grade levels (1-12)
  const gradeLevels = Array.from({ length: 12 }, (_, i) => i + 1)

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
          selectedGrade 
            ? 'border-indigo-300 bg-indigo-50 text-indigo-700' 
            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
        }`}
      >
        <Filter className="h-4 w-4 mr-2" />
        {selectedGrade ? `Grade ${selectedGrade}` : 'All Grades'}
        {selectedGrade && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onGradeChange(null)
            }}
            className="ml-2 text-indigo-500 hover:text-indigo-700"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </button>

      {isOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 z-10" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute right-0 mt-2 w-56 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 px-2 py-1 mb-2">
                Filter by Grade Level
              </div>
              
              {/* All Grades Option */}
              <button
                onClick={() => {
                  onGradeChange(null)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                  selectedGrade === null 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>All Grades</span>
                <span className="text-xs text-gray-500">
                  {Object.values(studentCounts).reduce((a, b) => a + b, 0)} students
                </span>
              </button>

              <div className="border-t border-gray-100 my-2" />

              {/* Individual Grade Options */}
              <div className="max-h-48 overflow-y-auto">
                {gradeLevels.map((grade) => {
                  const count = studentCounts[grade] || 0
                  return (
                    <button
                      key={grade}
                      onClick={() => {
                        onGradeChange(grade)
                        setIsOpen(false)
                      }}
                      disabled={count === 0}
                      className={`w-full flex items-center justify-between px-3 py-2 text-sm rounded-md transition-colors ${
                        selectedGrade === grade 
                          ? 'bg-indigo-50 text-indigo-700' 
                          : count === 0 
                            ? 'text-gray-400 cursor-not-allowed' 
                            : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span>Grade {grade}</span>
                      <span className={`text-xs ${count === 0 ? 'text-gray-400' : 'text-gray-500'}`}>
                        {count} student{count !== 1 ? 's' : ''}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

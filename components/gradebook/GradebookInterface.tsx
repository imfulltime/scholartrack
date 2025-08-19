'use client'

import { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Save, ArrowLeft } from 'lucide-react'

interface Student {
  id: string
  full_name: string
  external_id: string
  raw_score: number | null
  comment: string
}

interface GradebookInterfaceProps {
  assessmentId: string
  students: Student[]
  maxScore: number
  classId: string
}

export function GradebookInterface({ 
  assessmentId, 
  students, 
  maxScore, 
  classId 
}: GradebookInterfaceProps) {
  const [scores, setScores] = useState<Record<string, { score: string; comment: string }>>(() => {
    const initialScores: Record<string, { score: string; comment: string }> = {}
    students.forEach(student => {
      initialScores[student.id] = {
        score: student.raw_score?.toString() || '',
        comment: student.comment || ''
      }
    })
    return initialScores
  })
  
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const router = useRouter()
  const inputRefs = useRef<Record<string, HTMLInputElement>>({})

  const updateScore = useCallback((studentId: string, field: 'score' | 'comment', value: string) => {
    setScores(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }))
    setHasUnsavedChanges(true)
  }, [])

  const validateScore = (score: string): boolean => {
    if (score === '') return true // Allow empty scores
    const numScore = parseFloat(score)
    return !isNaN(numScore) && numScore >= 0 && numScore <= maxScore
  }

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    studentId: string,
    field: 'score' | 'comment'
  ) => {
    const currentIndex = students.findIndex(s => s.id === studentId)
    
    switch (e.key) {
      case 'ArrowDown':
      case 'Enter':
        e.preventDefault()
        if (currentIndex < students.length - 1) {
          const nextStudent = students[currentIndex + 1]
          const nextRef = inputRefs.current[`${nextStudent.id}-${field}`]
          nextRef?.focus()
        }
        break
        
      case 'ArrowUp':
        e.preventDefault()
        if (currentIndex > 0) {
          const prevStudent = students[currentIndex - 1]
          const prevRef = inputRefs.current[`${prevStudent.id}-${field}`]
          prevRef?.focus()
        }
        break
        
      case 'Tab':
        // Let default tab behavior handle moving between score and comment
        break
        
      case 'ArrowLeft':
      case 'ArrowRight':
        // Allow normal text navigation within input
        break
        
      case 'Escape':
        e.preventDefault()
        const input = e.target as HTMLInputElement
        input.blur()
        break
    }
  }

  const handleBlur = async (studentId: string) => {
    // Auto-save on blur
    await saveScore(studentId)
  }

  const saveScore = async (studentId: string) => {
    const scoreData = scores[studentId]
    if (!scoreData) return

    const score = scoreData.score === '' ? null : parseFloat(scoreData.score)
    
    if (scoreData.score !== '' && !validateScore(scoreData.score)) {
      toast.error(`Score must be between 0 and ${maxScore}`)
      return
    }

    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assessment_id: assessmentId,
          student_id: studentId,
          raw_score: score,
          comment: scoreData.comment.trim() || null,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save score')
      }

      // Success feedback
      const studentName = students.find(s => s.id === studentId)?.full_name
      toast.success(`Saved score for ${studentName}`, { duration: 2000 })
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save score')
    }
  }

  const saveAllScores = async () => {
    setIsSaving(true)
    
    try {
      const scoresToSave = Object.entries(scores).map(([studentId, data]) => ({
        assessment_id: assessmentId,
        student_id: studentId,
        raw_score: data.score === '' ? null : parseFloat(data.score),
        comment: data.comment.trim() || null,
      }))

      const response = await fetch('/api/scores/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ scores: scoresToSave }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to save scores')
      }

      toast.success('All scores saved successfully!')
      setHasUnsavedChanges(false)
      router.refresh()
      
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save scores')
    } finally {
      setIsSaving(false)
    }
  }

  const getScorePercentage = (score: string): string => {
    if (!score || !validateScore(score)) return ''
    const percentage = (parseFloat(score) / maxScore) * 100
    return `${percentage.toFixed(1)}%`
  }

  const getScoreColor = (score: string): string => {
    if (!score || !validateScore(score)) return ''
    const percentage = (parseFloat(score) / maxScore) * 100
    if (percentage >= 90) return 'text-green-600'
    if (percentage >= 80) return 'text-blue-600'
    if (percentage >= 70) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push(`/classes/${classId}`)}
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Class
        </button>
        
        <div className="flex items-center space-x-3">
          {hasUnsavedChanges && (
            <span className="text-sm text-amber-600">Unsaved changes</span>
          )}
          <button
            onClick={saveAllScores}
            disabled={isSaving}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
        <h3 className="text-sm font-medium text-blue-800">Keyboard Navigation</h3>
        <ul className="mt-2 text-sm text-blue-700 space-y-1">
          <li>• Use <kbd className="px-1 bg-blue-100 rounded">↑</kbd><kbd className="px-1 bg-blue-100 rounded">↓</kbd> arrow keys to navigate between students</li>
          <li>• Press <kbd className="px-1 bg-blue-100 rounded">Tab</kbd> to move between score and comment fields</li>
          <li>• Press <kbd className="px-1 bg-blue-100 rounded">Enter</kbd> to move to the next student</li>
          <li>• Scores are auto-saved when you move to another field</li>
        </ul>
      </div>

      {/* Gradebook Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Student ID
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Score (/{maxScore})
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Percentage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Comments
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {students.map((student, index) => (
              <tr key={student.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {student.full_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {student.external_id || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <input
                    ref={(el) => {
                      if (el) inputRefs.current[`${student.id}-score`] = el
                    }}
                    type="number"
                    min="0"
                    max={maxScore}
                    step="0.1"
                    value={scores[student.id]?.score || ''}
                    onChange={(e) => updateScore(student.id, 'score', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, student.id, 'score')}
                    onBlur={() => handleBlur(student.id)}
                    className={`w-20 px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 ${
                      scores[student.id]?.score && !validateScore(scores[student.id].score)
                        ? 'border-red-300 bg-red-50'
                        : ''
                    }`}
                    placeholder="0"
                  />
                  {scores[student.id]?.score && !validateScore(scores[student.id].score) && (
                    <p className="mt-1 text-xs text-red-600">Invalid score</p>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <span className={getScoreColor(scores[student.id]?.score || '')}>
                    {getScorePercentage(scores[student.id]?.score || '')}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <input
                    ref={(el) => {
                      if (el) inputRefs.current[`${student.id}-comment`] = el
                    }}
                    type="text"
                    value={scores[student.id]?.comment || ''}
                    onChange={(e) => updateScore(student.id, 'comment', e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, student.id, 'comment')}
                    onBlur={() => handleBlur(student.id)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Optional comment..."
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {students.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No students enrolled in this class.</p>
        </div>
      )}
    </div>
  )
}

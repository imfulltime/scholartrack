'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Calendar, 
  CheckCircle, 
  Plus, 
  Edit2, 
  BookOpen, 
  BarChart3,
  Clock,
  Target,
  TrendingUp
} from 'lucide-react'
import toast from 'react-hot-toast'
import { Database } from '@/types/database'
import { AssessmentTypesManager } from '../assessments/AssessmentTypesManager'

type GradingPeriod = Database['public']['Tables']['grading_periods']['Row']
type AssessmentType = Database['public']['Tables']['assessment_types']['Row']

export function GradingPeriodsManager() {
  const [gradingPeriods, setGradingPeriods] = useState<GradingPeriod[]>([])
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([])
  const [currentPeriod, setCurrentPeriod] = useState<GradingPeriod | null>(null)
  const [selectedPeriod, setSelectedPeriod] = useState<GradingPeriod | null>(null)
  const [loading, setLoading] = useState(true)
  const [schoolYear, setSchoolYear] = useState('')
  const router = useRouter()

  useEffect(() => {
    fetchGradingPeriods()
  }, [])

  const fetchGradingPeriods = async () => {
    try {
      const response = await fetch('/api/grading-periods')
      if (response.ok) {
        const data = await response.json()
        setGradingPeriods(data.grading_periods || [])
        setAssessmentTypes(data.assessment_types || [])
        
        const current = data.grading_periods?.find((p: GradingPeriod) => p.is_current)
        setCurrentPeriod(current || null)
        setSelectedPeriod(current || data.grading_periods?.[0] || null)
        
        if (data.grading_periods?.length > 0) {
          setSchoolYear(data.grading_periods[0].school_year)
        }
      }
    } catch (error) {
      console.error('Error fetching grading periods:', error)
      toast.error('Failed to load grading periods')
    } finally {
      setLoading(false)
    }
  }

  const handleSetCurrentPeriod = async (periodId: string) => {
    try {
      const response = await fetch(`/api/grading-periods/${periodId}/set-current`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to set current period')
      }

      toast.success('Current grading period updated!')
      fetchGradingPeriods()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update current period')
    }
  }

  const createNewSchoolYear = async () => {
    try {
      const response = await fetch('/api/grading-periods/create-school-year', {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create school year')
      }

      toast.success('New school year created!')
      fetchGradingPeriods()
      router.refresh()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create school year')
    }
  }

  // Filter assessment types for selected period
  const periodAssessmentTypes = assessmentTypes.filter(
    type => type.grading_period_id === selectedPeriod?.id
  )

  // Calculate total percentage for selected period
  const totalPercentage = periodAssessmentTypes
    .filter(type => type.is_active)
    .reduce((sum, type) => sum + type.percentage_weight, 0)

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/3"></div>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="h-6 w-6 text-indigo-600 mr-3" />
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Grading Periods - SY {schoolYear}
            </h2>
            <p className="text-sm text-gray-500">
              Philippine K-12 System: 4 grading periods per school year
            </p>
          </div>
        </div>
        <button
          onClick={createNewSchoolYear}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          New School Year
        </button>
      </div>

      {/* System Overview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-100 rounded-lg p-6 border border-blue-200">
        <div className="flex items-center mb-4">
          <BookOpen className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-lg font-semibold text-blue-900">Philippine K-12 Grading System</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-blue-700">
          <div className="flex items-center">
            <Target className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium">4 Grading Periods</div>
              <div className="text-xs">Each period = 100% total</div>
            </div>
          </div>
          <div className="flex items-center">
            <BarChart3 className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium">Default: Quiz 30%, Assignment 40%, Exam 30%</div>
              <div className="text-xs">Customizable per period</div>
            </div>
          </div>
          <div className="flex items-center">
            <TrendingUp className="h-4 w-4 mr-2" />
            <div>
              <div className="font-medium">Final Grade</div>
              <div className="text-xs">Average of 4 periods</div>
            </div>
          </div>
        </div>
      </div>

      {/* Grading Periods Grid */}
      {gradingPeriods.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {gradingPeriods.map((period) => {
            const periodTypes = assessmentTypes.filter(
              type => type.grading_period_id === period.id
            )
            const periodTotal = periodTypes
              .filter(type => type.is_active)
              .reduce((sum, type) => sum + type.percentage_weight, 0)
            
            const isValid = periodTotal === 100
            const isCurrent = period.is_current
            const isSelected = selectedPeriod?.id === period.id

            return (
              <div
                key={period.id}
                className={`relative p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  isCurrent
                    ? 'border-green-400 bg-green-50'
                    : isSelected
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedPeriod(period)}
              >
                {/* Period Header */}
                <div className="flex items-center justify-between mb-3">
                  <h3 className={`font-semibold ${
                    isCurrent ? 'text-green-800' : 'text-gray-900'
                  }`}>
                    {period.name}
                  </h3>
                  {isCurrent && (
                    <div className="flex items-center text-green-600">
                      <Clock className="h-4 w-4 mr-1" />
                      <span className="text-xs font-medium">Current</span>
                    </div>
                  )}
                </div>

                {/* Assessment Types Summary */}
                <div className="space-y-2 mb-3">
                  {periodTypes.slice(0, 3).map((type) => (
                    <div key={type.id} className="flex justify-between text-sm">
                      <span className={type.is_active ? 'text-gray-700' : 'text-gray-400'}>
                        {type.name}
                      </span>
                      <span className={`font-medium ${
                        type.is_active ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {type.percentage_weight}%
                      </span>
                    </div>
                  ))}
                  {periodTypes.length > 3 && (
                    <div className="text-xs text-gray-500">
                      +{periodTypes.length - 3} more types
                    </div>
                  )}
                </div>

                {/* Total Percentage */}
                <div className={`p-2 rounded text-center text-sm font-medium ${
                  isValid 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  Total: {periodTotal}%
                  {isValid && <CheckCircle className="inline h-3 w-3 ml-1" />}
                </div>

                {/* Set Current Button */}
                {!isCurrent && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSetCurrentPeriod(period.id)
                    }}
                    className="mt-3 w-full text-xs bg-indigo-600 text-white py-1 px-2 rounded hover:bg-indigo-700"
                  >
                    Set as Current
                  </button>
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No grading periods</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first school year to get started.
          </p>
        </div>
      )}

      {/* Assessment Types for Selected Period */}
      {selectedPeriod && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <Edit2 className="h-5 w-5 mr-2" />
              {selectedPeriod.name} - Assessment Types
            </h3>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              totalPercentage === 100
                ? 'bg-green-100 text-green-800'
                : 'bg-red-100 text-red-800'
            }`}>
              Total: {totalPercentage}%
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <AssessmentTypesManager 
              gradingPeriodId={selectedPeriod.id}
              periodName={selectedPeriod.name}
            />
          </div>
        </div>
      )}
    </div>
  )
}

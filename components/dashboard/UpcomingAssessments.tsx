import { format } from 'date-fns'
import { Calendar, Clock } from 'lucide-react'

interface Assessment {
  id: string
  title: string
  date: string
  status: 'DRAFT' | 'PUBLISHED'
  class_id: string
}

interface UpcomingAssessmentsProps {
  assessments: Assessment[]
}

export function UpcomingAssessments({ assessments }: UpcomingAssessmentsProps) {
  const upcomingAssessments = assessments
    .filter(assessment => new Date(assessment.date) >= new Date())
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5)

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <Calendar className="h-5 w-5 mr-2 text-indigo-600" />
          Upcoming Assessments
        </h3>
        <div className="mt-5">
          {upcomingAssessments.length === 0 ? (
            <div className="text-center py-8">
              <Clock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No upcoming assessments</h3>
              <p className="mt-1 text-sm text-gray-500">
                Create a new assessment to get started.
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {upcomingAssessments.map((assessment) => (
                  <li key={assessment.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {assessment.title}
                        </p>
                        <p className="text-sm text-gray-500">
                          Class ID: {assessment.class_id}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            assessment.status === 'PUBLISHED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {assessment.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {format(new Date(assessment.date), 'MMM d')}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

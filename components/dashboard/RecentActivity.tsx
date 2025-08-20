import { formatDistanceToNow } from 'date-fns'
import { TrendingUp, Activity } from 'lucide-react'

interface Score {
  id: string
  raw_score: number | null
  updated_at: string
  student_id: string
  assessment_id: string
}

interface RecentActivityProps {
  scores: Score[]
}

export function RecentActivity({ scores }: RecentActivityProps) {
  const recentScores = scores.slice(0, 5)

  return (
    <div className="bg-white overflow-hidden shadow rounded-lg">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
          Recent Activity
        </h3>
        <div className="mt-5">
          {recentScores.length === 0 ? (
            <div className="text-center py-8">
              <Activity className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No recent activity</h3>
              <p className="mt-1 text-sm text-gray-500">
                Grade some assessments to see recent activity.
              </p>
            </div>
          ) : (
            <div className="flow-root">
              <ul role="list" className="-my-5 divide-y divide-gray-200">
                {recentScores.map((score) => (
                  <li key={score.id} className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          Student: {score.student_id}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          Assessment: {score.assessment_id}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {score.raw_score !== null && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Score: {score.raw_score}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          {formatDistanceToNow(new Date(score.updated_at), { addSuffix: true })}
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

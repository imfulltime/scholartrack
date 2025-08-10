import { formatDistanceToNow } from 'date-fns'
import { TrendingUp, Activity } from 'lucide-react'

interface Score {
  id: string
  raw_score: number | null
  updated_at: string
  students: {
    full_name: string
  } | null
  assessments: {
    title: string
    max_score: number
  } | null
}

interface RecentActivityProps {
  scores: Score[]
}

export function RecentActivity({ scores }: RecentActivityProps) {
  const recentScores = scores.slice(0, 5)

  const getScoreColor = (score: number, maxScore: number) => {
    const percentage = (score / maxScore) * 100
    if (percentage >= 90) return 'text-green-600 bg-green-100'
    if (percentage >= 80) return 'text-blue-600 bg-blue-100'
    if (percentage >= 70) return 'text-yellow-600 bg-yellow-100'
    return 'text-red-600 bg-red-100'
  }

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
                          {score.students?.full_name}
                        </p>
                        <p className="text-sm text-gray-500 truncate">
                          {score.assessments?.title}
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        {score.raw_score !== null && score.assessments && (
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(
                              score.raw_score,
                              score.assessments.max_score
                            )}`}
                          >
                            {score.raw_score}/{score.assessments.max_score}
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

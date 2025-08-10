import { BookOpen, Users } from 'lucide-react'

interface ClassHeaderProps {
  classData: {
    name: string
    year_level: number
    subjects: {
      name: string
      code: string
    } | null
  }
  enrollmentCount: number
}

export function ClassHeader({ classData, enrollmentCount }: ClassHeaderProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="h-12 w-12 rounded-lg bg-indigo-100 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-indigo-600" />
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{classData.name}</h1>
            <p className="text-sm text-gray-500 mt-1">
              {classData.subjects?.name} ({classData.subjects?.code}) • Grade {classData.year_level}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Users className="h-4 w-4 mr-1" />
            <span>{enrollmentCount} students</span>
          </div>
        </div>
      </div>
    </div>
  )
}

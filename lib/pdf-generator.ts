import jsPDF from 'jspdf'
import 'jspdf-autotable'

// Extend jsPDF with autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF
    lastAutoTable: {
      finalY: number
    }
  }
}

interface Student {
  id: string
  full_name: string
  year_level: number
  external_id?: string
}

interface Assessment {
  id: string
  title: string
  type: string
  date: string
  max_score: number
  weight: number
}

interface Score {
  assessment_id: string
  raw_score: number
  grade_letter?: string
  comment?: string
  assessment: Assessment
}

interface ClassSummaryData {
  className: string
  subject: string
  teacher: string
  students: Student[]
  assessments: Assessment[]
  scores: Score[]
  analytics: {
    classAverage: number
    highestScore: number
    lowestScore: number
    totalAssessments: number
  }
}

interface StudentReportData {
  student: Student
  className: string
  subject: string
  teacher: string
  scores: Score[]
  overallGrade: number
  letterGrade: string
  trends: {
    improving: boolean
    consistent: boolean
    declining: boolean
  }
}

export class PDFGenerator {
  private doc: jsPDF

  constructor() {
    this.doc = new jsPDF()
  }

  private addHeader(title: string, subtitle?: string) {
    // Add school logo/header
    this.doc.setFontSize(20)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('ScholarTrack', 20, 20)
    
    this.doc.setFontSize(16)
    this.doc.text(title, 20, 35)
    
    if (subtitle) {
      this.doc.setFontSize(12)
      this.doc.setFont('helvetica', 'normal')
      this.doc.text(subtitle, 20, 45)
    }

    // Add date
    this.doc.setFontSize(10)
    this.doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, this.doc.internal.pageSize.height - 20)
  }

  private addFooter(pageNumber: number, totalPages: number) {
    this.doc.setFontSize(8)
    this.doc.text(
      `Page ${pageNumber} of ${totalPages}`,
      this.doc.internal.pageSize.width - 40,
      this.doc.internal.pageSize.height - 10
    )
  }

  public generateStudentReport(data: StudentReportData): ArrayBuffer {
    this.doc = new jsPDF()
    
    this.addHeader(
      'Student Performance Report',
      `${data.student.full_name} - ${data.className}`
    )

    let yPosition = 60

    // Student Information
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Student Information', 20, yPosition)
    yPosition += 10

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    const studentInfo = [
      ['Student Name:', data.student.full_name],
      ['Student ID:', data.student.external_id || 'N/A'],
      ['Year Level:', data.student.year_level.toString()],
      ['Class:', data.className],
      ['Subject:', data.subject],
      ['Teacher:', data.teacher],
    ]

    studentInfo.forEach(([label, value]) => {
      this.doc.text(`${label} ${value}`, 20, yPosition)
      yPosition += 6
    })

    yPosition += 10

    // Overall Performance
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Overall Performance', 20, yPosition)
    yPosition += 10

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Current Grade: ${data.overallGrade.toFixed(1)}% (${data.letterGrade})`, 20, yPosition)
    yPosition += 6

    // Performance trend
    let trendText = 'Performance Trend: '
    if (data.trends.improving) trendText += 'Improving ↗'
    else if (data.trends.declining) trendText += 'Declining ↘'
    else trendText += 'Consistent →'

    this.doc.text(trendText, 20, yPosition)
    yPosition += 15

    // Assessment Scores Table
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Assessment Scores', 20, yPosition)
    yPosition += 10

    const tableData = data.scores.map(score => [
      score.assessment.title,
      score.assessment.type,
      new Date(score.assessment.date).toLocaleDateString(),
      `${score.raw_score}/${score.assessment.max_score}`,
      `${((score.raw_score / score.assessment.max_score) * 100).toFixed(1)}%`,
      score.grade_letter || 'N/A',
    ])

    this.doc.autoTable({
      startY: yPosition,
      head: [['Assessment', 'Type', 'Date', 'Score', 'Percentage', 'Grade']],
      body: tableData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Comments section if any scores have comments
    const scoresWithComments = data.scores.filter(score => score.comment)
    if (scoresWithComments.length > 0) {
      yPosition = (this.doc as any).lastAutoTable.finalY + 20

      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Teacher Comments', 20, yPosition)
      yPosition += 10

      this.doc.setFontSize(10)
      this.doc.setFont('helvetica', 'normal')

      scoresWithComments.forEach(score => {
        this.doc.text(`${score.assessment.title}: ${score.comment}`, 20, yPosition)
        yPosition += 8
      })
    }

    this.addFooter(1, 1)

    return this.doc.output('arraybuffer')
  }

  public generateClassSummary(data: ClassSummaryData): ArrayBuffer {
    this.doc = new jsPDF()
    
    this.addHeader(
      'Class Performance Summary',
      `${data.className} - ${data.subject}`
    )

    let yPosition = 60

    // Class Information
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Class Information', 20, yPosition)
    yPosition += 10

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    const classInfo = [
      ['Class:', data.className],
      ['Subject:', data.subject],
      ['Teacher:', data.teacher],
      ['Total Students:', data.students.length.toString()],
      ['Total Assessments:', data.analytics.totalAssessments.toString()],
    ]

    classInfo.forEach(([label, value]) => {
      this.doc.text(`${label} ${value}`, 20, yPosition)
      yPosition += 6
    })

    yPosition += 10

    // Class Analytics
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Class Performance Analytics', 20, yPosition)
    yPosition += 10

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    const analytics = [
      ['Class Average:', `${data.analytics.classAverage.toFixed(1)}%`],
      ['Highest Score:', `${data.analytics.highestScore.toFixed(1)}%`],
      ['Lowest Score:', `${data.analytics.lowestScore.toFixed(1)}%`],
    ]

    analytics.forEach(([label, value]) => {
      this.doc.text(`${label} ${value}`, 20, yPosition)
      yPosition += 6
    })

    yPosition += 15

    // Student Roster with Averages
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Student Performance Overview', 20, yPosition)
    yPosition += 10

    // Calculate each student's average
    const studentAverages = data.students.map(student => {
      const studentScores = data.scores.filter(score => 
        data.assessments.find(a => a.id === score.assessment_id)
      )
      
      const average = studentScores.length > 0
        ? studentScores.reduce((sum, score) => {
            const assessment = data.assessments.find(a => a.id === score.assessment_id)
            return sum + (score.raw_score / (assessment?.max_score || 1)) * 100
          }, 0) / studentScores.length
        : 0

      return [
        student.full_name,
        student.external_id || 'N/A',
        studentScores.length.toString(),
        `${average.toFixed(1)}%`,
        this.getLetterGrade(average),
      ]
    })

    this.doc.autoTable({
      startY: yPosition,
      head: [['Student Name', 'Student ID', 'Assessments', 'Average', 'Grade']],
      body: studentAverages,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Assessment Summary
    yPosition = (this.doc as any).lastAutoTable.finalY + 20

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Assessment Summary', 20, yPosition)
    yPosition += 10

    const assessmentData = data.assessments.map(assessment => {
      const assessmentScores = data.scores.filter(score => score.assessment_id === assessment.id)
      const average = assessmentScores.length > 0
        ? assessmentScores.reduce((sum, score) => sum + (score.raw_score / assessment.max_score) * 100, 0) / assessmentScores.length
        : 0

      return [
        assessment.title,
        assessment.type,
        new Date(assessment.date).toLocaleDateString(),
        `${assessment.weight}%`,
        `${average.toFixed(1)}%`,
        assessmentScores.length.toString(),
      ]
    })

    this.doc.autoTable({
      startY: yPosition,
      head: [['Assessment', 'Type', 'Date', 'Weight', 'Class Avg', 'Submissions']],
      body: assessmentData,
      theme: 'grid',
      styles: { fontSize: 9 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    this.addFooter(1, 1)

    return this.doc.output('arraybuffer')
  }

  public generateTranscript(studentData: StudentReportData & { 
    additionalClasses?: Array<{
      className: string
      subject: string
      finalGrade: number
      letterGrade: string
      credits: number
    }>
  }): ArrayBuffer {
    this.doc = new jsPDF()
    
    this.addHeader(
      'Official Academic Transcript',
      `${studentData.student.full_name}`
    )

    let yPosition = 60

    // Student Information
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Student Information', 20, yPosition)
    yPosition += 10

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    const studentInfo = [
      ['Student Name:', studentData.student.full_name],
      ['Student ID:', studentData.student.external_id || 'N/A'],
      ['Year Level:', studentData.student.year_level.toString()],
    ]

    studentInfo.forEach(([label, value]) => {
      this.doc.text(`${label} ${value}`, 20, yPosition)
      yPosition += 6
    })

    yPosition += 15

    // Current Class
    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Current Enrollment', 20, yPosition)
    yPosition += 10

    const currentClassData = [[
      studentData.className,
      studentData.subject,
      `${studentData.overallGrade.toFixed(1)}%`,
      studentData.letterGrade,
      '1.0', // Default credits
    ]]

    this.doc.autoTable({
      startY: yPosition,
      head: [['Class', 'Subject', 'Grade %', 'Letter Grade', 'Credits']],
      body: currentClassData,
      theme: 'grid',
      styles: { fontSize: 10 },
      headStyles: { fillColor: [66, 139, 202] },
    })

    // Additional classes if provided
    if (studentData.additionalClasses && studentData.additionalClasses.length > 0) {
      yPosition = (this.doc as any).lastAutoTable.finalY + 15

      this.doc.setFontSize(14)
      this.doc.setFont('helvetica', 'bold')
      this.doc.text('Previous Courses', 20, yPosition)
      yPosition += 10

      const additionalData = studentData.additionalClasses.map(cls => [
        cls.className,
        cls.subject,
        `${cls.finalGrade.toFixed(1)}%`,
        cls.letterGrade,
        cls.credits.toString(),
      ])

      this.doc.autoTable({
        startY: yPosition,
        head: [['Class', 'Subject', 'Grade %', 'Letter Grade', 'Credits']],
        body: additionalData,
        theme: 'grid',
        styles: { fontSize: 10 },
        headStyles: { fillColor: [66, 139, 202] },
      })
    }

    // Summary statistics
    yPosition = (this.doc as any).lastAutoTable.finalY + 15

    this.doc.setFontSize(14)
    this.doc.setFont('helvetica', 'bold')
    this.doc.text('Academic Summary', 20, yPosition)
    yPosition += 10

    const totalCredits = 1.0 + (studentData.additionalClasses?.reduce((sum, cls) => sum + cls.credits, 0) || 0)
    const weightedGPA = studentData.additionalClasses 
      ? (studentData.overallGrade + studentData.additionalClasses.reduce((sum, cls) => sum + cls.finalGrade * cls.credits, 0)) / totalCredits
      : studentData.overallGrade

    this.doc.setFontSize(11)
    this.doc.setFont('helvetica', 'normal')
    this.doc.text(`Total Credits: ${totalCredits.toFixed(1)}`, 20, yPosition)
    yPosition += 6
    this.doc.text(`Cumulative GPA: ${(weightedGPA / 25).toFixed(2)} (4.0 scale)`, 20, yPosition)
    yPosition += 6
    this.doc.text(`Current Standing: ${this.getAcademicStanding(weightedGPA)}`, 20, yPosition)

    this.addFooter(1, 1)

    return this.doc.output('arraybuffer')
  }

  private getLetterGrade(percentage: number): string {
    if (percentage >= 97) return 'A+'
    if (percentage >= 93) return 'A'
    if (percentage >= 90) return 'A-'
    if (percentage >= 87) return 'B+'
    if (percentage >= 83) return 'B'
    if (percentage >= 80) return 'B-'
    if (percentage >= 77) return 'C+'
    if (percentage >= 73) return 'C'
    if (percentage >= 70) return 'C-'
    if (percentage >= 67) return 'D+'
    if (percentage >= 65) return 'D'
    return 'F'
  }

  private getAcademicStanding(average: number): string {
    if (average >= 90) return 'Dean\'s List'
    if (average >= 80) return 'Good Standing'
    if (average >= 70) return 'Satisfactory'
    if (average >= 60) return 'Warning'
    return 'Probation'
  }
}

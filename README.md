# ScholarTrack - K-12 Performance Tracking MVP

A production-ready web application for K-12 performance tracking built with Next.js 14, TypeScript, and Supabase.

## Features

### Current MVP (TEACHER_ADMIN Role)
- **Authentication**: Supabase Auth with email/password
- **Dashboard**: Overview of classes, students, assessments, and recent activity
- **Subject Management**: Create and manage curriculum subjects
- **Student Management**: Individual entry and CSV bulk import
- **Class Management**: Create classes and manage enrollments
- **Assessment System**: Create assessments with different types (Quiz/Exam/Assignment)
- **Grade Entry**: Fast keyboard navigation for efficient grading
- **Publishing Control**: Draft/Published status for assessments
- **Audit Logging**: Complete activity tracking
- **Row Level Security**: Data isolation by owner_id

### Future Ready
- Role-based access control (ADMIN, TEACHER, PARENT, STUDENT, SUPER_ADMIN)
- Multi-tenant organization support
- Advanced reporting and analytics
- Parent/Student portals

## Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Deployment**: Vercel
- **CI/CD**: GitHub Actions

## Quick Start

### Prerequisites
- Node.js 18+
- Supabase account
- Git

### 1. Clone and Install

\`\`\`bash
git clone <repository-url>
cd scholartrack
npm install
\`\`\`

### 2. Environment Setup

Copy the environment template:
\`\`\`bash
cp env.example .env.local
\`\`\`

Fill in your Supabase credentials:
\`\`\`
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
NEXT_PUBLIC_APP_URL=http://localhost:3000
\`\`\`

### 3. Database Setup

Install Supabase CLI:
\`\`\`bash
npm install -g supabase
\`\`\`

Run migrations:
\`\`\`bash
supabase db reset
\`\`\`

Load seed data:
\`\`\`bash
supabase db seed
\`\`\`

### 4. Development

Start the development server:
\`\`\`bash
npm run dev
\`\`\`

Visit http://localhost:3000 and sign up with an email/password.

## Database Schema

### Core Tables
- **users**: User profiles mirroring auth.users
- **students**: Student information with year levels
- **subjects**: Curriculum subjects with codes
- **classes**: Classes linking subjects and year levels
- **enrollments**: Many-to-many student-class relationships
- **grading_schemes**: Configurable grading scales
- **assessments**: Quizzes, exams, and assignments
- **scores**: Individual student scores with comments
- **announcements**: School and class-level announcements
- **audit_log**: Complete activity logging

### Security
- Row Level Security (RLS) enabled on all tables
- Owner-based access control (owner_id = auth.uid())
- Future-ready for multi-tenant organizations

## API Routes

### Students
- `POST /api/students` - Create student
- `POST /api/students/import` - Bulk import from CSV
- `DELETE /api/students/[id]` - Delete student

### Subjects
- `POST /api/subjects` - Create subject
- `DELETE /api/subjects/[id]` - Delete subject

### Classes
- `POST /api/classes` - Create class
- `DELETE /api/classes/[id]` - Delete class

### Enrollments
- `POST /api/enrollments` - Enroll student in class
- `DELETE /api/enrollments` - Remove student from class

### Assessments
- `POST /api/assessments` - Create assessment
- `PATCH /api/assessments/[id]/publish` - Toggle publish status
- `DELETE /api/assessments/[id]` - Delete assessment

### Scores
- `POST /api/scores` - Batch update scores
- `GET /api/scores/class/[classId]` - Get class gradebook

## Key Features

### Fast Grade Entry
The gradebook component features:
- Keyboard navigation (arrow keys, tab, enter)
- Optimistic updates with auto-save
- Inline editing with validation
- Bulk operations for efficiency

### CSV Import
Students can be imported via CSV with template:
\`\`\`csv
full_name,year_level,external_id
John Smith,8,STU001
Jane Doe,9,STU002
\`\`\`

### Audit Trail
All significant actions are logged:
- Entity creation/updates/deletions
- Grade entries and modifications
- Assessment publishing
- User authentication events

## Testing

### Unit Tests
\`\`\`bash
npm test
\`\`\`

### E2E Tests
\`\`\`bash
npm run test:e2e
\`\`\`

### RLS Testing
Test data isolation:
\`\`\`bash
npm run test:rls
\`\`\`

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy automatically on push to main

### Manual Deployment

\`\`\`bash
npm run build
npm run start
\`\`\`

### Database Migrations

Production migrations are handled automatically via Supabase CLI in CI/CD.

## Development Guidelines

### Code Organization
- `/app` - Next.js 14 App Router pages and API routes
- `/components` - Reusable React components
- `/lib` - Utility functions and configurations
- `/types` - TypeScript type definitions
- `/supabase` - Database migrations and seeds

### Best Practices
- Use TypeScript strictly
- Follow React Hooks patterns
- Implement proper error handling
- Add loading states and feedback
- Ensure accessibility (ARIA labels, keyboard navigation)
- Test RLS policies thoroughly

### Performance
- Server-side rendering where appropriate
- Optimistic updates for better UX
- Efficient database queries with proper indexing
- Image optimization via Next.js

## Architecture Decisions

### Single Role MVP
Currently implements only TEACHER_ADMIN role for simplicity. The database schema and components are designed to easily extend to multiple roles without refactoring.

### Owner-based RLS
Using owner_id for data isolation allows simple single-tenant operation now while being ready for multi-tenant organizations later.

### API vs Direct Supabase
Write operations go through API routes for audit logging and business logic, while reads can use direct Supabase client for performance.

## Roadmap

### Phase 2: Multi-Role Support
- Admin dashboard
- Teacher role restrictions
- Parent portal with limited access
- Student self-service portal

### Phase 3: Advanced Features
- Advanced reporting and analytics
- Automated notifications
- Grade export/import
- Integration with external systems

### Phase 4: Scale & Performance
- Multi-tenant organizations
- Advanced caching strategies
- Real-time collaboration
- Mobile app

## Support

For issues and questions:
1. Check the GitHub issues
2. Review the Supabase documentation
3. Check Next.js 14 App Router docs

## License

MIT License - see LICENSE file for details.

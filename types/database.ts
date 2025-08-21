export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          role: 'TEACHER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'SUPER_ADMIN';
          email: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          role?: 'TEACHER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'SUPER_ADMIN';
          email: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          role?: 'TEACHER_ADMIN' | 'ADMIN' | 'TEACHER' | 'PARENT' | 'STUDENT' | 'SUPER_ADMIN';
          email?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      students: {
        Row: {
          id: string;
          family_name: string;
          first_name: string;
          middle_name: string | null;
          display_name: string;
          full_name: string | null; // Deprecated, for backward compatibility
          year_level: number;
          external_id: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          family_name: string;
          first_name: string;
          middle_name?: string | null;
          full_name?: string | null; // Deprecated
          year_level: number;
          external_id?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          family_name?: string;
          first_name?: string;
          middle_name?: string | null;
          full_name?: string | null; // Deprecated
          year_level?: number;
          external_id?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          photo_url: string | null;
          photo_public_id: string | null;
          photo_uploaded_at: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          photo_url?: string | null;
          photo_public_id?: string | null;
          photo_uploaded_at?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          photo_url?: string | null;
          photo_public_id?: string | null;
          photo_uploaded_at?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      subject_photos: {
        Row: {
          id: string;
          subject_id: string;
          photo_url: string;
          photo_public_id: string | null;
          caption: string | null;
          display_order: number;
          expires_at: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          subject_id: string;
          photo_url: string;
          photo_public_id?: string | null;
          caption?: string | null;
          display_order?: number;
          expires_at: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          subject_id?: string;
          photo_url?: string;
          photo_public_id?: string | null;
          caption?: string | null;
          display_order?: number;
          expires_at?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          name: string;
          subject_id: string;
          year_level: number;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          subject_id: string;
          year_level: number;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          subject_id?: string;
          year_level?: number;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      enrollments: {
        Row: {
          class_id: string;
          student_id: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          class_id: string;
          student_id: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          class_id?: string;
          student_id?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      grading_schemes: {
        Row: {
          id: string;
          name: string;
          scale: Record<string, number>;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          scale: Record<string, number>;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          scale?: Record<string, number>;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      assessment_types: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          percentage_weight: number;
          is_active: boolean;
          is_default: boolean;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          percentage_weight: number;
          is_active?: boolean;
          is_default?: boolean;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          percentage_weight?: number;
          is_active?: boolean;
          is_default?: boolean;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      assessments: {
        Row: {
          id: string;
          class_id: string;
          title: string;
          type: 'QUIZ' | 'EXAM' | 'ASSIGNMENT';
          date: string;
          weight: number;
          max_score: number;
          status: 'DRAFT' | 'PUBLISHED';
          assessment_type_id: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          class_id: string;
          title: string;
          type: 'QUIZ' | 'EXAM' | 'ASSIGNMENT';
          date: string;
          weight?: number;
          max_score: number;
          status?: 'DRAFT' | 'PUBLISHED';
          assessment_type_id?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string;
          title?: string;
          type?: 'QUIZ' | 'EXAM' | 'ASSIGNMENT';
          date?: string;
          weight?: number;
          max_score?: number;
          status?: 'DRAFT' | 'PUBLISHED';
          assessment_type_id?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      scores: {
        Row: {
          assessment_id: string;
          student_id: string;
          raw_score: number | null;
          comment: string | null;
          last_updated_by: string;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          assessment_id: string;
          student_id: string;
          raw_score?: number | null;
          comment?: string | null;
          last_updated_by: string;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          assessment_id?: string;
          student_id?: string;
          raw_score?: number | null;
          comment?: string | null;
          last_updated_by?: string;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      announcements: {
        Row: {
          id: string;
          scope: 'SCHOOL' | 'CLASS';
          class_id: string | null;
          title: string;
          body: string;
          published_at: string | null;
          owner_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          scope: 'SCHOOL' | 'CLASS';
          class_id?: string | null;
          title: string;
          body: string;
          published_at?: string | null;
          owner_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          scope?: 'SCHOOL' | 'CLASS';
          class_id?: string | null;
          title?: string;
          body?: string;
          published_at?: string | null;
          owner_id?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_log: {
        Row: {
          id: string;
          user_id: string;
          action: string;
          entity: string;
          entity_id: string;
          meta: Record<string, any> | null;
          owner_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          action: string;
          entity: string;
          entity_id: string;
          meta?: Record<string, any> | null;
          owner_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          action?: string;
          entity?: string;
          entity_id?: string;
          meta?: Record<string, any> | null;
          owner_id?: string;
          created_at?: string;
        };
      };
    };
  };
}

export type UserRole = Database['public']['Tables']['users']['Row']['role'];
export type AssessmentType = Database['public']['Tables']['assessments']['Row']['type'];
export type AssessmentStatus = Database['public']['Tables']['assessments']['Row']['status'];
export type AnnouncementScope = Database['public']['Tables']['announcements']['Row']['scope'];

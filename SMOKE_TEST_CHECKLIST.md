# ScholarTrack MVP - Smoke Test Checklist

## 🧪 **Test Environment Setup**

### Prerequisites:
- [ ] App running on `http://localhost:3000`
- [ ] Supabase project connected and working
- [ ] Two test teacher accounts ready

### Test Accounts:
- **Teacher A**: `teacher-a@test.com` / `testpass123`
- **Teacher B**: `teacher-b@test.com` / `testpass123`

---

## 🔐 **1. Authentication Testing**

### Login/Logout Flow
- [ ] Navigate to app → redirects to `/login`
- [ ] **Teacher A**: Sign up with email/password
- [ ] Successful signup → redirects to `/dashboard`
- [ ] **Teacher A**: Sign out → redirects to `/login`
- [ ] **Teacher A**: Sign in with same credentials → works
- [ ] **Teacher B**: Sign up with different email → works
- [ ] Invalid credentials → shows error message

### Password Reset (If Implemented)
- [ ] "Forgot Password" link exists and works
- [ ] Password reset email sent and functional

### Middleware Protection
- [ ] Direct access to `/dashboard` without auth → redirects to `/login`
- [ ] Direct access to `/subjects` without auth → redirects to `/login`
- [ ] Direct access to `/students` without auth → redirects to `/login`
- [ ] Direct access to `/classes` without auth → redirects to `/login`

---

## 🛡️ **2. RLS Isolation Testing**

### Data Isolation
- [ ] **Teacher A**: Create subject "Mathematics"
- [ ] **Teacher A**: Create student "John Smith"
- [ ] **Teacher A**: Create class "Grade 8 Math"
- [ ] **Teacher B**: Login → Dashboard shows 0 classes/students/subjects
- [ ] **Teacher B**: Cannot see Teacher A's data in any section
- [ ] **Teacher B**: Create own data → isolated from Teacher A

### API Security
- [ ] Browser DevTools → Network tab
- [ ] **Teacher A**: Logged in, make API call (create student)
- [ ] Copy API request headers (including auth cookies)
- [ ] **Teacher B**: Try to replay Teacher A's request → should fail with 403/401

---

## 📚 **3. Core Data Management**

### Subjects Management
- [ ] Create subject with name "Mathematics" and code "MATH"
- [ ] Create subject with duplicate code → error message
- [ ] Edit subject (if implemented) → updates correctly
- [ ] Delete subject → removes from list
- [ ] Empty state shows "Create your first subject" message

### Students Management
- [ ] **Individual Entry**:
  - [ ] Create student with all fields (name, grade, student ID)
  - [ ] Create student without student ID → works
  - [ ] Create another student without student ID → works (fixed issue)
  - [ ] Create student with duplicate student ID → error message
- [ ] **CSV Import**:
  - [ ] Download CSV template
  - [ ] Create test CSV with 5 students
  - [ ] Import CSV → all students created
  - [ ] Import CSV with duplicate student ID → appropriate error
  - [ ] Import CSV with invalid data → error handling

### Classes Management
- [ ] Create class "Grade 8 Mathematics" linked to Math subject
- [ ] Create class requires existing subject
- [ ] Class shows correct subject and year level
- [ ] Delete class → removes from list

### Enrollments
- [ ] Open class detail page
- [ ] Add student to class → appears in roster
- [ ] Add multiple students → all appear
- [ ] Remove student from class → disappears from roster
- [ ] Cannot add student from different grade level → error

---

## 📝 **4. Assessments & Scores**

### Assessment Creation
- [ ] Create quiz: "Algebra Quiz 1", Date: today, Max Score: 20, Weight: 1.0
- [ ] Create exam: "Midterm Exam", Date: next week, Max Score: 100, Weight: 2.0
- [ ] Assessment appears in class detail view
- [ ] Assessment shows correct type badge (Quiz/Exam/Assignment)

### Inline Grade Entry
- [ ] Click into gradebook for assessment
- [ ] Enter scores for each student
- [ ] Use arrow keys to navigate between cells
- [ ] Use tab to move to next student
- [ ] Press Enter to save and move down
- [ ] Leave some scores empty → works
- [ ] Enter score higher than max → validation error
- [ ] Auto-save works (refresh page, scores persist)

### Publish Toggle
- [ ] Assessment starts as "DRAFT" status
- [ ] Click publish toggle → changes to "PUBLISHED"
- [ ] Click again → changes back to "DRAFT"
- [ ] Published assessments show different badge color

---

## 📊 **5. Reports** *(Some features may be missing)*

### Class Summary
- [ ] Navigate to `/reports`
- [ ] Select class → shows summary
- [ ] Displays average score
- [ ] Shows score distribution
- [ ] Charts/graphs render correctly

### Student Reports
- [ ] Select individual student
- [ ] Shows last 5 assessments
- [ ] Displays trend (improving/declining)
- [ ] Shows overall average

### PDF Export
- [ ] Click "Export PDF" button
- [ ] PDF downloads successfully
- [ ] PDF contains student data
- [ ] PDF has school branding/header

---

## 📢 **6. Announcements** *(May need implementation)*

### School-wide Announcements
- [ ] Navigate to `/announcements`
- [ ] Create school-wide announcement
- [ ] Announcement appears on dashboard
- [ ] All teachers can see school announcements

### Class-scoped Announcements
- [ ] Create class-specific announcement
- [ ] Only appears for that class
- [ ] Shows on class detail page

---

## 📱 **7. UI & Performance**

### Mobile Responsiveness
- [ ] Chrome DevTools → Mobile view (iPhone/Android)
- [ ] Navigation menu works on mobile
- [ ] Forms are usable on mobile
- [ ] Tables scroll horizontally on mobile
- [ ] Touch targets are large enough

### Performance
- [ ] Hard refresh → page loads < 1 second
- [ ] Navigation between pages is snappy
- [ ] No JavaScript errors in console
- [ ] No layout shift during loading

### Empty States
- [ ] Dashboard with no data → shows CTAs
- [ ] Subjects page when empty → "Create subject" button
- [ ] Students page when empty → helpful message
- [ ] Classes page when empty → guides user

---

## 📋 **8. Audit Log**

### Score Edits
- [ ] Go to Supabase Dashboard → Table Editor → `audit_log`
- [ ] Enter/edit student scores
- [ ] Check audit_log table → entries created with:
  - [ ] Correct user_id
  - [ ] Action = "UPDATE"
  - [ ] Entity = "score"
  - [ ] Timestamp is accurate
  - [ ] Meta data includes score details

### Assessment Creation
- [ ] Create new assessment
- [ ] Check audit_log → entry with:
  - [ ] Action = "CREATE"
  - [ ] Entity = "assessment"
  - [ ] Meta includes assessment details

---

## ❌ **Known Missing Features (Need Implementation)**

Based on the current codebase, these features are likely missing:

- [ ] **Password Reset**: Not implemented
- [ ] **Reports Dashboard**: Basic structure exists, needs full implementation
- [ ] **PDF Export**: Mentioned in code but not fully implemented
- [ ] **Announcements**: Database schema exists, UI needs implementation
- [ ] **Assessment Detail Pages**: Gradebook interface needs completion
- [ ] **Advanced Grade Entry**: Keyboard navigation needs refinement

---

## 🚨 **Critical Issues to Address**

1. **Missing Gradebook Interface**: Need to complete assessment detail pages
2. **Reports System**: Only basic structure exists
3. **PDF Generation**: Needs full implementation
4. **Announcements**: UI components missing
5. **Error Handling**: Need consistent error messages

---

## ✅ **Success Criteria**

The MVP passes smoke testing when:
- [ ] All authentication flows work
- [ ] Data is properly isolated between teachers
- [ ] Core CRUD operations function correctly
- [ ] Basic gradebook entry works
- [ ] No critical errors or data leaks
- [ ] UI is responsive and performant

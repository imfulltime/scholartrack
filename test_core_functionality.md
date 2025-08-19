# Core Data Management Testing Guide

## 🎯 **Overview**
This guide provides step-by-step testing for all core CRUD operations in ScholarTrack.

---

## 📚 **1. Subjects Management Testing**

### Create Subject
1. Navigate to `/subjects`
2. Click "Add Subject"
3. **Test Case 1: Valid Data**
   - Name: "Mathematics"
   - Code: "MATH"
   - Expected: ✅ Subject created successfully
4. **Test Case 2: Duplicate Code**
   - Name: "Advanced Mathematics" 
   - Code: "MATH" (same as above)
   - Expected: ❌ Error: "A subject with this code already exists"
5. **Test Case 3: Empty Fields**
   - Leave fields blank
   - Expected: ❌ Validation errors

### Edit Subject (If Implemented)
1. Click edit button on existing subject
2. Change name to "Mathematics Advanced"
3. Expected: ✅ Subject updated

### Delete Subject
1. Click delete on subject with no classes
2. Expected: ✅ Subject deleted
3. Try deleting subject with classes attached
4. Expected: ❌ Should prevent deletion or cascade properly

---

## 👥 **2. Students Management Testing**

### Individual Student Creation
1. Navigate to `/students`
2. Click "Add Student"
3. **Test Case 1: Complete Data**
   - Name: "John Smith"
   - Year Level: "8"
   - Student ID: "STU001"
   - Expected: ✅ Student created
4. **Test Case 2: No Student ID (Fixed Issue)**
   - Name: "Jane Doe"
   - Year Level: "9"
   - Student ID: (leave empty)
   - Expected: ✅ Student created
5. **Test Case 3: Another No Student ID**
   - Name: "Bob Wilson"
   - Year Level: "8"
   - Student ID: (leave empty)
   - Expected: ✅ Student created (this was the bug we fixed!)
6. **Test Case 4: Duplicate Student ID**
   - Name: "Alice Brown"
   - Year Level: "10"
   - Student ID: "STU001" (duplicate)
   - Expected: ❌ Error: "A student with this ID already exists"

### CSV Import Testing
1. Click "Download Template"
2. Create test CSV:
```csv
full_name,year_level,external_id
Michael Johnson,7,STU010
Sarah Davis,8,STU011
David Wilson,9,
Emma Brown,10,STU013
```
3. **Test Case 1: Valid CSV**
   - Upload the file
   - Expected: ✅ All 4 students imported
4. **Test Case 2: Duplicate Student ID**
   - Create CSV with existing STU001
   - Expected: ❌ Error about duplicate ID
5. **Test Case 3: Invalid Data**
   - Year level = 15 (invalid)
   - Expected: ❌ Validation error or filtered out

### Student Search
1. Type in search box
2. Expected: ✅ Filters students by name and ID

---

## 🏫 **3. Classes Management Testing**

### Prerequisites
- At least 1 subject created
- At least 2 students created

### Create Class
1. Navigate to `/classes`
2. Click "Create Class"
3. **Test Case 1: Valid Class**
   - Name: "Grade 8 Mathematics A"
   - Subject: "Mathematics"
   - Year Level: "8"
   - Expected: ✅ Class created
4. **Test Case 2: No Subject Available**
   - If no subjects exist
   - Expected: ⚠️ Warning to create subject first

### Class Detail Page
1. Click "View Details" on created class
2. Expected: ✅ Shows class header with subject and year level

---

## 🎓 **4. Enrollment Management Testing**

### Prerequisites
- 1 class created
- 3+ students in same year level as class

### Add Students to Class
1. Open class detail page
2. Click "Add Student" in enrollment manager
3. **Test Case 1: Same Year Level**
   - Select Grade 8 student for Grade 8 class
   - Expected: ✅ Student added to roster
4. **Test Case 2: Different Year Level**
   - Try to add Grade 9 student to Grade 8 class
   - Expected: ❌ Should not appear in dropdown or error
5. **Test Case 3: Multiple Students**
   - Add 2-3 more students
   - Expected: ✅ All appear in roster

### Remove Students from Class
1. Click "X" next to student in roster
2. Confirm removal
3. Expected: ✅ Student removed from roster

---

## 📝 **5. Assessment Management Testing**

### Create Assessment
1. Open class detail page
2. Click "Create Assessment"
3. **Test Case 1: Quiz**
   - Title: "Algebra Quiz 1"
   - Type: "Quiz"
   - Date: Today
   - Max Score: 20
   - Weight: 1.0
   - Expected: ✅ Assessment created as DRAFT
4. **Test Case 2: Exam**
   - Title: "Midterm Exam"
   - Type: "Exam"
   - Date: Next week
   - Max Score: 100
   - Weight: 2.0
   - Expected: ✅ Assessment created

### Publish Toggle
1. Find assessment in list
2. Click publish toggle (eye icon)
3. Expected: ✅ Status changes to PUBLISHED
4. Click again
5. Expected: ✅ Status changes back to DRAFT

---

## 📊 **6. Grade Entry Testing**

### Open Gradebook
1. Click "Grade Assessment" (FileText icon) on assessment
2. Expected: ✅ Opens gradebook interface with enrolled students

### Keyboard Navigation Testing
1. **Arrow Keys**
   - Click in first score field
   - Press ↓ (down arrow)
   - Expected: ✅ Moves to same field for next student
   - Press ↑ (up arrow)
   - Expected: ✅ Moves back to previous student
2. **Tab Navigation**
   - Press Tab from score field
   - Expected: ✅ Moves to comment field for same student
3. **Enter Key**
   - Press Enter in score field
   - Expected: ✅ Moves to score field for next student

### Score Entry Testing
1. **Valid Score**
   - Enter "18" in 20-point quiz
   - Tab to next field
   - Expected: ✅ Shows 90% in percentage column
2. **Invalid Score**
   - Enter "25" in 20-point quiz
   - Expected: ❌ Red border, validation error
3. **Empty Score**
   - Leave field empty
   - Expected: ✅ Accepted (allows missing scores)
4. **Auto-save Testing**
   - Enter score and move to next field
   - Expected: ✅ Toast notification "Saved score for [Student]"

---

## 🔒 **7. RLS Isolation Testing**

### Setup Two Teacher Accounts
1. **Teacher A**: teacher-a@test.com
2. **Teacher B**: teacher-b@test.com

### Data Isolation Testing
1. **Teacher A**: Create complete dataset
   - 1 subject, 3 students, 1 class, 1 assessment, some scores
2. **Teacher B**: Sign up and log in
3. **Verify Isolation**:
   - Dashboard: ✅ Shows 0 classes, 0 students, 0 subjects
   - Navigate to each section: ✅ All show empty states
   - Cannot see Teacher A's data anywhere

### API Security Testing
1. Open browser console
2. Copy and run the API security test script
3. Expected: ✅ All security tests pass

---

## 📱 **8. Mobile Responsiveness Testing**

### Test Different Screen Sizes
1. **Desktop** (1920x1080): ✅ Full layout
2. **Tablet** (768px): ✅ Responsive grid
3. **Mobile** (375px): ✅ Stacked layout, hamburger menu

### Mobile-Specific Features
1. **Navigation**: ✅ Hamburger menu works
2. **Forms**: ✅ Input fields are large enough
3. **Tables**: ✅ Scroll horizontally on small screens
4. **Touch Targets**: ✅ Buttons are 44px+ for touch

---

## 🔍 **9. Error Handling Testing**

### Network Errors
1. Turn off internet
2. Try to create student
3. Expected: ✅ Clear error message

### Validation Errors
1. Submit forms with invalid data
2. Expected: ✅ Field-specific error messages

### Loading States
1. Check for loading indicators during API calls
2. Expected: ✅ Buttons show "Creating..." or similar

---

## 📋 **10. Performance Testing**

### Page Load Times
1. **Cold Load**: ✅ < 2 seconds
2. **Warm Load**: ✅ < 1 second
3. **Navigation**: ✅ Instant page transitions

### Large Data Sets
1. Import 50+ students via CSV
2. Create 10+ assessments
3. Expected: ✅ Interface remains responsive

---

## ✅ **Success Criteria**

### Critical (Must Pass)
- [ ] Authentication works completely
- [ ] Data is isolated between teachers
- [ ] All CRUD operations function
- [ ] Multiple students without Student ID (our fix works!)
- [ ] Gradebook keyboard navigation works
- [ ] No JavaScript errors in console

### Important (Should Pass)
- [ ] CSV import works
- [ ] Mobile interface is usable
- [ ] Form validation prevents bad data
- [ ] Loading states provide feedback
- [ ] Auto-save works in gradebook

### Nice to Have
- [ ] Performance is snappy
- [ ] Error messages are helpful
- [ ] Empty states guide user actions
- [ ] API security tests all pass

---

## 🚨 **Common Issues to Watch For**

1. **Student ID Bug**: Multiple students with empty IDs (FIXED!)
2. **RLS Bypass**: Seeing other teachers' data
3. **Form Validation**: Accepting invalid data
4. **Keyboard Nav**: Arrow keys not working in gradebook
5. **Mobile Issues**: Buttons too small, text cut off
6. **Performance**: Slow loading with many students

**Start with the Critical tests, then work through Important ones!**

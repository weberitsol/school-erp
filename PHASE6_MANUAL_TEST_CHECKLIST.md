# Phase 6: Manual Testing Checklist

**Date**: January 8, 2025
**Purpose**: Step-by-step manual testing guide for comprehensive validation

---

## 🎯 Pre-Testing Setup

### Prerequisites
- [ ] Backend server running: `npm run dev` (backend directory)
- [ ] Frontend server running: `npm run dev` (frontend directory)
- [ ] User logged in with valid account
- [ ] Valid JWT token available
- [ ] Test data exists in database
- [ ] Multiple browsers available (Chrome, Firefox, Safari)

### Test Data Checklist
- [ ] At least 1 test with 10+ questions
- [ ] At least 2 students with exam results
- [ ] At least 1 term with exam data
- [ ] At least 1 chapter with description

---

## ✅ Test 1: Question Paper - Single Column

### Setup
- Navigate to a test details page
- Locate the "Generate Question Paper" button

### Test Steps
- [ ] Click "Generate Question Paper" button
- [ ] Verify dialog opens with test name displayed
- [ ] Select "Single Column" layout (radio button)
- [ ] Verify "Include Answers" is unchecked
- [ ] Add sample instructions in textarea: "Answer all questions clearly"
- [ ] Verify instruction text is visible
- [ ] Click "Generate & Download" button
- [ ] Wait for file download

### Verification
After file downloads:

#### File Properties
- [ ] File downloaded successfully
- [ ] File format is .docx
- [ ] File size is reasonable (50KB-500KB)
- [ ] File creation timestamp is recent

#### Document Content
- [ ] Open file in Microsoft Word
- [ ] Verify document structure:
  - [ ] Title at top: Test name
  - [ ] Subtitle: Subject and class info
  - [ ] Instructions section with your text
  - [ ] All questions numbered (1, 2, 3, etc.)
  - [ ] Question options (a, b, c, d) listed under each question
  - [ ] No answer keys visible

#### Formatting
- [ ] Single column layout (obvious on page)
- [ ] Text is readable and properly formatted
- [ ] Headers appear on each page
- [ ] Page numbers visible in footer
- [ ] No text overflow or clipping
- [ ] Professional appearance

#### Performance
- [ ] Generation completed in < 2 seconds
- [ ] No error messages shown
- [ ] Toast notification shows "Success"

**Result**: ✅ PASS / ❌ FAIL

---

## ✅ Test 2: Question Paper - Double Column

### Setup
- Same test as Test 1
- Different dialog session

### Test Steps
- [ ] Click "Generate Question Paper" button
- [ ] Select "Double Column" layout
- [ ] Toggle "Include Answers" ON
- [ ] Add instructions
- [ ] Click "Generate & Download"

### Verification

#### Layout
- [ ] Document has clear 2-column layout
- [ ] Content evenly distributed across columns
- [ ] Text properly flows from left to right column
- [ ] Column separation is clear

#### Content
- [ ] Questions are present in both columns
- [ ] Answer keys displayed after questions
- [ ] Answer keys color-coded (blue text)
- [ ] Answer explanations shown if available
- [ ] No content missing compared to single column

#### Performance
- [ ] File generated within 2-3 seconds
- [ ] File size reasonable (slightly larger than single column)

**Result**: ✅ PASS / ❌ FAIL

---

## ✅ Test 3: Report Card Generation

### Setup
- Navigate to student profile page
- Locate "Generate Report Card" button

### Test Steps
- [ ] Click "Generate Report Card" button
- [ ] Verify dialog opens showing student name
- [ ] Verify term is automatically selected (or select one)
- [ ] Verify term name displays
- [ ] Select "Single Column" layout
- [ ] Click "Generate & Download"
- [ ] Wait for download

### Verification

#### Document Content
- [ ] Student name at top in large text
- [ ] Student ID displayed
- [ ] Term name visible
- [ ] Date generated shown

#### Grade Information
- [ ] All subjects listed
- [ ] Marks shown as: "Obtained/Total"
- [ ] Grade calculated and displayed
- [ ] Percentage calculated and displayed
- [ ] Total marks at bottom
- [ ] Final percentage correct

#### Formatting
- [ ] Professional table layout
- [ ] Clear column headers (Subject, Marks, Grade)
- [ ] Proper alignment
- [ ] Grade color-coded (green for pass, red for fail)

#### Validation
- [ ] All grade calculations are correct
  - [ ] Math: 85/100 should show 85%
  - [ ] If total = 425/500, should show 85%
- [ ] No missing subject grades

#### Performance
- [ ] Generated in < 1 second
- [ ] File size reasonable

**Result**: ✅ PASS / ❌ FAIL

---

## ✅ Test 4: Certificate Generation - Multiple Types

### Setup
- Navigate to student profile
- Locate "Generate Certificate" button

### Test Steps (Repeat for each certificate type)

#### Test 4a: Participation Certificate
- [ ] Click "Generate Certificate"
- [ ] Verify student name displayed
- [ ] Select "Participation" from certificate type dropdown
- [ ] View description: "For participation in activities"
- [ ] Add achievement: "For active participation in Science Club"
- [ ] Verify date is today's date
- [ ] Click "Generate & Download"

#### Test 4b: Academic Excellence
- [ ] Select "Academic Excellence"
- [ ] Add achievement: "For securing 95% in Mathematics"
- [ ] Download

#### Test 4c: Perfect Attendance
- [ ] Select "Perfect Attendance"
- [ ] Add achievement: "For perfect attendance throughout the term"
- [ ] Download

#### Test 4d: Sports Achievement
- [ ] Select "Sports Achievement"
- [ ] Add achievement: "For winning first place in 100m race"
- [ ] Download

#### Test 4e: Cultural Achievement
- [ ] Select "Cultural Achievement"
- [ ] Add achievement: "For best performance in annual cultural fest"
- [ ] Download

#### Test 4f: Leadership
- [ ] Select "Leadership"
- [ ] Add achievement: "For exemplary leadership qualities"
- [ ] Download

### Verification (All Types)

#### Certificate Layout
- [ ] Professional certificate format
- [ ] "CERTIFICATE OF ACHIEVEMENT" at top (large, centered)
- [ ] Student name prominently displayed (large text)
- [ ] Certificate type mentioned
- [ ] Achievement text clearly visible
- [ ] Date at bottom

#### Certificate Elements
- [ ] Signature lines present (Principal, Director)
- [ ] Decorative elements if applicable
- [ ] Company/School seal area marked
- [ ] Professional color scheme

#### Content Accuracy
- [ ] Student name correct
- [ ] Achievement description matches input
- [ ] Date is correct
- [ ] Certificate type is clear

#### Performance
- [ ] Each certificate generates in < 1 second
- [ ] No errors

**Result**: ✅ PASS / ❌ FAIL

---

## ✅ Test 5: Study Material Generation

### Setup
- Navigate to chapter details page
- Locate "Generate Study Material" button

### Test Steps
- [ ] Click "Generate Study Material"
- [ ] Verify chapter name displayed
- [ ] Verify subject name displayed (if shown)
- [ ] Select "Double Column" layout
- [ ] Toggle "Include Practice Questions" ON
- [ ] Click "Generate & Download"

### Verification

#### Document Structure
- [ ] Chapter title at top
- [ ] Subject and class info displayed
- [ ] Chapter description included
- [ ] "Practice Questions" section header

#### Layout
- [ ] Double column layout applied
- [ ] Content balanced across columns
- [ ] No large gaps in columns
- [ ] Text flows naturally

#### Questions
- [ ] All practice questions included
- [ ] Questions numbered sequentially
- [ ] Options (a, b, c, d) listed
- [ ] No answers shown (unless specified)

#### Content Quality
- [ ] Chapter description is complete
- [ ] Questions are relevant to chapter
- [ ] Formatting is professional
- [ ] No missing content

#### Performance
- [ ] Generated in < 3 seconds (longer due to questions)
- [ ] File size reasonable

**Result**: ✅ PASS / ❌ FAIL

---

## ✅ Test 6: Content Preservation

### Setup
- Create or find a test with special content:
  - Mathematical equations
  - Scientific diagrams/references
  - Tables with data
  - Special characters (±, √, ∫, etc.)

### Test Steps
- [ ] Generate question paper with this test
- [ ] Download both single and double column versions

### Verification

#### Mathematical Equations
- [ ] Equations preserved in readable format
- [ ] LaTeX notation preserved
- [ ] Special characters (±, √) readable
- [ ] Subscripts/superscripts correct
- [ ] Example: "2x² + 3x - 5 = 0" appears correctly

#### Diagrams & References
- [ ] Diagram references preserved as text
- [ ] Diagram captions intact
- [ ] Image paths/references documented
- [ ] No broken references

#### Tables
- [ ] Table structure preserved
- [ ] Table data accurate
- [ ] Borders and formatting intact
- [ ] Column alignment correct

#### Special Characters
- [ ] Scientific notation preserved (e.g., 1.23 × 10⁻⁴)
- [ ] Greek letters if applicable (α, β, γ)
- [ ] Degree symbols (°)
- [ ] Currency symbols if present

**Result**: ✅ PASS / ❌ FAIL

---

## ✅ Test 7: Error Handling

### Test 7a: Invalid Test ID
- [ ] Open browser DevTools (F12)
- [ ] Generate question paper with invalid test ID
- [ ] Observe error response
- [ ] Verify user-friendly error message shown
- [ ] No system crash or blank page

**Expected**: Error toast notification with message

### Test 7b: Missing Required Fields
- [ ] Try to submit form with empty testId
- [ ] Verify form validation prevents submission
- [ ] Check error message appears

**Expected**: Form validation error shown

### Test 7c: Network Disconnection
- [ ] Open DevTools Network tab
- [ ] Check "Offline" option
- [ ] Try to generate document
- [ ] Observe error handling
- [ ] Re-enable network
- [ ] Try again (should work)

**Expected**: Network error handled gracefully

### Test 7d: Invalid/Expired Token
- [ ] Edit authorization token to invalid value
- [ ] Try to generate document
- [ ] Observe error response

**Expected**: 401 Unauthorized error or redirect to login

**Result**: ✅ PASS / ❌ FAIL

---

## ✅ Test 8: Performance Testing

### Setup
- Prepare tests with varying question counts:
  - Small: 5 questions
  - Medium: 15 questions
  - Large: 50+ questions

### Test Steps
- [ ] Time each generation using stopwatch
- [ ] Record generation duration
- [ ] Monitor browser performance
- [ ] Check file sizes

### Performance Benchmarks

| Scenario | Target | Actual | Status |
|----------|--------|--------|--------|
| 5 Questions | < 500ms | ___ | ✅/❌ |
| 15 Questions | 500-1000ms | ___ | ✅/❌ |
| 50+ Questions | 1000-2000ms | ___ | ✅/❌ |
| With Images | +200-300ms | ___ | ✅/❌ |
| Double Column | +100-200ms | ___ | ✅/❌ |
| Report Card | < 500ms | ___ | ✅/❌ |
| Certificate | < 300ms | ___ | ✅/❌ |

### Memory & CPU Monitoring
- [ ] Open Task Manager (Windows) or Activity Monitor (Mac)
- [ ] Note browser memory usage before
- [ ] Generate large document
- [ ] Note peak memory usage
- [ ] Verify it drops after completion

**Expected**:
- Memory: < 300MB peak
- CPU: < 80% during generation

**Result**: ✅ PASS / ❌ FAIL

---

## ✅ Test 9: Browser Compatibility

### Chrome
- [ ] Dialog opens correctly
- [ ] Form inputs work
- [ ] File downloads
- [ ] Notification appears
- [ ] No console errors

### Firefox
- [ ] Dialog opens correctly
- [ ] Form inputs work
- [ ] File downloads
- [ ] Notification appears
- [ ] No console errors

### Safari
- [ ] Dialog opens correctly
- [ ] Form inputs work
- [ ] File downloads
- [ ] Notification appears
- [ ] No console errors

### Edge
- [ ] Dialog opens correctly
- [ ] Form inputs work
- [ ] File downloads
- [ ] Notification appears
- [ ] No console errors

### Mobile (Chrome Mobile)
- [ ] Dialog responsive on small screen
- [ ] Form inputs accessible
- [ ] File downloads to device
- [ ] Touch interactions work

**Result**: ✅ PASS / ❌ FAIL

---

## ✅ Test 10: Concurrent Usage

### Setup
- Open application in 2+ browser tabs/windows

### Test Steps
- [ ] Generate question paper in Tab 1
- [ ] Simultaneously generate report card in Tab 2
- [ ] Simultaneously generate certificate in Tab 3
- [ ] Wait for all downloads
- [ ] Verify all files correct

### Verification
- [ ] All 3 downloads complete
- [ ] No conflicts between requests
- [ ] Each file is correct for its request
- [ ] No errors or timeouts

**Result**: ✅ PASS / ❌ FAIL

---

## 🎯 Integration Testing Scenarios

### Scenario 1: Complete Question Paper Workflow
```
1. Log in to application
2. Navigate to Tests section
3. Select a test
4. Click "Generate Question Paper"
5. Select layout preferences
6. Generate and download
7. Open file and verify content
8. Expected: Complete success ✅
```

### Scenario 2: Student Report Card Workflow
```
1. Log in as teacher/admin
2. Navigate to Students section
3. Select a student profile
4. Click "Generate Report Card"
5. Select term
6. Generate and download
7. Open file and verify grades
8. Expected: Accurate grade data ✅
```

### Scenario 3: Certificate Issuance Workflow
```
1. Navigate to Student profiles
2. Select student
3. Generate multiple certificates:
   - Academic Excellence
   - Participation
   - Attendance
4. Download all
5. Open each and verify
6. Expected: All unique documents ✅
```

---

## 📊 Test Results Summary

### Overall Status
- Total Tests: 10
- Passed: ____ / 10
- Failed: ____ / 10
- Blocked: ____ / 10

### Pass Rate: _____%

### Critical Issues Found
```
1. [Issue description]
   - Severity: [Critical/High/Medium/Low]
   - Component: [Backend/Frontend/Database]
   - Steps to reproduce: [...]
   - Expected: [...]
   - Actual: [...]
```

### Performance Summary
- Average Generation Time: ____ms
- Peak Memory Usage: ____MB
- CPU Peak Usage: ____%
- Concurrent Request Success Rate: ____%

### Browser Compatibility
- Chrome: ✅/❌
- Firefox: ✅/❌
- Safari: ✅/❌
- Edge: ✅/❌
- Mobile: ✅/❌

---

## ✅ Sign-Off

### Test Execution Summary
```
Testing Period: January 8 - [Date]
Total Time Spent: [Hours]

Tests Executed: ____
Tests Passed: ____
Tests Failed: ____

Overall Result: ✅ PASS / ❌ FAIL

Testing Completed By: ________________________
Date: ________________________
```

### Recommendations
1. [Recommendation 1]
2. [Recommendation 2]
3. [Recommendation 3]

---

## 🔄 Regression Testing (Post-Bug Fixes)

After any bug fixes, re-run:
- [ ] Failing test case
- [ ] Related test cases
- [ ] Full test suite if major changes

---

## 📞 Support for Testing Issues

If you encounter issues:

1. **Check Browser Console** (F12)
   - Look for JavaScript errors
   - Check Network tab for failed API calls

2. **Check Backend Logs**
   - Review terminal where backend is running
   - Look for error messages

3. **Test with Different Data**
   - Try different tests/students
   - Try data with no special characters

4. **Clear Browser Cache**
   - Ctrl+Shift+Delete (Windows)
   - Cmd+Shift+Delete (Mac)

---

**Testing Guide Complete**

Use this checklist to systematically test all functionality and ensure quality before deployment.

---

Generated: January 8, 2025

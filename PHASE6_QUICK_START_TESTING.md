# Phase 6: Quick Start Testing Guide

**⏱️ Time to Complete: 30-45 minutes**

---

## 🚀 Quick Start (5 Steps)

### Step 1: Start Servers (5 minutes)

**Terminal 1 - Backend**:
```bash
cd "D:\Weber-Campus-Management\school-erp\backend"
npm run dev
```

Wait for: `✅ Server running on port 5000`

**Terminal 2 - Frontend**:
```bash
cd "D:\Weber-Campus-Management\school-erp\frontend"
npm run dev
```

Wait for: `Server started at localhost:3000`

---

### Step 2: Get JWT Token (2 minutes)

**Option A: Via Browser**
1. Open browser to http://localhost:3000
2. Login with valid credentials
3. Open DevTools (F12)
4. Run in console:
```javascript
localStorage.getItem('token')
```
5. Copy the token value

**Option B: Via API (if admin account exists)**
```bash
curl -X POST http://localhost:5000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@school.com","password":"admin123"}'
```

Copy the `token` from response.

---

### Step 3: Run Automated Tests (10 minutes)

**Terminal 3**:
```bash
cd "D:\Weber-Campus-Management\school-erp"

# Make script executable
chmod +x PHASE6_API_TEST_SCRIPTS.sh

# Run tests with your token
./PHASE6_API_TEST_SCRIPTS.sh "YOUR_JWT_TOKEN_HERE"
```

**Watch for**:
```
✅ Question paper generated successfully
✅ Report card generated successfully
✅ Certificate generated successfully
✅ Study material generated successfully
✅ All concurrent requests completed successfully
```

**Check results**:
```bash
ls -la test-downloads/
```

Should see generated .docx files

---

### Step 4: Manual Validation (20 minutes)

1. **Navigate to Tests Section**
   - Open http://localhost:3000
   - Go to Tests/Exams section
   - Select any test with questions

2. **Click "Generate Question Paper"**
   - Select "Single Column"
   - Click Generate & Download
   - Open file in Microsoft Word
   - Verify:
     - Questions are present ✅
     - Options are formatted ✅
     - No errors in document ✅

3. **Try Double Column**
   - Click "Generate Question Paper" again
   - Select "Double Column"
   - Select "Include Answers"
   - Generate & Download
   - Verify 2-column layout ✅

4. **Generate Report Card**
   - Navigate to Students section
   - Select a student
   - Click "Generate Report Card"
   - Download and open
   - Verify grades table ✅

5. **Generate Certificate**
   - Stay on student profile
   - Click "Generate Certificate"
   - Select certificate type
   - Add achievement text
   - Generate & Download
   - Verify layout ✅

---

### Step 5: Record Results (5 minutes)

```markdown
## Phase 6 Quick Test Results

**Date**: January 8, 2025
**Tester**: [Your name]

### Automated Tests
- [ ] API Tests Passed
- [ ] All files generated successfully
- [ ] Performance acceptable

### Manual Tests
- [ ] Question Paper - Single Column ✅/❌
- [ ] Question Paper - Double Column ✅/❌
- [ ] Report Card ✅/❌
- [ ] Certificate ✅/❌

### Issues Found
- [List any issues]

### Overall Status
✅ Ready for Production / ❌ Needs Fixes

### Notes
[Any additional notes]
```

---

## 📋 Simple Pass/Fail Checklist

### Must Pass Tests (Minimum)

- [ ] Question paper generates without errors
- [ ] Report card displays correct grades
- [ ] Certificate prints/displays correctly
- [ ] Study material includes chapter content
- [ ] Downloaded files open in Word
- [ ] Single column layout works
- [ ] Double column layout works
- [ ] Include answers checkbox works
- [ ] No console errors (F12)
- [ ] No server errors (terminal)

**Result**: All checked = ✅ PASS

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| "Server not running" | Run `npm run dev` in backend directory |
| "JWT token invalid" | Login again and copy fresh token |
| "Blank document" | Check if test has questions in database |
| "File won't download" | Clear browser cache (Ctrl+Shift+Delete) |
| "API 404 error" | Verify backend server is running |
| "Cannot connect" | Check if frontend/backend URLs are correct |

---

## ✅ Success Indicators

### You'll know it works when you see:

1. **API Response**:
   ```
   ✅ Question paper generated successfully
   Duration: 1234ms | File size: 125K
   ```

2. **Downloaded File**:
   - File appears in Downloads folder
   - File extension is `.docx`
   - File size is > 50KB

3. **Document Opens**:
   - Opens in Microsoft Word/LibreOffice
   - Contains proper formatting
   - Text is readable
   - Questions are numbered

4. **No Errors**:
   - Browser console (F12) shows no red errors
   - Backend terminal shows no errors
   - Toast notification says "Success"

---

## 📊 Quick Results Template

Copy and fill this after testing:

```
PHASE 6 QUICK TEST RESULTS
==========================

Date: January 8, 2025
Time Spent: ___ minutes
Tester: ___________

✅ AUTOMATED TESTS
- API responds correctly: YES/NO
- Question paper generated: YES/NO
- Report card generated: YES/NO
- Certificate generated: YES/NO
- Study material generated: YES/NO
- All 5 concurrent requests passed: YES/NO

✅ MANUAL TESTS
- Downloaded files open in Word: YES/NO
- Single column layout visible: YES/NO
- Double column layout visible: YES/NO
- Answers show when selected: YES/NO
- Grades display correctly: YES/NO

⚠️ ISSUES FOUND
1. [Issue]
2. [Issue]

📊 PERFORMANCE
- Fastest generation: ___ ms
- Slowest generation: ___ ms
- Average generation: ___ ms

🎯 OVERALL RESULT
✅ PASS - System is working correctly
❌ FAIL - Issues need fixing

Notes:
_________________________________

```

---

## 🎯 What You're Testing

### Question Paper Generation
- Takes test data from database
- Combines questions into Word document
- Supports single/double column layouts
- Can include/exclude answers
- Downloads automatically

### Report Card Generation
- Fetches student grades from database
- Creates professional grade table
- Calculates percentages
- Includes student information
- Downloads as .docx file

### Certificate Generation
- Creates achievement certificate
- Supports 6 different types
- Customizable achievement text
- Includes date and formatting
- Professional layout

### Study Material Generation
- Exports chapter content
- Includes practice questions
- Double column layout option
- Professional formatting
- Complete with numbering

---

## 📞 Need Help?

1. **Check Documentation**:
   - PHASE6_COMPREHENSIVE_TESTING_PLAN.md
   - PHASE6_MANUAL_TEST_CHECKLIST.md

2. **Check Logs**:
   - Backend: Check terminal where `npm run dev` runs
   - Frontend: Open DevTools (F12 > Console)

3. **Verify Setup**:
   - Both servers running on correct ports
   - Database has test data
   - JWT token is valid and not expired

4. **Last Resort**:
   - Restart both servers
   - Clear browser cache
   - Check internet connection
   - Verify all files in place

---

## ⏱️ Expected Timings

| Task | Time |
|------|------|
| Start servers | 2 min |
| Get JWT token | 2 min |
| Run automated tests | 5 min |
| Manual validation | 20 min |
| Record results | 5 min |
| **TOTAL** | **~35 minutes** |

---

## 🎁 Bonus: Full Test Suite

After quick test passes, run comprehensive tests:
```bash
./PHASE6_API_TEST_SCRIPTS.sh "YOUR_TOKEN"
# Then follow PHASE6_MANUAL_TEST_CHECKLIST.md for all tests
```

---

**Ready? Let's go! Start with Step 1. Good luck! 🚀**


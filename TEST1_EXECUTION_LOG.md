# TEST 1 EXECUTION LOG: Single Column Question Paper

**Date**: January 8, 2025
**Test**: Question Paper - Single Column Layout
**Tester**: [Your Name]
**Start Time**: ___________

---

## 📋 Pre-Test Checklist

Before proceeding, verify:

- [ ] Backend running (should see "✅ Server running on port 5000")
- [ ] Frontend running (should see "Server started at localhost:3000")
- [ ] Browser open to http://localhost:3000
- [ ] You are logged in
- [ ] JWT token obtained and copied
- [ ] You have a test with 10+ questions selected/available

**Status**: Ready to proceed ✅

---

## 🎯 Test 1 Steps

### STEP 1.1: Navigate to Test Details

**What to do:**
1. In your browser, find the Tests/Exams section
2. Look for a test that has 10 or more questions
3. Click on it to open the test details page

**What you should see:**
- Test title displayed
- Questions listed
- Various buttons including "Generate Question Paper"

**Checkpoint 1.1**
- [ ] Test details page is open
- [ ] Test name is visible
- [ ] Questions are listed
- [ ] "Generate Question Paper" button is visible

**Status**: ⏳ Waiting for you to reach this point...

---

### STEP 1.2: Click Generate Dialog Button

**What to do:**
1. Look for the button labeled "Generate Question Paper"
2. Click it

**What you should see:**
- A modal dialog box opens
- The dialog shows the test name
- You see radio buttons for layout selection
- You see a checkbox for "Include Answers"
- You see a text area for instructions

**Checkpoint 1.2**
- [ ] Dialog opens (not blank page or error)
- [ ] Dialog has test name at top
- [ ] Dialog shows form fields
- [ ] No error messages

**Status**: ⏳ Waiting...

---

### STEP 1.3: Select Layout Options

**What to do:**
1. Look for the "Column Layout" section
2. Verify the radio buttons are there:
   - "Single Column" (this one should be selected by default)
   - "Double Column"
3. Verify "Single Column" is selected
4. Verify "Include Answers" checkbox is UNCHECKED (we don't want answers for Test 1)

**What you should see:**
- "Single Column" radio button is selected (filled/highlighted)
- "Include Answers" checkbox is empty/unchecked

**Checkpoint 1.3**
- [ ] "Single Column" is selected
- [ ] "Include Answers" is unchecked
- [ ] No errors

**Status**: ⏳ Waiting...

---

### STEP 1.4: Add Custom Instructions

**What to do:**
1. Look for the text area labeled "Instructions" or "Custom Instructions"
2. Click in the text area
3. Type this text: `Answer all questions clearly and show your work when required`
4. Verify the text appears in the field

**What you should see:**
- The text area becomes active (cursor visible)
- Your typed text appears in the field
- The text is readable

**Checkpoint 1.4**
- [ ] Instructions text area is visible
- [ ] Text was typed successfully
- [ ] Text is readable in the field
- [ ] No character limit errors

**Status**: ⏳ Waiting...

---

### STEP 1.5: Click Generate Button

**What to do:**
1. Look for the button labeled "Generate & Download" or similar
2. Click it
3. Wait for the download to start

**What you should see:**
- The button might show a loading spinner
- A file download should start (check Downloads folder)
- A toast notification should appear (usually at bottom right) saying "Success" or "Question paper generated successfully"

**Important**: The generation typically takes 0.5-2 seconds

**Checkpoint 1.5**
- [ ] Button is clicked
- [ ] No error message appears
- [ ] A toast notification appears
- [ ] Download completes (file appears in Downloads)

**Timing**:
- Start time: ___________
- End time: ___________
- **Duration**: ___ seconds (target: < 2 seconds)

**Status**: ⏳ Waiting...

---

### STEP 1.6: Verify File Downloaded

**What to do:**
1. Check your Downloads folder
2. Look for a file ending in `.docx` (should be recent based on timestamp)

**What you should see:**
- File named something like: `[TestName]_[timestamp].docx`
- File extension is `.docx` (NOT `.doc`)
- File size between 50KB and 500KB
- Recent creation timestamp

**Checkpoint 1.6**
- [ ] File exists in Downloads folder
- [ ] File extension is `.docx`
- [ ] File size is reasonable: ___ KB (should be 50-500 KB)
- [ ] File timestamp is recent

**Status**: ⏳ Waiting...

---

### STEP 1.7: Open File in Microsoft Word

**What to do:**
1. Go to Downloads folder
2. Right-click the .docx file
3. Select "Open with" → "Microsoft Word" (or LibreOffice)
4. Wait for the file to open

**What you should see:**
- Microsoft Word opens
- The document loads
- The content is visible and readable

**Checkpoint 1.7**
- [ ] File opens without errors
- [ ] Content is visible
- [ ] No corruption or strange characters
- [ ] Document is readable

**Status**: ⏳ Waiting...

---

### STEP 1.8: Verify Document Content - Header Section

**In Microsoft Word, check these items:**

**Document Title Section:**
- [ ] Test name appears at the top
- [ ] It's centered
- [ ] It's in a larger, bold font

**Subject/Class Information:**
- [ ] Subject name is displayed
- [ ] Class name is displayed
- [ ] Format: something like "Subject: Mathematics    Class: Grade 10"

**Instructions Section:**
- [ ] "Instructions:" header is visible
- [ ] Your custom text appears: "Answer all questions clearly and show your work when required"
- [ ] Instructions are properly formatted
- [ ] Easy to read

**Example of what it should look like:**
```
                    MATHEMATICS FINAL EXAM

Subject: Mathematics     Class: 10-A     Duration: 60 minutes

Instructions:
Answer all questions clearly and show your work when required

_____________________________________________________________
```

**Checkpoint 1.8**
- [ ] Title present and centered
- [ ] Subject/class info present
- [ ] Instructions section present
- [ ] Your custom instructions visible
- [ ] Professional appearance
- [ ] Horizontal line separator present

**Status**: ⏳ Waiting...

---

### STEP 1.9: Verify Questions Section

**In Microsoft Word, scroll down and check:**

**Question Numbering:**
- [ ] Questions are numbered: 1, 2, 3, 4, etc.
- [ ] Numbering is clear and consistent
- [ ] NOT bullet points or other symbols

**Question Text:**
- [ ] All question text is visible and readable
- [ ] Questions are complete (not cut off)
- [ ] Text is properly formatted
- [ ] No strange characters or corruption

**Question Options:**
- [ ] Options (a, b, c, d) are listed below each question
- [ ] Options are indented slightly
- [ ] Format: "a) Option text"
- [ ] All options present for each question
- [ ] No missing options

**Example of what it should look like:**
```
1. What is the capital of France?
   a) London
   b) Paris
   c) Berlin
   d) Madrid

2. What is 2 + 2?
   a) 3
   b) 4
   c) 5
   d) 6
```

**Checkpoint 1.9**
- [ ] Questions are numbered (1, 2, 3...)
- [ ] Question text is complete and readable
- [ ] Options are listed (a, b, c, d)
- [ ] All options present
- [ ] Format is consistent
- [ ] At least 5 questions visible (scroll to verify more)

**Status**: ⏳ Waiting...

---

### STEP 1.10: Verify No Answers Are Shown

**Critical Check - This is a single column layout WITHOUT answers:**

- [ ] **NO answer keys are visible**
- [ ] **NO "Answer: B" labels**
- [ ] **NO explanations**
- [ ] Only questions and options shown

**What NOT to see:**
- ❌ "Correct Answer: B"
- ❌ "Answer: Option B is correct because..."
- ❌ Blue text indicating answers
- ❌ Any answer-related content

**Checkpoint 1.10**
- [ ] NO answers shown
- [ ] Only questions and options visible
- [ ] Clean, student-ready format

**Status**: ⏳ Waiting...

---

### STEP 1.11: Verify Layout is Single Column

**Verify Single Column Layout:**

**What you should see:**
- Text runs across the full width of the page
- Content is NOT split into 2 columns
- Each line goes from left margin to right margin
- Clear, obvious single column layout

**What NOT to see:**
- ❌ Content split into 2 side-by-side columns
- ❌ Multiple columns of text
- ❌ Column separators

**Checkpoint 1.11**
- [ ] Single column layout is clear
- [ ] Text spans full page width
- [ ] NOT in 2-column format
- [ ] Layout is obvious and correct

**Status**: ⏳ Waiting...

---

### STEP 1.12: Verify Page Numbers and Formatting

**Check Footer and General Formatting:**

**Page Numbers:**
- [ ] Page numbers visible in footer (bottom of page)
- [ ] Format: "Page 1 of 5" or similar
- [ ] Appears on all pages

**Headers:**
- [ ] School name appears at top of each page (if configured)
- [ ] Consistent across pages

**Overall Formatting:**
- [ ] Margins are reasonable (not too wide, not too narrow)
- [ ] Text is readable (good font size)
- [ ] No unusual spacing
- [ ] Professional appearance
- [ ] No overlapping text
- [ ] No text cut off at edges

**Example of professional appearance:**
✅ Clean, readable, well-organized
✅ Proper spacing between elements
✅ Consistent formatting
✅ Professional font choices

**Checkpoint 1.12**
- [ ] Page numbers present
- [ ] Headers consistent
- [ ] Margins reasonable
- [ ] Text readable
- [ ] Professional appearance
- [ ] No formatting errors

**Status**: ⏳ Waiting...

---

## ✅ TEST 1 FINAL VERIFICATION

**All checkpoints completed?**

### Summary Checklist:
- [x] Checkpoint 1.1: Test details page open
- [x] Checkpoint 1.2: Dialog opens
- [x] Checkpoint 1.3: Single column selected
- [x] Checkpoint 1.4: Instructions added
- [x] Checkpoint 1.5: Generate clicked, download started
- [x] Checkpoint 1.6: File downloaded as .docx
- [x] Checkpoint 1.7: File opens in Word
- [x] Checkpoint 1.8: Header/title/instructions present
- [x] Checkpoint 1.9: Questions numbered with options
- [x] Checkpoint 1.10: NO answers shown
- [x] Checkpoint 1.11: Single column layout confirmed
- [x] Checkpoint 1.12: Professional formatting

---

## 📊 TEST 1 RESULTS

**Test Status**: ✅ PASS / ❌ FAIL

### File Details
- **File name**: ___________________
- **File size**: ___ KB (target: 50-500 KB)
- **Generation time**: ___ seconds (target: < 2 seconds)
- **File format**: .docx ✅ / Other ❌

### Content Verification
- **Title present**: ✅ / ❌
- **Subject/Class info**: ✅ / ❌
- **Custom instructions visible**: ✅ / ❌
- **Questions numbered**: ✅ / ❌
- **Options formatted (a,b,c,d)**: ✅ / ❌
- **NO answers shown**: ✅ / ❌
- **Single column layout**: ✅ / ❌
- **Page numbers present**: ✅ / ❌
- **Professional formatting**: ✅ / ❌
- **No errors/corruption**: ✅ / ❌

### Overall Assessment
- **All items verified**: ✅ / ❌
- **Document quality**: Excellent / Good / Fair / Poor
- **Meets requirements**: YES / NO

### Issues Found
- [ ] No issues
- [ ] Issue 1: _____________________
- [ ] Issue 2: _____________________

### Additional Notes
[Space for any observations or problems encountered]

---

## 🎯 TEST 1 CONCLUSION

**Result**: ✅ **PASS** / ❌ **FAIL**

**Assessment**: [Brief summary - is this working correctly?]

**Ready for Test 2**: YES / NO (if NO, note why)

---

**End Time**: ___________
**Total Duration**: ___ minutes
**Tester**: ___________________


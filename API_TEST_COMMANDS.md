# API Testing Commands - Complete Guide

**JWT Token**:
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz...
```

---

## 🔍 STEP 1: Get Database IDs (Run First)

### **Query Students**

```bash
curl -X GET "http://localhost:5000/api/v1/students?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json"
```

**Expected Response:**
```json
{
  "students": [
    {
      "id": "STUDENT_ID_HERE",
      "firstName": "Amit",
      "lastName": "Sharma",
      "admissionNo": "STU2024001"
    }
  ]
}
```

**Copy the `id` value** and use it in tests below.

---

### **Query Tests/Exams**

```bash
curl -X GET "http://localhost:5000/api/v1/tests?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json"
```

**Copy the test `id`**.

---

### **Query Chapters**

```bash
curl -X GET "http://localhost:5000/api/v1/chapters?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json"
```

**Copy the chapter `id`**.

---

### **Query Terms**

```bash
curl -X GET "http://localhost:5000/api/v1/terms?page=1&limit=10" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json"
```

**Copy the term `id`**.

---

## 📝 STEP 2: Save Your IDs

Once you get responses, create a file with your IDs:

```
STUDENT_ID=your_student_id_here
TEST_ID=your_test_id_here
CHAPTER_ID=your_chapter_id_here
TERM_ID=your_term_id_here
TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 🚀 STEP 3: Generate Documents

### **Test 1: Generate Question Paper (Single Column)**

Replace `TEST_ID_HERE` with your actual test ID:

```bash
curl -X POST http://localhost:5000/api/v1/word-generation/question-paper \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "TEST_ID_HERE",
    "title": "Physics Final Exam",
    "instructions": "Answer all questions clearly",
    "columnLayout": "single",
    "includeAnswers": false
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\question_paper_single.docx"
```

**Result**: File downloads to `test-downloads/question_paper_single.docx`

---

### **Test 2: Generate Question Paper (Double Column)**

```bash
curl -X POST http://localhost:5000/api/v1/word-generation/question-paper \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "testId": "TEST_ID_HERE",
    "title": "Physics Final Exam",
    "instructions": "Answer all questions clearly",
    "columnLayout": "double",
    "includeAnswers": true
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\question_paper_double.docx"
```

---

### **Test 3: Generate Report Card**

Replace `STUDENT_ID_HERE` and `TERM_ID_HERE`:

```bash
curl -X POST http://localhost:5000/api/v1/word-generation/report-card \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID_HERE",
    "termId": "TERM_ID_HERE",
    "columnLayout": "single"
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\report_card.docx"
```

---

### **Test 4: Generate Certificate (All 6 Types)**

#### **4a: Participation**
```bash
curl -X POST http://localhost:5000/api/v1/word-generation/certificate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID_HERE",
    "certificateType": "Participation",
    "achievement": "For active participation in Science Club",
    "date": "2025-01-08"
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\cert_participation.docx"
```

#### **4b: Academic Excellence**
```bash
curl -X POST http://localhost:5000/api/v1/word-generation/certificate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID_HERE",
    "certificateType": "Excellence",
    "achievement": "For securing 95% in Physics",
    "date": "2025-01-08"
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\cert_excellence.docx"
```

#### **4c: Perfect Attendance**
```bash
curl -X POST http://localhost:5000/api/v1/word-generation/certificate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID_HERE",
    "certificateType": "Attendance",
    "achievement": "For perfect attendance throughout the term",
    "date": "2025-01-08"
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\cert_attendance.docx"
```

#### **4d: Sports Achievement**
```bash
curl -X POST http://localhost:5000/api/v1/word-generation/certificate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID_HERE",
    "certificateType": "Sports",
    "achievement": "For winning first place in 100m race",
    "date": "2025-01-08"
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\cert_sports.docx"
```

#### **4e: Cultural Achievement**
```bash
curl -X POST http://localhost:5000/api/v1/word-generation/certificate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID_HERE",
    "certificateType": "Cultural",
    "achievement": "For best performance in annual cultural fest",
    "date": "2025-01-08"
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\cert_cultural.docx"
```

#### **4f: Leadership**
```bash
curl -X POST http://localhost:5000/api/v1/word-generation/certificate \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "studentId": "STUDENT_ID_HERE",
    "certificateType": "Leadership",
    "achievement": "For exemplary leadership qualities",
    "date": "2025-01-08"
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\cert_leadership.docx"
```

---

### **Test 5: Generate Study Material**

Replace `CHAPTER_ID_HERE`:

```bash
curl -X POST http://localhost:5000/api/v1/word-generation/study-material \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjVhMTYyZTRkLTAxNDQtNGFmNy1hNWNjLTM1MzNmYmFjNDdjYyIsImVtYWlsIjoiYWRtaW5Ad2ViZXJhY2FkZW15LmVkdSIsInJvbGUiOiJBRE1JTiIsImlhdCI6MTczNjM0MTIzNCwiZXhwIjoxNzM2NDI3NjM0fQ.xyz..." \
  -H "Content-Type: application/json" \
  -d '{
    "chapterId": "CHAPTER_ID_HERE",
    "includeQuestions": true,
    "columnLayout": "double"
  }' \
  -o "D:\Weber-Campus-Management\school-erp\test-downloads\study_material.docx"
```

---

## 📊 Summary

| Test | Command | Output File |
|------|---------|-------------|
| Q.Paper Single | POST /question-paper | question_paper_single.docx |
| Q.Paper Double | POST /question-paper | question_paper_double.docx |
| Report Card | POST /report-card | report_card.docx |
| Certificate (6x) | POST /certificate | cert_*.docx |
| Study Material | POST /study-material | study_material.docx |

---

## ✅ How to Execute

1. **Run query commands first** to get IDs
2. **Replace IDs** in generation commands
3. **Run generation commands**
4. **Check test-downloads folder** for generated files


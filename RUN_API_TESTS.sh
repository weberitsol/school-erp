#!/bin/bash

# API Testing Script for Word Generation System
# This script tests all document generation endpoints

echo "========================================"
echo "Word Generation API Testing"
echo "========================================"
echo ""

# Configuration
BACKEND_URL="http://localhost:5000"
TOKEN="YOUR_JWT_TOKEN_HERE"  # Replace with your actual token from browser localStorage

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test output directory
TEST_DIR="D:\Weber-Campus-Management\school-erp\test-downloads"
mkdir -p "$TEST_DIR"

echo "Backend URL: $BACKEND_URL"
echo "Test Output Directory: $TEST_DIR"
echo ""

# ============================================================
# STEP 1: Query Students
# ============================================================
echo -e "${YELLOW}STEP 1: Querying Students...${NC}"
echo ""

STUDENTS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/v1/students?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Students Response:"
echo "$STUDENTS_RESPONSE" | jq . 2>/dev/null || echo "$STUDENTS_RESPONSE"
echo ""

# Extract first student ID
STUDENT_ID=$(echo "$STUDENTS_RESPONSE" | jq -r '.data[0].id' 2>/dev/null || echo "STUDENT_NOT_FOUND")
echo "Student ID: $STUDENT_ID"
echo ""

# ============================================================
# STEP 2: Query Tests
# ============================================================
echo -e "${YELLOW}STEP 2: Querying Tests...${NC}"
echo ""

TESTS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/v1/tests?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Tests Response:"
echo "$TESTS_RESPONSE" | jq . 2>/dev/null || echo "$TESTS_RESPONSE"
echo ""

TEST_ID=$(echo "$TESTS_RESPONSE" | jq -r '.data[0].id' 2>/dev/null || echo "TEST_NOT_FOUND")
echo "Test ID: $TEST_ID"
echo ""

# ============================================================
# STEP 3: Query Chapters
# ============================================================
echo -e "${YELLOW}STEP 3: Querying Chapters...${NC}"
echo ""

CHAPTERS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/v1/chapters?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Chapters Response:"
echo "$CHAPTERS_RESPONSE" | jq . 2>/dev/null || echo "$CHAPTERS_RESPONSE"
echo ""

CHAPTER_ID=$(echo "$CHAPTERS_RESPONSE" | jq -r '.data[0].id' 2>/dev/null || echo "CHAPTER_NOT_FOUND")
echo "Chapter ID: $CHAPTER_ID"
echo ""

# ============================================================
# STEP 4: Query Terms
# ============================================================
echo -e "${YELLOW}STEP 4: Querying Terms...${NC}"
echo ""

TERMS_RESPONSE=$(curl -s -X GET "$BACKEND_URL/api/v1/terms?page=1&limit=10" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

echo "Terms Response:"
echo "$TERMS_RESPONSE" | jq . 2>/dev/null || echo "$TERMS_RESPONSE"
echo ""

TERM_ID=$(echo "$TERMS_RESPONSE" | jq -r '.data[0].id' 2>/dev/null || echo "TERM_NOT_FOUND")
echo "Term ID: $TERM_ID"
echo ""

# ============================================================
# STEP 5: Generate Documents
# ============================================================
echo -e "${YELLOW}STEP 5: Generating Documents...${NC}"
echo ""

# Test 1: Question Paper - Single Column
echo "Test 1: Question Paper - Single Column"
curl -X POST "$BACKEND_URL/api/v1/word-generation/question-paper" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"testId\": \"$TEST_ID\",
    \"title\": \"Physics Final Exam\",
    \"instructions\": \"Answer all questions clearly\",
    \"columnLayout\": \"single\",
    \"includeAnswers\": false
  }" \
  -o "$TEST_DIR/1_question_paper_single.docx"

if [ -f "$TEST_DIR/1_question_paper_single.docx" ]; then
  SIZE=$(stat -f%z "$TEST_DIR/1_question_paper_single.docx" 2>/dev/null || stat -c%s "$TEST_DIR/1_question_paper_single.docx" 2>/dev/null)
  echo -e "${GREEN}✅ Generated: question_paper_single.docx (${SIZE} bytes)${NC}"
else
  echo -e "${RED}❌ Failed to generate${NC}"
fi
echo ""

# Test 2: Question Paper - Double Column with Answers
echo "Test 2: Question Paper - Double Column with Answers"
curl -X POST "$BACKEND_URL/api/v1/word-generation/question-paper" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"testId\": \"$TEST_ID\",
    \"title\": \"Physics Final Exam - Double Column\",
    \"instructions\": \"Answer all questions clearly with two column layout\",
    \"columnLayout\": \"double\",
    \"includeAnswers\": true
  }" \
  -o "$TEST_DIR/2_question_paper_double.docx"

if [ -f "$TEST_DIR/2_question_paper_double.docx" ]; then
  SIZE=$(stat -f%z "$TEST_DIR/2_question_paper_double.docx" 2>/dev/null || stat -c%s "$TEST_DIR/2_question_paper_double.docx" 2>/dev/null)
  echo -e "${GREEN}✅ Generated: question_paper_double.docx (${SIZE} bytes)${NC}"
else
  echo -e "${RED}❌ Failed to generate${NC}"
fi
echo ""

# Test 3: Report Card
echo "Test 3: Report Card"
curl -X POST "$BACKEND_URL/api/v1/word-generation/report-card" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"studentId\": \"$STUDENT_ID\",
    \"termId\": \"$TERM_ID\",
    \"columnLayout\": \"single\"
  }" \
  -o "$TEST_DIR/3_report_card.docx"

if [ -f "$TEST_DIR/3_report_card.docx" ]; then
  SIZE=$(stat -f%z "$TEST_DIR/3_report_card.docx" 2>/dev/null || stat -c%s "$TEST_DIR/3_report_card.docx" 2>/dev/null)
  echo -e "${GREEN}✅ Generated: report_card.docx (${SIZE} bytes)${NC}"
else
  echo -e "${RED}❌ Failed to generate${NC}"
fi
echo ""

# Test 4: Certificates (6 types)
echo "Test 4: Certificates"

for CERT_TYPE in "Participation" "Excellence" "Attendance" "Sports" "Cultural" "Leadership"; do
  echo "  - Generating $CERT_TYPE certificate..."
  FILENAME=$(echo "$CERT_TYPE" | tr '[:upper:]' '[:lower:]')

  curl -X POST "$BACKEND_URL/api/v1/word-generation/certificate" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d "{
      \"studentId\": \"$STUDENT_ID\",
      \"certificateType\": \"$CERT_TYPE\",
      \"achievement\": \"For outstanding achievement in $CERT_TYPE\",
      \"date\": \"2025-01-08\"
    }" \
    -o "$TEST_DIR/4_cert_${filename}.docx"

  if [ -f "$TEST_DIR/4_cert_${filename}.docx" ]; then
    SIZE=$(stat -f%z "$TEST_DIR/4_cert_${filename}.docx" 2>/dev/null || stat -c%s "$TEST_DIR/4_cert_${filename}.docx" 2>/dev/null)
    echo -e "${GREEN}    ✅ $CERT_TYPE (${SIZE} bytes)${NC}"
  else
    echo -e "${RED}    ❌ $CERT_TYPE failed${NC}"
  fi
done
echo ""

# Test 5: Study Material
echo "Test 5: Study Material"
curl -X POST "$BACKEND_URL/api/v1/word-generation/study-material" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"chapterId\": \"$CHAPTER_ID\",
    \"includeQuestions\": true,
    \"columnLayout\": \"double\"
  }" \
  -o "$TEST_DIR/5_study_material.docx"

if [ -f "$TEST_DIR/5_study_material.docx" ]; then
  SIZE=$(stat -f%z "$TEST_DIR/5_study_material.docx" 2>/dev/null || stat -c%s "$TEST_DIR/5_study_material.docx" 2>/dev/null)
  echo -e "${GREEN}✅ Generated: study_material.docx (${SIZE} bytes)${NC}"
else
  echo -e "${RED}❌ Failed to generate${NC}"
fi
echo ""

# ============================================================
# FINAL SUMMARY
# ============================================================
echo -e "${YELLOW}========================================"
echo "Test Results Summary"
echo "========================================${NC}"
echo ""
echo "Test Output Directory: $TEST_DIR"
echo ""

FILE_COUNT=$(find "$TEST_DIR" -type f -name "*.docx" 2>/dev/null | wc -l)
echo -e "Total .docx files generated: ${GREEN}$FILE_COUNT${NC}"
echo ""

echo "Generated files:"
ls -lh "$TEST_DIR"/*.docx 2>/dev/null || echo "No files found"
echo ""

echo -e "${GREEN}Testing Complete!${NC}"
echo ""


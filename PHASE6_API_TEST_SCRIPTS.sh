#!/bin/bash

################################################################################
# Phase 6: API Testing Scripts
# Word Document Generation & Storage System
# January 8, 2025
################################################################################

# Configuration
API_BASE_URL="http://localhost:5000/api/v1"
JWT_TOKEN="${1:-your_jwt_token_here}"
OUTPUT_DIR="./test-downloads"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Create output directory
mkdir -p "$OUTPUT_DIR"

################################################################################
# UTILITY FUNCTIONS
################################################################################

print_section() {
    echo -e "\n${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC} $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}\n"
}

print_test() {
    echo -e "${YELLOW}→ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

check_server() {
    print_test "Checking if server is running..."
    if curl -s "$API_BASE_URL/documents" -H "Authorization: Bearer $JWT_TOKEN" > /dev/null 2>&1; then
        print_success "Server is running"
        return 0
    else
        print_error "Server is not running. Start it with: cd backend && npm run dev"
        return 1
    fi
}

check_token() {
    if [ "$JWT_TOKEN" = "your_jwt_token_here" ]; then
        print_error "JWT token not provided. Usage: $0 YOUR_JWT_TOKEN"
        return 1
    fi
    print_success "JWT token provided: ${JWT_TOKEN:0:20}..."
    return 0
}

################################################################################
# QUESTION PAPER GENERATION TESTS
################################################################################

test_question_paper_single_column() {
    print_section "Test 1: Question Paper - Single Column Layout"

    local test_id="test-001"
    local test_name="Mathematics Final Exam"

    print_test "Generating question paper (single column)..."

    local start_time=$(date +%s%N)

    local response=$(curl -s -X POST "$API_BASE_URL/word-generation/question-paper" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"testId\": \"$test_id\",
            \"title\": \"$test_name\",
            \"instructions\": \"Answer all questions. Show working for all calculations.\",
            \"columnLayout\": \"single\",
            \"includeAnswers\": false
        }" \
        -w "\n%{http_code}" \
        -o "$OUTPUT_DIR/question_paper_single.docx")

    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))

    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        local file_size=$(ls -lh "$OUTPUT_DIR/question_paper_single.docx" | awk '{print $5}')
        print_success "Question paper generated successfully"
        print_info "Duration: ${duration}ms | File size: $file_size"
        return 0
    else
        print_error "Failed to generate question paper. HTTP Code: $http_code"
        return 1
    fi
}

test_question_paper_double_column() {
    print_section "Test 2: Question Paper - Double Column Layout"

    local test_id="test-001"
    local test_name="Mathematics Final Exam"

    print_test "Generating question paper (double column)..."

    local start_time=$(date +%s%N)

    local response=$(curl -s -X POST "$API_BASE_URL/word-generation/question-paper" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"testId\": \"$test_id\",
            \"title\": \"$test_name\",
            \"instructions\": \"Answer all questions. Show working for all calculations.\",
            \"columnLayout\": \"double\",
            \"includeAnswers\": true
        }" \
        -w "\n%{http_code}" \
        -o "$OUTPUT_DIR/question_paper_double.docx")

    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))

    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        local file_size=$(ls -lh "$OUTPUT_DIR/question_paper_double.docx" | awk '{print $5}')
        print_success "Question paper generated successfully"
        print_info "Duration: ${duration}ms | File size: $file_size"
        return 0
    else
        print_error "Failed to generate question paper. HTTP Code: $http_code"
        return 1
    fi
}

################################################################################
# REPORT CARD GENERATION TESTS
################################################################################

test_report_card() {
    print_section "Test 3: Report Card Generation"

    local student_id="student-001"
    local term_id="term-001"

    print_test "Generating report card..."

    local start_time=$(date +%s%N)

    local response=$(curl -s -X POST "$API_BASE_URL/word-generation/report-card" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"studentId\": \"$student_id\",
            \"termId\": \"$term_id\",
            \"columnLayout\": \"single\"
        }" \
        -w "\n%{http_code}" \
        -o "$OUTPUT_DIR/report_card.docx")

    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))

    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        local file_size=$(ls -lh "$OUTPUT_DIR/report_card.docx" | awk '{print $5}')
        print_success "Report card generated successfully"
        print_info "Duration: ${duration}ms | File size: $file_size"
        return 0
    else
        print_error "Failed to generate report card. HTTP Code: $http_code"
        return 1
    fi
}

################################################################################
# CERTIFICATE GENERATION TESTS
################################################################################

test_certificate() {
    print_section "Test 4: Certificate Generation"

    local student_id="student-001"

    print_test "Generating certificate..."

    local start_time=$(date +%s%N)

    local response=$(curl -s -X POST "$API_BASE_URL/word-generation/certificate" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"studentId\": \"$student_id\",
            \"certificateType\": \"Excellence\",
            \"achievement\": \"For outstanding performance in Mathematics\",
            \"date\": \"2025-01-08\"
        }" \
        -w "\n%{http_code}" \
        -o "$OUTPUT_DIR/certificate.docx")

    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))

    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        local file_size=$(ls -lh "$OUTPUT_DIR/certificate.docx" | awk '{print $5}')
        print_success "Certificate generated successfully"
        print_info "Duration: ${duration}ms | File size: $file_size"
        return 0
    else
        print_error "Failed to generate certificate. HTTP Code: $http_code"
        return 1
    fi
}

################################################################################
# STUDY MATERIAL GENERATION TESTS
################################################################################

test_study_material() {
    print_section "Test 5: Study Material Generation"

    local chapter_id="chapter-001"

    print_test "Generating study material..."

    local start_time=$(date +%s%N)

    local response=$(curl -s -X POST "$API_BASE_URL/word-generation/study-material" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"chapterId\": \"$chapter_id\",
            \"includeQuestions\": true,
            \"columnLayout\": \"double\"
        }" \
        -w "\n%{http_code}" \
        -o "$OUTPUT_DIR/study_material.docx")

    local end_time=$(date +%s%N)
    local duration=$(( (end_time - start_time) / 1000000 ))

    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        local file_size=$(ls -lh "$OUTPUT_DIR/study_material.docx" | awk '{print $5}')
        print_success "Study material generated successfully"
        print_info "Duration: ${duration}ms | File size: $file_size"
        return 0
    else
        print_error "Failed to generate study material. HTTP Code: $http_code"
        return 1
    fi
}

################################################################################
# LIST AND DOWNLOAD TESTS
################################################################################

test_list_documents() {
    print_section "Test 6: List Generated Documents"

    print_test "Fetching list of generated documents..."

    local response=$(curl -s -X GET "$API_BASE_URL/word-generation/generated-documents?page=1&limit=10" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json")

    local count=$(echo "$response" | grep -o '"id"' | wc -l)

    if [ $count -gt 0 ]; then
        print_success "Retrieved document list"
        print_info "Found $count documents"

        # Extract first document ID for download test
        local first_doc_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        echo "$first_doc_id"
        return 0
    else
        print_error "Failed to retrieve document list"
        return 1
    fi
}

test_download_document() {
    print_section "Test 7: Download Generated Document"

    local doc_id="$1"

    if [ -z "$doc_id" ]; then
        print_error "Document ID not provided"
        return 1
    fi

    print_test "Downloading document: $doc_id..."

    local response=$(curl -s -X GET "$API_BASE_URL/word-generation/generated-documents/$doc_id/download" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -w "\n%{http_code}" \
        -o "$OUTPUT_DIR/downloaded_document.docx")

    local http_code=$(echo "$response" | tail -n 1)

    if [ "$http_code" = "200" ]; then
        local file_size=$(ls -lh "$OUTPUT_DIR/downloaded_document.docx" | awk '{print $5}')
        print_success "Document downloaded successfully"
        print_info "File size: $file_size"
        return 0
    else
        print_error "Failed to download document. HTTP Code: $http_code"
        return 1
    fi
}

################################################################################
# PERFORMANCE TESTING
################################################################################

test_concurrent_requests() {
    print_section "Test 8: Concurrent Request Handling"

    local concurrent_count=5
    local test_id="test-001"

    print_test "Sending $concurrent_count concurrent requests..."

    local start_time=$(date +%s%N)

    for i in $(seq 1 $concurrent_count); do
        curl -s -X POST "$API_BASE_URL/word-generation/question-paper" \
            -H "Authorization: Bearer $JWT_TOKEN" \
            -H "Content-Type: application/json" \
            -d "{
                \"testId\": \"$test_id\",
                \"columnLayout\": \"single\",
                \"includeAnswers\": false
            }" \
            -o "$OUTPUT_DIR/concurrent_$i.docx" &
    done

    wait

    local end_time=$(date +%s%N)
    local total_duration=$(( (end_time - start_time) / 1000000 ))

    local success_count=0
    for i in $(seq 1 $concurrent_count); do
        if [ -f "$OUTPUT_DIR/concurrent_$i.docx" ] && [ -s "$OUTPUT_DIR/concurrent_$i.docx" ]; then
            ((success_count++))
        fi
    done

    if [ $success_count -eq $concurrent_count ]; then
        print_success "All concurrent requests completed successfully"
        print_info "Duration: ${total_duration}ms for $concurrent_count requests (${total_duration}ms avg per request)"
        return 0
    else
        print_error "$success_count of $concurrent_count requests succeeded"
        return 1
    fi
}

################################################################################
# ERROR HANDLING TESTS
################################################################################

test_invalid_test_id() {
    print_section "Test 9: Error Handling - Invalid Test ID"

    print_test "Attempting to generate with invalid test ID..."

    local response=$(curl -s -X POST "$API_BASE_URL/word-generation/question-paper" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"testId\": \"invalid-uuid\",
            \"columnLayout\": \"single\"
        }")

    if echo "$response" | grep -q "error\|Error\|not found"; then
        print_success "Error handled gracefully"
        print_info "Response: $response"
        return 0
    else
        print_error "Error not handled properly"
        return 1
    fi
}

test_missing_required_field() {
    print_section "Test 10: Error Handling - Missing Required Field"

    print_test "Attempting to generate without testId..."

    local response=$(curl -s -X POST "$API_BASE_URL/word-generation/question-paper" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d "{
            \"columnLayout\": \"single\"
        }")

    if echo "$response" | grep -q "required\|Required"; then
        print_success "Validation error handled gracefully"
        print_info "Response: $response"
        return 0
    else
        print_error "Validation error not handled properly"
        return 1
    fi
}

################################################################################
# MAIN EXECUTION
################################################################################

main() {
    print_section "Phase 6: Word Generation API Testing"
    print_info "API Base URL: $API_BASE_URL"
    print_info "Output Directory: $OUTPUT_DIR"

    # Check prerequisites
    echo ""
    check_token || exit 1
    check_server || exit 1

    # Run tests
    echo ""
    test_question_paper_single_column
    echo ""
    test_question_paper_double_column
    echo ""
    test_report_card
    echo ""
    test_certificate
    echo ""
    test_study_material
    echo ""

    # Get document ID for download test
    doc_id=$(test_list_documents)
    if [ ! -z "$doc_id" ]; then
        echo ""
        test_download_document "$doc_id"
    fi

    echo ""
    test_concurrent_requests
    echo ""
    test_invalid_test_id
    echo ""
    test_missing_required_field

    # Summary
    echo ""
    print_section "Test Execution Complete"
    print_info "Generated documents are in: $OUTPUT_DIR"
    print_info "Review the files to verify formatting and content"
    echo ""
}

# Run main function
main "$@"

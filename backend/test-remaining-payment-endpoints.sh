#!/bin/bash

echo "=== REMAINING PAYMENT ENDPOINT TESTS ==="
echo ""

# Get token
TOKEN=$(curl -s -X POST "http://localhost:5000/api/v1/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@weberacademy.edu","password":"admin123"}' | grep -o '"accessToken":"[^"]*' | head -1 | cut -d'"' -f4)

echo "Auth token obtained: ${TOKEN:0:50}..."
echo ""

# Test 1: Pending dues for all students
echo "TEST 1: PENDING DUES (No Filter)"
echo "GET /api/v1/fees/dues"
echo ""
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5000/api/v1/fees/dues" | head -500
echo ""
echo ""

# Test 2: Pending dues for specific student
echo "TEST 2: PENDING DUES (Specific Student)"
echo "GET /api/v1/fees/dues?studentId=be0ff7be-d10d-45c9-8395-b46717152553"
echo ""
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5000/api/v1/fees/dues?studentId=be0ff7be-d10d-45c9-8395-b46717152553" | head -500
echo ""
echo ""

# Test 3: Payment report for current month
echo "TEST 3: PAYMENT REPORT (Current Month)"
START_DATE=$(date -u +"%Y-%m-01T00:00:00Z")
END_DATE=$(date -u +"%Y-%m-%dT23:59:59Z")
echo "GET /api/v1/fees/report?dateFrom=$START_DATE&dateTo=$END_DATE"
echo ""
curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5000/api/v1/fees/report?dateFrom=$START_DATE&dateTo=$END_DATE" | head -500
echo ""
echo ""

# Test 4: Record multiple payments with different methods
echo "TEST 4: RECORD MULTIPLE PAYMENTS"
echo ""

# Payment 2 - Card method
echo "Recording Payment 2 (CARD method)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:5000/api/v1/fees/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId":"be0ff7be-d10d-45c9-8395-b46717152553",
    "feeStructureId":"2e90e0ad-b502-48a4-beb9-594658483aeb",
    "amount":1500,
    "paymentMethod":"CARD",
    "transactionId":"TXN20251230001"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Payment recorded successfully"
  RECEIPT_NO=$(echo "$BODY" | grep -o '"receiptNo":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "   Receipt: $RECEIPT_NO"
else
  echo "❌ Failed to record payment"
  echo "$BODY" | head -200
fi
echo ""

# Payment 3 - Online method
echo "Recording Payment 3 (ONLINE method)..."
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "http://localhost:5000/api/v1/fees/payments" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "studentId":"be0ff7be-d10d-45c9-8395-b46717152553",
    "feeStructureId":"2e90e0ad-b502-48a4-beb9-594658483aeb",
    "amount":3000,
    "paymentMethod":"ONLINE",
    "transactionId":"TXN20251230002",
    "remarks":"Online payment via gateway"
  }')

HTTP_CODE=$(echo "$RESPONSE" | tail -1)
BODY=$(echo "$RESPONSE" | head -n -1)
echo "Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "201" ]; then
  echo "✅ Payment recorded successfully"
  RECEIPT_NO=$(echo "$BODY" | grep -o '"receiptNo":"[^"]*' | head -1 | cut -d'"' -f4)
  echo "   Receipt: $RECEIPT_NO"
else
  echo "❌ Failed to record payment"
  echo "$BODY" | head -200
fi
echo ""
echo ""

# Test 5: Verify all payments are now listed
echo "TEST 5: LIST ALL PAYMENTS (After Recording)"
echo "GET /api/v1/fees/payments"
echo ""
RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5000/api/v1/fees/payments")
echo "$RESPONSE" | head -500
PAYMENT_COUNT=$(echo "$RESPONSE" | grep -o '"receiptNo"' | wc -l)
echo ""
echo "📊 Total payments now: $PAYMENT_COUNT"
echo ""
echo ""

# Test 6: Test payment methods distribution
echo "TEST 6: PAYMENT METHODS DISTRIBUTION"
echo ""
for METHOD in "CASH" "CARD" "UPI" "BANK_TRANSFER" "CHEQUE" "ONLINE"; do
  echo "Payments by method: $METHOD"
  RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "http://localhost:5000/api/v1/fees/payments?paymentMethod=$METHOD")
  COUNT=$(echo "$RESPONSE" | grep -o '"paymentMethod":"'$METHOD'"' | wc -l)
  echo "  Count: $COUNT"
done
echo ""

echo "=== ALL REMAINING TESTS COMPLETED ==="
